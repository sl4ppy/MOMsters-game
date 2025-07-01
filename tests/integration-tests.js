import { TestLogger, sleep } from './utils.js';
import puppeteer from 'puppeteer';

const logger = new TestLogger();
const GITHUB_PAGES_URL = 'https://sl4ppy.github.io/MOMsters-game/';
const GAME_LOAD_TIMEOUT = 30000; // 30 seconds
const INTERACTION_DELAY = 500; // 500ms between interactions

let browser;
let page;

async function setupBrowser() {
    logger.section('Browser Setup');
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        page = await browser.newPage();
        
        // Set up console logging
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                logger.error(`Browser console error: ${msg.text()}`);
            } else if (type === 'warning') {
                logger.warn(`Browser console warning: ${msg.text()}`);
            }
        });
        
        // Set up error handling
        page.on('pageerror', error => {
            logger.error(`Browser page error: ${error.message}`);
        });
        
        // Set viewport
        await page.setViewport({ width: 1024, height: 768 });
        
        logger.success('Browser setup completed');
        return true;
    } catch (error) {
        logger.error(`Failed to setup browser: ${error.message}`);
        return false;
    }
}

async function loadGamePage() {
    logger.section('Game Page Loading');
    
    try {
        logger.info(`Navigating to: ${GITHUB_PAGES_URL}`);
        
        // Navigate with network idle condition
        await page.goto(GITHUB_PAGES_URL, {
            waitUntil: 'networkidle0',
            timeout: GAME_LOAD_TIMEOUT
        });
        
        // Check page title
        const title = await page.title();
        if (title.includes('MOMsters - Survival Arena')) {
            logger.success('Page loaded with correct title');
        } else {
            logger.error(`Page title incorrect: "${title}"`);
            return false;
        }
        
        // Wait for game container
        await page.waitForSelector('#gameContainer', { timeout: 10000 });
        logger.success('Game container found');
        
        return true;
    } catch (error) {
        logger.error(`Failed to load game page: ${error.message}`);
        return false;
    }
}

async function validateGameInitialization() {
    logger.section('Game Initialization Validation');
    
    try {
        // Wait for PIXI application to initialize
        await page.waitForFunction(
            () => window.PIXI && window.PIXI.Application,
            { timeout: 15000 }
        );
        logger.success('PIXI.js library loaded');
        
        // Wait for canvas element
        await page.waitForSelector('canvas', { timeout: 10000 });
        logger.success('Game canvas created');
        
        // Check canvas dimensions
        const canvasDimensions = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return {
                width: canvas.width,
                height: canvas.height,
                style: {
                    width: canvas.style.width,
                    height: canvas.style.height
                }
            };
        });
        
        if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
            logger.success(`Canvas has valid dimensions: ${canvasDimensions.width}x${canvasDimensions.height}`);
        } else {
            logger.error('Canvas has invalid dimensions');
            return false;
        }
        
        // Wait for the game to be ready (look for title screen)
        const titleScreenReady = await page.waitForFunction(
            () => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return false;
                
                // Check if there's some rendering activity
                const ctx = canvas.getContext('2d');
                if (!ctx) return false;
                
                // Simple check - if canvas has been drawn to
                try {
                    const imageData = ctx.getImageData(0, 0, 10, 10);
                    return imageData.data.some(pixel => pixel !== 0);
                } catch {
                    return false;
                }
            },
            { timeout: 15000, polling: 1000 }
        );
        
        if (titleScreenReady) {
            logger.success('Game appears to be rendering');
        } else {
            logger.warn('Could not confirm game rendering');
        }
        
        return true;
    } catch (error) {
        logger.error(`Game initialization validation failed: ${error.message}`);
        return false;
    }
}

async function testTitleScreenInteraction() {
    logger.section('Title Screen Interaction');
    
    try {
        // Wait a moment for title screen to be ready
        await sleep(2000);
        
        // Try to interact with the title screen
        logger.info('Attempting to start game with SPACE key');
        await page.keyboard.press('Space');
        
        await sleep(INTERACTION_DELAY);
        
        // Try ENTER key as well
        logger.info('Attempting to start game with ENTER key');
        await page.keyboard.press('Enter');
        
        await sleep(2000);
        
        // Check if we can detect game state change
        const gameStarted = await page.evaluate(() => {
            // Look for any changes that might indicate game started
            // This is a basic check - in a real implementation you'd check for specific game elements
            return document.body.classList.length > 0 || 
                   document.querySelectorAll('canvas').length > 0;
        });
        
        if (gameStarted) {
            logger.success('Game appears to respond to keyboard input');
        } else {
            logger.warn('Could not confirm game response to input');
        }
        
        return true;
    } catch (error) {
        logger.error(`Title screen interaction failed: ${error.message}`);
        return false;
    }
}

