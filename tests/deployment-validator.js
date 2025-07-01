import { TestLogger, httpGet, extractAssetPath, validateAssetPath, sleep } from './utils.js';
import { execSync } from 'child_process';

const logger = new TestLogger();
const GITHUB_PAGES_URL = 'https://sl4ppy.github.io/MOMsters-game/';
const EXPECTED_BASE_PATH = '/MOMsters-game/';
const DEPLOYMENT_TIMEOUT = 300000; // 5 minutes
const RETRY_DELAY = 10000; // 10 seconds

async function validateDeploymentProcess() {
    logger.section('Deployment Process Validation');
    
    // Check if we're in a CI environment or have GitHub credentials
    const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
    const hasGitCredentials = process.env.GITHUB_TOKEN;
    
    if (!isCI && !hasGitCredentials) {
        logger.warn('Skipping actual deployment - no GitHub credentials detected');
        logger.info('This test requires GitHub authentication to deploy');
        logger.info('In CI/CD environment, this would deploy to GitHub Pages');
        
        // Instead, just validate the build process
        try {
            logger.info('Running build validation instead...');
            const buildOutput = execSync('npm run build', { 
                encoding: 'utf8', 
                timeout: 60000 // 1 minute
            });
            
            if (buildOutput.includes('built in')) {
                logger.success('Build process completed successfully (deployment simulated)');
                return true;
            } else {
                logger.error('Build process failed');
                return false;
            }
        } catch (error) {
            logger.error(`Build process failed: ${error.message}`);
            return false;
        }
    }
    
    try {
        logger.info('Running deployment process...');
        const deployOutput = execSync('npm run deploy', { 
            encoding: 'utf8', 
            timeout: 180000 // 3 minutes
        });
        
        if (deployOutput.includes('Published')) {
            logger.success('Deployment process completed successfully');
            return true;
        } else {
            logger.error('Deployment process did not complete properly');
            logger.info('Deploy output:', deployOutput);
            return false;
        }
    } catch (error) {
        logger.error(`Deployment process failed: ${error.message}`);
        return false;
    }
}

async function waitForDeploymentPropagation() {
    logger.section('Deployment Propagation Check');
    
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.floor(DEPLOYMENT_TIMEOUT / RETRY_DELAY);
    
    while (attempts < maxAttempts) {
        attempts++;
        const elapsed = Date.now() - startTime;
        
        logger.info(`Attempt ${attempts}/${maxAttempts} - Checking deployment (${Math.round(elapsed/1000)}s elapsed)...`);
        
        const response = await httpGet(GITHUB_PAGES_URL);
        
        if (response.status === 200) {
            // Check if we're getting the new content (not cached)
            if (response.text.includes('MOMsters - Survival Arena')) {
                logger.success(`Deployment is live and accessible (took ${Math.round(elapsed/1000)}s)`);
                return { success: true, response };
            } else {
                logger.warn('Site is accessible but content appears to be cached');
            }
        } else if (response.status === 404) {
            logger.info(`Site not yet available (404) - waiting ${RETRY_DELAY/1000}s...`);
        } else if (response.error) {
            logger.warn(`Network error: ${response.error} - retrying...`);
        } else {
            logger.warn(`Unexpected response: ${response.status} ${response.statusText}`);
        }
        
        if (attempts < maxAttempts) {
            await sleep(RETRY_DELAY);
        }
    }
    
    logger.error(`Deployment did not become accessible within ${DEPLOYMENT_TIMEOUT/1000}s`);
    return { success: false, response: null };
}

async function validateLiveHtmlContent(htmlContent) {
    logger.section('Live HTML Content Validation');
    
    // Check title
    if (htmlContent.includes('MOMsters - Survival Arena')) {
        logger.success('Correct title found in live site');
    } else {
        logger.error('Title not correct in live site - might be cached');
        return false;
    }
    
    // Check for cache-busting headers
    const cacheHeaders = ['Cache-Control', 'Pragma', 'Expires'];
    for (const header of cacheHeaders) {
        if (htmlContent.includes(header)) {
            logger.success(`Cache-busting header '${header}' found in live HTML`);
        } else {
            logger.error(`Cache-busting header '${header}' missing from live HTML`);
            return false;
        }
    }
    
    // Extract and validate asset path
    const assetPath = extractAssetPath(htmlContent);
    if (!assetPath) {
        logger.error('No JavaScript asset path found in live HTML');
        return false;
    }
    
    if (validateAssetPath(assetPath, EXPECTED_BASE_PATH)) {
        logger.success(`Asset path is correct in live site: ${assetPath}`);
    } else {
        logger.error(`Asset path is incorrect in live site: ${assetPath}`);
        return false;
    }
    
    // Check for timestamp (cache-busting)
    if (assetPath.match(/-\d{13}\.js$/)) {
        logger.success('Asset has timestamp for cache-busting in live site');
    } else {
        logger.warn('Asset path does not include timestamp in live site');
    }
    
    return true;
}

