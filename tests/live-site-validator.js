import { TestLogger, httpGet, extractAssetPath, validateAssetPath, sleep } from './utils.js';

const logger = new TestLogger();
const GITHUB_PAGES_URL = 'https://sl4ppy.github.io/MOMsters-game/';
const EXPECTED_BASE_PATH = '/MOMsters-game/';

async function validateLiveSiteAccessibility() {
    logger.section('Live Site Accessibility');
    
    logger.info(`Testing site accessibility: ${GITHUB_PAGES_URL}`);
    
    const response = await httpGet(GITHUB_PAGES_URL);
    
    if (response.status === 200) {
        logger.success('Site is accessible');
        return { success: true, response };
    } else if (response.status === 404) {
        logger.error('Site returns 404 - deployment may have failed');
        return { success: false, response };
    } else if (response.error) {
        logger.error(`Network error: ${response.error}`);
        return { success: false, response };
    } else {
        logger.error(`Unexpected response: ${response.status} ${response.statusText}`);
        return { success: false, response };
    }
}

async function validateLiveHtmlContent(htmlContent) {
    logger.section('Live HTML Content Analysis');
    
    // Check title
    if (htmlContent.includes('MOMsters - Survival Arena')) {
        logger.success('✓ Correct title found in live site');
    } else if (htmlContent.includes('Vampire Survivors Clone')) {
        logger.error('✗ Old title detected - site may be cached');
        return false;
    } else {
        logger.error('✗ Title not found or incorrect');
        return false;
    }
    
    // Check for cache-busting headers in HTML
    const cacheHeaders = ['Cache-Control', 'Pragma', 'Expires', 'cache-bust'];
    let cacheHeadersFound = 0;
    
    for (const header of cacheHeaders) {
        if (htmlContent.includes(header)) {
            logger.success(`✓ Cache-busting header '${header}' found in HTML`);
            cacheHeadersFound++;
        } else {
            logger.warn(`⚠ Cache-busting header '${header}' missing from HTML`);
        }
    }
    
    if (cacheHeadersFound === 0) {
        logger.error('✗ No cache-busting headers found - this may cause caching issues');
    }
    
    // Extract and validate asset path
    const assetPath = extractAssetPath(htmlContent);
    if (!assetPath) {
        logger.error('✗ No JavaScript asset path found in HTML');
        return false;
    }
    
    logger.info(`Asset path found: ${assetPath}`);
    
    if (validateAssetPath(assetPath, EXPECTED_BASE_PATH)) {
        logger.success(`✓ Asset path is correct: ${assetPath}`);
    } else {
        logger.error(`✗ Asset path is incorrect: ${assetPath}`);
        logger.error(`   Expected to start with: ${EXPECTED_BASE_PATH}`);
        
        // Check for old paths
        if (assetPath.includes('/vampire-survivors-clone/')) {
            logger.error('✗ CRITICAL: Asset still uses old path! This is the caching issue.');
        }
        return false;
    }
    
    // Check for timestamp (cache-busting)
    if (assetPath.match(/-\d{13}\.js$/)) {
        logger.success('✓ Asset has timestamp for cache-busting');
    } else {
        logger.warn('⚠ Asset path does not include timestamp - cache-busting may not be effective');
    }
    
    return true;
}

async function validateAssetAccessibility(htmlContent) {
    logger.section('Asset Accessibility Test');
    
    const assetPath = extractAssetPath(htmlContent);
    if (!assetPath) {
        logger.error('Cannot test asset accessibility - no asset path found');
        return false;
    }
    
    // Convert relative path to absolute URL
    const assetUrl = new URL(assetPath, GITHUB_PAGES_URL).href;
    
    logger.info(`Testing asset: ${assetUrl}`);
    
    const response = await httpGet(assetUrl);
    
    if (response.status === 200) {
        logger.success('✓ JavaScript asset is accessible');
        
        // Check content type
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('javascript') || contentType.includes('application/javascript')) {
            logger.success('✓ Asset has correct MIME type');
        } else {
            logger.warn(`⚠ Asset MIME type might be incorrect: ${contentType}`);
        }
        
        // Check file size
        const contentLength = response.text.length;
        if (contentLength > 100000) { // > 100KB
            logger.success(`✓ Asset has reasonable size: ${Math.round(contentLength/1024)}KB`);
        } else {
            logger.warn(`⚠ Asset might be too small: ${contentLength} bytes`);
        }
        
        // Check if it contains game code
        if (response.text.includes('PIXI') || response.text.includes('Application')) {
            logger.success('✓ Asset contains game engine code');
        } else {
            logger.warn('⚠ Asset might not contain expected game code');
        }
        
        return true;
    } else {
        logger.error(`✗ Asset not accessible: ${response.status} ${response.statusText || response.error}`);
        
        if (response.status === 404) {
            logger.error('   This suggests the asset path in HTML is incorrect or deployment failed');
        }
        return false;
    }
}

