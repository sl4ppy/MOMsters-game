import { TestLogger, fileExists, readFile, getFileSize, listFiles, extractAssetPath, validateAssetPath } from './utils.js';
import { execSync } from 'child_process';
import path from 'path';

const logger = new TestLogger();
const EXPECTED_BASE_PATH = '/MOMsters-game/';
const MIN_JS_SIZE = 500000; // 500KB minimum for the game bundle

async function validateBuildProcess() {
    logger.section('Build Process Validation');
    
    try {
        // Clean any existing dist folder
        logger.info('Cleaning existing build...');
        try {
            // Use cross-platform command
            execSync('rmdir /s /q dist', { stdio: 'ignore' });
        } catch {
            try {
                execSync('rm -rf dist', { stdio: 'ignore' });
            } catch {
                // Ignore errors if dist doesn't exist
            }
        }
        
        // Run the build
        logger.info('Running build process...');
        const buildOutput = execSync('npm run build', { encoding: 'utf8', timeout: 60000 });
        
        if (buildOutput.includes('built in')) {
            logger.success('Build process completed successfully');
            return true;
        } else {
            logger.error('Build process did not complete properly');
            return false;
        }
    } catch (error) {
        logger.error(`Build process failed: ${error.message}`);
        return false;
    }
}

function validateDistStructure() {
    logger.section('Distribution Folder Structure');
    
    // Check if dist folder exists
    if (!fileExists('dist')) {
        logger.error('dist/ folder not found');
        return false;
    }
    logger.success('dist/ folder exists');
    
    // Check if index.html exists
    if (!fileExists('dist/index.html')) {
        logger.error('dist/index.html not found');
        return false;
    }
    logger.success('dist/index.html exists');
    
    // Check if assets folder exists
    if (!fileExists('dist/assets')) {
        logger.error('dist/assets/ folder not found');
        return false;
    }
    logger.success('dist/assets/ folder exists');
    
    // Check for JavaScript files
    const jsFiles = listFiles('dist/assets', '.js');
    if (jsFiles.length === 0) {
        logger.error('No JavaScript files found in dist/assets/');
        return false;
    }
    logger.success(`Found ${jsFiles.length} JavaScript file(s): ${jsFiles.join(', ')}`);
    
    return true;
}

function validateHtmlContent() {
    logger.section('HTML Content Validation');
    
    try {
        const htmlContent = readFile('dist/index.html');
        
        // Check for cache-busting headers
        const cacheHeaders = [
            'Cache-Control',
            'Pragma',
            'Expires',
            'cache-bust'
        ];
        
        for (const header of cacheHeaders) {
            if (htmlContent.includes(header)) {
                logger.success(`Cache-busting header '${header}' found`);
            } else {
                logger.error(`Cache-busting header '${header}' missing`);
                return false;
            }
        }
        
        // Check title
        if (htmlContent.includes('MOMsters - Survival Arena')) {
            logger.success('Correct title found');
        } else {
            logger.error('Title not updated to "MOMsters - Survival Arena"');
            return false;
        }
        
        // Extract and validate asset path
        const assetPath = extractAssetPath(htmlContent);
        if (!assetPath) {
            logger.error('No JavaScript asset path found in HTML');
            return false;
        }
        
        if (validateAssetPath(assetPath, EXPECTED_BASE_PATH)) {
            logger.success(`Asset path is correct: ${assetPath}`);
        } else {
            logger.error(`Asset path is incorrect: ${assetPath} (should start with ${EXPECTED_BASE_PATH})`);
            return false;
        }
        
        // Check for timestamp in asset path (cache-busting)
        if (assetPath.match(/-\d{13}\.js$/)) {
            logger.success('Asset has timestamp for cache-busting');
        } else {
            logger.warn('Asset path does not include timestamp - cache-busting might not be effective');
        }
        
        return true;
    } catch (error) {
        logger.error(`Failed to validate HTML content: ${error.message}`);
        return false;
    }
}

function validateAssetFiles() {
    logger.section('Asset File Validation');
    
    try {
        const jsFiles = listFiles('dist/assets', '.js');
        let allValid = true;
        
        for (const jsFile of jsFiles) {
            const filePath = path.join('dist/assets', jsFile);
            const fileSize = getFileSize(filePath);
            
            if (fileSize === 0) {
                logger.error(`${jsFile} is empty`);
                allValid = false;
            } else if (fileSize < MIN_JS_SIZE) {
                logger.warn(`${jsFile} is smaller than expected (${fileSize} bytes)`);
            } else {
                logger.success(`${jsFile} is valid (${Math.round(fileSize / 1024)}KB)`);
            }
            
            // Check if file contains game-related content
            try {
                const content = readFile(filePath);
                const gameKeywords = ['PIXI', 'Application', 'Sprite', 'Container'];
                const foundKeywords = gameKeywords.filter(keyword => content.includes(keyword));
                
                if (foundKeywords.length > 0) {
                    logger.success(`${jsFile} contains game engine code (${foundKeywords.join(', ')})`);
                } else {
                    logger.warn(`${jsFile} might not contain expected game code`);
                }
            } catch (error) {
                logger.error(`Failed to analyze ${jsFile}: ${error.message}`);
                allValid = false;
            }
        }
        
        return allValid;
    } catch (error) {
        logger.error(`Failed to validate asset files: ${error.message}`);
        return false;
    }
}

function validateConfigConsistency() {
    logger.section('Configuration Consistency');
    
    try {
        // Check vite.config.ts for correct base path
        const viteConfig = readFile('vite.config.ts');
        if (viteConfig.includes("'/MOMsters-game/'")) {
            logger.success('Vite config has correct base path');
        } else {
            logger.error('Vite config base path might be incorrect');
            return false;
        }
        
        // Check for cache-busting configuration
        if (viteConfig.includes('Date.now()')) {
            logger.success('Vite config includes cache-busting');
        } else {
            logger.warn('Vite config might not include cache-busting');
        }
        
        return true;
    } catch (error) {
        logger.error(`Failed to validate configuration: ${error.message}`);
        return false;
    }
}

async function runBuildValidation() {
    logger.info('Starting build validation tests...\n');
    
    const results = await Promise.all([
        validateBuildProcess(),
        validateDistStructure(),
        validateHtmlContent(),
        validateAssetFiles(),
        validateConfigConsistency()
    ]);
    
    const success = logger.summary();
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runBuildValidation().catch(error => {
        console.error('Build validation failed:', error);
        process.exit(1);
    });
} else if (process.argv[1] && process.argv[1].includes('build-validator.js')) {
    // Alternative check for Windows paths
    runBuildValidation().catch(error => {
        console.error('Build validation failed:', error);
        process.exit(1);
    });
}

export { runBuildValidation }; 