async function validateAssetAccessibility(htmlContent) {
    logger.section('Asset Accessibility Validation');
    
    const assetPath = extractAssetPath(htmlContent);
    if (!assetPath) {
        logger.error('Cannot test asset accessibility - no asset path found');
        return false;
    }
    
    // Convert relative path to absolute URL
    const assetUrl = new URL(assetPath, GITHUB_PAGES_URL).href;
    
    logger.info(`Testing asset accessibility: ${assetUrl}`);
    
    const response = await httpGet(assetUrl);
    
    if (response.status === 200) {
        logger.success('JavaScript asset is accessible');
        
        // Check content type
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('javascript') || contentType.includes('application/javascript')) {
            logger.success('Asset has correct content type');
        } else {
            logger.warn(`Asset content type might be incorrect: ${contentType}`);
        }
        
        // Check file size
        const contentLength = response.text.length;
        if (contentLength > 100000) { // > 100KB
            logger.success(`Asset has reasonable size: ${Math.round(contentLength/1024)}KB`);
        } else {
            logger.warn(`Asset might be too small: ${contentLength} bytes`);
        }
        
        return true;
    } else {
        logger.error(`Asset not accessible: ${response.status} ${response.statusText || response.error}`);
        return false;
    }
}

async function validateHttpHeaders(response) {
    logger.section('HTTP Headers Validation');
    
    const headers = response.headers;
    
    // Check cache headers
    const cacheControl = headers['cache-control'];
    if (cacheControl && cacheControl.includes('no-cache')) {
        logger.success('Cache-Control header is properly set');
    } else {
        logger.warn(`Cache-Control header: ${cacheControl || 'not set'}`);
    }
    
    // Check content type
    const contentType = headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
        logger.success('Content-Type is correct');
    } else {
        logger.warn(`Content-Type: ${contentType || 'not set'}`);
    }
    
    // Check for GitHub Pages headers
    const server = headers['server'];
    if (server && server.includes('GitHub.com')) {
        logger.success('Confirmed hosted on GitHub Pages');
    } else {
        logger.info(`Server: ${server || 'unknown'}`);
    }
    
    return true;
}

async function validateNoOldAssets() {
    logger.section('Old Asset Detection');
    
    // Try to access known old asset paths that shouldn't exist
    const oldPaths = [
        '/vampire-survivors-clone/assets/main-CNAit3d-.js',
        '/vampire-survivors-clone/',
        '/vampire-survivors-clone/index.html'
    ];
    
    for (const oldPath of oldPaths) {
        const oldUrl = new URL(oldPath, 'https://sl4ppy.github.io/').href;
        const response = await httpGet(oldUrl);
        
        if (response.status === 404) {
            logger.success(`Old path correctly returns 404: ${oldPath}`);
        } else {
            logger.warn(`Old path still accessible (${response.status}): ${oldPath}`);
        }
    }
    
    return true;
}

async function runDeploymentValidation() {
    logger.info('Starting deployment validation tests...\n');
    
    const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
    const hasGitCredentials = process.env.GITHUB_TOKEN;
    
    // Step 1: Deploy (or simulate)
    const deploySuccess = await validateDeploymentProcess();
    if (!deploySuccess) {
        logger.summary();
        process.exit(1);
    }
    
    // If we're running locally without credentials, skip live site testing
    if (!isCI && !hasGitCredentials) {
        logger.warn('Skipping live site validation - running in local mode');
        logger.info('Live site tests will run in CI/CD environment');
        logger.success('Local deployment validation completed');
        
        const success = logger.summary();
        process.exit(success ? 0 : 1);
    }
    
    // Step 2: Wait for propagation
    const { success: propagationSuccess, response } = await waitForDeploymentPropagation();
    if (!propagationSuccess) {
        logger.summary();
        process.exit(1);
    }
    
    // Step 3: Validate live content
    const results = await Promise.all([
        validateLiveHtmlContent(response.text),
        validateAssetAccessibility(response.text),
        validateHttpHeaders(response),
        validateNoOldAssets()
    ]);
    
    const success = logger.summary();
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDeploymentValidation().catch(error => {
        console.error('Deployment validation failed:', error);
        process.exit(1);
    });
} else if (process.argv[1] && process.argv[1].includes('deployment-validator.js')) {
    // Alternative check for Windows paths
    runDeploymentValidation().catch(error => {
        console.error('Deployment validation failed:', error);
        process.exit(1);
    });
}

export { runDeploymentValidation }; 