async function validateOldAssetCleanup() {
    logger.section('Old Asset Cleanup Check');
    
    // Try to access known old asset paths that shouldn't exist
    const oldPaths = [
        '/vampire-survivors-clone/',
        '/vampire-survivors-clone/index.html',
        '/vampire-survivors-clone/assets/main-CNAit3d-.js'
    ];
    
    let oldAssetsFound = 0;
    
    for (const oldPath of oldPaths) {
        const oldUrl = new URL(oldPath, 'https://sl4ppy.github.io/').href;
        logger.info(`Checking old path: ${oldPath}`);
        
        const response = await httpGet(oldUrl);
        
        if (response.status === 404) {
            logger.success(`✓ Old path correctly returns 404: ${oldPath}`);
        } else if (response.status === 200) {
            logger.error(`✗ Old path still accessible: ${oldPath}`);
            oldAssetsFound++;
        } else {
            logger.warn(`⚠ Unexpected response for old path ${oldPath}: ${response.status}`);
        }
        
        await sleep(500); // Small delay between requests
    }
    
    if (oldAssetsFound > 0) {
        logger.error(`✗ Found ${oldAssetsFound} old assets still accessible - this may cause browser confusion`);
        return false;
    } else {
        logger.success('✓ All old assets properly cleaned up');
        return true;
    }
}

async function validateHttpHeaders(response) {
    logger.section('HTTP Headers Analysis');
    
    const headers = response.headers;
    
    // Check cache headers from server
    const cacheControl = headers['cache-control'];
    if (cacheControl) {
        logger.info(`Cache-Control header: ${cacheControl}`);
        if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
            logger.success('✓ Server cache headers are restrictive');
        } else {
            logger.warn('⚠ Server may be caching aggressively');
        }
    } else {
        logger.warn('⚠ No Cache-Control header from server');
    }
    
    // Check content type
    const contentType = headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
        logger.success('✓ Content-Type is correct');
    } else {
        logger.warn(`⚠ Content-Type: ${contentType || 'not set'}`);
    }
    
    // Check for GitHub Pages indicators
    const server = headers['server'];
    if (server && server.includes('GitHub.com')) {
        logger.success('✓ Confirmed hosted on GitHub Pages');
    } else {
        logger.info(`Server: ${server || 'unknown'}`);
    }
    
    // Check ETag and Last-Modified for caching info
    const etag = headers['etag'];
    const lastModified = headers['last-modified'];
    
    if (etag) {
        logger.info(`ETag: ${etag}`);
    }
    
    if (lastModified) {
        logger.info(`Last-Modified: ${lastModified}`);
    }
    
    return true;
}

async function generateDiagnosticReport(htmlContent) {
    logger.section('Diagnostic Report');
    
    logger.info('=== DEPLOYMENT DIAGNOSTIC SUMMARY ===');
    
    // Extract key information
    const assetPath = extractAssetPath(htmlContent);
    const hasCorrectTitle = htmlContent.includes('MOMsters - Survival Arena');
    const hasOldTitle = htmlContent.includes('Vampire Survivors Clone');
    const hasCacheBusting = htmlContent.includes('cache-bust');
    
    console.log('\n📋 Current State:');
    console.log(`   Title: ${hasCorrectTitle ? '✓ Updated' : hasOldTitle ? '✗ Old' : '? Unknown'}`);
    console.log(`   Asset Path: ${assetPath || 'Not found'}`);
    console.log(`   Cache-busting: ${hasCacheBusting ? '✓ Present' : '✗ Missing'}`);
    
    if (assetPath) {
        console.log(`   Path Validity: ${validateAssetPath(assetPath, EXPECTED_BASE_PATH) ? '✓ Correct' : '✗ Incorrect'}`);
        console.log(`   Timestamp: ${assetPath.match(/-\d{13}\.js$/) ? '✓ Present' : '✗ Missing'}`);
    }
    
    console.log('\n🔍 Possible Issues:');
    if (!hasCorrectTitle) {
        console.log('   • Browser may be loading cached version of HTML');
    }
    if (assetPath && !validateAssetPath(assetPath, EXPECTED_BASE_PATH)) {
        console.log('   • Asset path is incorrect - this will cause 404 errors');
    }
    if (!hasCacheBusting) {
        console.log('   • Missing cache-busting headers may cause persistent caching');
    }
    
    console.log('\n💡 Recommendations:');
    console.log('   • Try hard refresh (Ctrl+F5) in multiple browsers');
    console.log('   • Clear browser cache completely');
    console.log('   • Try incognito/private browsing mode');
    console.log('   • Wait 5-10 minutes for CDN propagation');
    
    return true;
}

async function runLiveSiteValidation() {
    logger.info('🔍 Analyzing live deployed site...\n');
    
    // Step 1: Check if site is accessible
    const { success: accessible, response } = await validateLiveSiteAccessibility();
    if (!accessible) {
        logger.error('Site is not accessible - cannot continue validation');
        logger.summary();
        process.exit(1);
    }
    
    // Step 2: Analyze the content we received
    const htmlContent = response.text;
    
    // Run all validations
    const results = await Promise.all([
        validateLiveHtmlContent(htmlContent),
        validateAssetAccessibility(htmlContent),
        validateHttpHeaders(response),
        validateOldAssetCleanup()
    ]);
    
    // Generate diagnostic report
    await generateDiagnosticReport(htmlContent);
    
    const success = logger.summary();
    
    if (!success) {
        console.log('\n🚨 Issues detected with the deployed site!');
        console.log('This explains why it works locally but not when deployed.');
    } else {
        console.log('\n🎉 Deployed site appears to be working correctly!');
    }
    
    process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runLiveSiteValidation().catch(error => {
        console.error('Live site validation failed:', error);
        process.exit(1);
    });
} else if (process.argv[1] && process.argv[1].includes('live-site-validator.js')) {
    // Alternative check for Windows paths
    runLiveSiteValidation().catch(error => {
        console.error('Live site validation failed:', error);
        process.exit(1);
    });
}

export { runLiveSiteValidation }; 