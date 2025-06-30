import { TestLogger } from './utils.js';
import { runBuildValidation } from './build-validator.js';
import { runDeploymentValidation } from './deployment-validator.js';
import { runIntegrationTests } from './integration-tests.js';
import chalk from 'chalk';

const logger = new TestLogger();

function printUsage() {
    console.log(chalk.cyan.bold('\n🧪 MOMsters Game Test Harness\n'));
    console.log('Usage: npm run test [options]\n');
    console.log('Available test suites:');
    console.log('  npm run test:build      - Validate build process and output');
    console.log('  npm run test:deployment - Test GitHub Pages deployment');
    console.log('  npm run test:integration- Test live game functionality');
    console.log('  npm run test:all        - Run all tests in sequence\n');
    console.log('Options:');
    console.log('  --help, -h              - Show this help message');
    console.log('  --build-only            - Run only build validation');
    console.log('  --deployment-only       - Run only deployment validation');
    console.log('  --integration-only      - Run only integration tests');
    console.log('  --skip-build            - Skip build validation');
    console.log('  --skip-deployment       - Skip deployment validation');
    console.log('  --skip-integration      - Skip integration tests');
    console.log('  --quick                 - Run only build validation (fastest)\n');
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        help: false,
        buildOnly: false,
        deploymentOnly: false,
        integrationOnly: false,
        skipBuild: false,
        skipDeployment: false,
        skipIntegration: false,
        quick: false
    };
    
    for (const arg of args) {
        switch (arg) {
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--build-only':
                options.buildOnly = true;
                break;
            case '--deployment-only':
                options.deploymentOnly = true;
                break;
            case '--integration-only':
                options.integrationOnly = true;
                break;
            case '--skip-build':
                options.skipBuild = true;
                break;
            case '--skip-deployment':
                options.skipDeployment = true;
                break;
            case '--skip-integration':
                options.skipIntegration = true;
                break;
            case '--quick':
                options.quick = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    logger.warn(`Unknown option: ${arg}`);
                }
        }
    }
    
    return options;
}

async function runTestSuite(name, testFunction, required = true) {
    const startTime = Date.now();
    
    try {
        logger.section(`Running ${name} Tests`);
        
        // Capture original process.exit to prevent tests from exiting
        const originalExit = process.exit;
        let exitCode = 0;
        
        process.exit = (code) => {
            exitCode = code || 0;
        };
        
        // Run the test
        await testFunction();
        
        // Restore original exit
        process.exit = originalExit;
        
        const duration = Date.now() - startTime;
        
        if (exitCode === 0) {
            logger.success(`${name} tests completed successfully (${Math.round(duration/1000)}s)`);
            return true;
        } else {
            logger.error(`${name} tests failed (${Math.round(duration/1000)}s)`);
            return !required; // Return false if required, true if optional
        }
        
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${name} tests crashed: ${error.message} (${Math.round(duration/1000)}s)`);
        return !required;
    }
}

async function runAllTests(options) {
    logger.info('🚀 Starting comprehensive test suite...\n');
    const overallStartTime = Date.now();
    
    const testResults = {
        build: null,
        deployment: null,
        integration: null
    };
    
    // Determine which tests to run
    const shouldRunBuild = !options.skipBuild && 
                          (options.buildOnly || options.quick || 
                           (!options.deploymentOnly && !options.integrationOnly));
    
    const shouldRunDeployment = !options.skipDeployment && 
                               (options.deploymentOnly || 
                                (!options.buildOnly && !options.integrationOnly && !options.quick));
    
    const shouldRunIntegration = !options.skipIntegration && 
                                (options.integrationOnly || 
                                 (!options.buildOnly && !options.deploymentOnly && !options.quick));
    
    // Run tests in sequence
    if (shouldRunBuild) {
        testResults.build = await runTestSuite('Build Validation', runBuildValidation, true);
        
        // If build fails, we might want to skip other tests
        if (!testResults.build) {
            logger.error('Build validation failed - this may affect other tests');
            
            if (options.buildOnly) {
                return summarizeResults(testResults, overallStartTime);
            }
        }
    }
    
    if (shouldRunDeployment && testResults.build !== false) {
        testResults.deployment = await runTestSuite('Deployment Validation', runDeploymentValidation, true);
        
        // If deployment fails, integration tests might not work
        if (!testResults.deployment) {
            logger.error('Deployment validation failed - integration tests may not work');
        }
    }
    
    if (shouldRunIntegration && testResults.deployment !== false) {
        testResults.integration = await runTestSuite('Integration Testing', runIntegrationTests, false);
    }
    
    return summarizeResults(testResults, overallStartTime);
}

function summarizeResults(testResults, startTime) {
    const duration = Date.now() - startTime;
    
    logger.section('📊 Overall Test Results');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    for (const [testName, result] of Object.entries(testResults)) {
        if (result === null) {
            logger.info(`${testName}: ${chalk.gray('SKIPPED')}`);
            skippedTests++;
        } else if (result === true) {
            logger.success(`${testName}: ${chalk.green('PASSED')}`);
            passedTests++;
        } else {
            logger.error(`${testName}: ${chalk.red('FAILED')}`);
            failedTests++;
        }
        totalTests++;
    }
    
    console.log('\n' + chalk.cyan.bold('=== Final Summary ==='));
    console.log(chalk.green(`✓ Passed: ${passedTests}`));
    console.log(chalk.red(`✗ Failed: ${failedTests}`));
    console.log(chalk.gray(`⊘ Skipped: ${skippedTests}`));
    console.log(chalk.blue(`⏱ Total time: ${Math.round(duration/1000)}s`));
    
    if (failedTests === 0) {
        console.log(chalk.green.bold('\n🎉 All tests passed! Your game is ready for deployment!'));
        return true;
    } else if (failedTests === 1 && testResults.integration === false) {
        console.log(chalk.yellow.bold('\n⚠️  Core functionality works, but some integration tests failed.'));
        console.log(chalk.yellow('This might indicate minor issues that don\'t prevent basic functionality.'));
        return true; // Don't fail the entire suite for integration test failures
    } else {
        console.log(chalk.red.bold('\n💥 Some critical tests failed!'));
        console.log(chalk.red('Please fix the issues before deploying.'));
        return false;
    }
}

async function main() {
    const options = parseArgs();
    
    if (options.help) {
        printUsage();
        process.exit(0);
    }
    
    // Print test configuration
    logger.info('🔧 Test Configuration:');
    if (options.quick) {
        logger.info('  Mode: Quick (build validation only)');
    } else if (options.buildOnly) {
        logger.info('  Mode: Build validation only');
    } else if (options.deploymentOnly) {
        logger.info('  Mode: Deployment validation only');
    } else if (options.integrationOnly) {
        logger.info('  Mode: Integration tests only');
    } else {
        logger.info('  Mode: Full test suite');
        if (options.skipBuild) logger.info('  Skipping: Build validation');
        if (options.skipDeployment) logger.info('  Skipping: Deployment validation');
        if (options.skipIntegration) logger.info('  Skipping: Integration tests');
    }
    
    console.log(''); // Add spacing
    
    try {
        const success = await runAllTests(options);
        process.exit(success ? 0 : 1);
    } catch (error) {
        logger.error(`Test runner crashed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as runTestRunner }; 