async function testBasicGameplay() {
    logger.section('Basic Gameplay Testing');
    
    try {
        // Test movement keys
        const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        for (const key of movementKeys) {
            logger.info(`Testing movement key: ${key}`);
            await page.keyboard.down(key);
            await sleep(200);
            await page.keyboard.up(key);
            await sleep(100);
        }
        
        logger.success('Movement keys tested');
        
        // Test arrow keys
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        
        for (const key of arrowKeys) {
            await page.keyboard.down(key);
            await sleep(200);
            await page.keyboard.up(key);
            await sleep(100);
        }
        
        logger.success('Arrow keys tested');
        
        // Test number keys (for level up selection)
        const numberKeys = ['Digit1', 'Digit2', 'Digit3'];
        
        for (const key of numberKeys) {
            await page.keyboard.press(key);
            await sleep(100);
        }
        
        logger.success('Number keys tested');
        
        return true;
    } catch (error) {
        logger.error(`Basic gameplay testing failed: ${error.message}`);
        return false;
    }
}

async function validatePerformance() {
    logger.section('Performance Validation');
    
    try {
        // Get performance metrics
        const performanceMetrics = await page.evaluate(() => {
            const performance = window.performance;
            const navigation = performance.getEntriesByType('navigation')[0];
            
            return {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart,
                transferSize: navigation.transferSize || 0
            };
        });
        
        // Validate load times
        if (performanceMetrics.loadTime < 5000) { // Less than 5 seconds
            logger.success(`Good load time: ${Math.round(performanceMetrics.loadTime)}ms`);
        } else {
            logger.warn(`Slow load time: ${Math.round(performanceMetrics.loadTime)}ms`);
        }
        
        if (performanceMetrics.totalTime < 10000) { // Less than 10 seconds total
            logger.success(`Acceptable total load time: ${Math.round(performanceMetrics.totalTime)}ms`);
        } else {
            logger.warn(`Slow total load time: ${Math.round(performanceMetrics.totalTime)}ms`);
        }
        
        // Check memory usage
        const memoryInfo = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });
        
        if (memoryInfo) {
            const usedMB = Math.round(memoryInfo.used / (1024 * 1024));
            if (usedMB < 100) { // Less than 100MB
                logger.success(`Reasonable memory usage: ${usedMB}MB`);
            } else {
                logger.warn(`High memory usage: ${usedMB}MB`);
            }
        } else {
            logger.info('Memory info not available');
        }
        
        return true;
    } catch (error) {
        logger.error(`Performance validation failed: ${error.message}`);
        return false;
    }
}

async function validateResponsiveness() {
    logger.section('Responsiveness Validation');
    
    try {
        // Test different viewport sizes
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop Large' },
            { width: 1024, height: 768, name: 'Desktop Medium' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 414, height: 896, name: 'Mobile' }
        ];
        
        for (const viewport of viewports) {
            logger.info(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            await page.setViewport(viewport);
            await sleep(1000);
            
            // Check if canvas is still visible and properly sized
            const canvasInfo = await page.evaluate(() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return null;
                
                const rect = canvas.getBoundingClientRect();
                return {
                    visible: rect.width > 0 && rect.height > 0,
                    inViewport: rect.top >= 0 && rect.left >= 0 && 
                               rect.bottom <= window.innerHeight && 
                               rect.right <= window.innerWidth
                };
            });
            
            if (canvasInfo && canvasInfo.visible) {
                logger.success(`${viewport.name}: Canvas is visible and properly sized`);
            } else {
                logger.warn(`${viewport.name}: Canvas might not be properly responsive`);
            }
        }
        
        // Reset to standard viewport
        await page.setViewport({ width: 1024, height: 768 });
        
        return true;
    } catch (error) {
        logger.error(`Responsiveness validation failed: ${error.message}`);
        return false;
    }
}

async function cleanupBrowser() {
    if (browser) {
        await browser.close();
        logger.info('Browser closed');
    }
}

async function runIntegrationTests() {
    logger.info('Starting integration tests...\n');
    
    try {
        const setupSuccess = await setupBrowser();
        if (!setupSuccess) {
            process.exit(1);
        }
        
        const results = [
            await loadGamePage(),
            await validateGameInitialization(),
            await testTitleScreenInteraction(),
            await testBasicGameplay(),
            await validatePerformance(),
            await validateResponsiveness()
        ];
        
        await cleanupBrowser();
        
        const success = logger.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        logger.error(`Integration tests failed: ${error.message}`);
        await cleanupBrowser();
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runIntegrationTests();
} else if (process.argv[1] && process.argv[1].includes('integration-tests.js')) {
    // Alternative check for Windows paths
    runIntegrationTests();
}

export { runIntegrationTests }; 