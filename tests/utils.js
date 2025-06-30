import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';

export class TestLogger {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.startTime = Date.now();
    }

    info(message) {
        console.log(chalk.blue('ℹ'), message);
    }

    success(message) {
        console.log(chalk.green('✓'), message);
        this.passed++;
    }

    error(message) {
        console.log(chalk.red('✗'), message);
        this.failed++;
    }

    warn(message) {
        console.log(chalk.yellow('⚠'), message);
    }

    section(title) {
        console.log('\n' + chalk.cyan.bold(`=== ${title} ===`));
    }

    summary() {
        const duration = Date.now() - this.startTime;
        console.log('\n' + chalk.cyan.bold('=== Test Summary ==='));
        console.log(chalk.green(`✓ Passed: ${this.passed}`));
        console.log(chalk.red(`✗ Failed: ${this.failed}`));
        console.log(chalk.gray(`Time: ${duration}ms`));
        
        if (this.failed === 0) {
            console.log(chalk.green.bold('\n🎉 All tests passed!'));
            return true;
        } else {
            console.log(chalk.red.bold('\n💥 Some tests failed!'));
            return false;
        }
    }
}

export async function httpGet(url, timeout = 10000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'MOMsters-Test-Bot/1.0'
            }
        });
        
        clearTimeout(timeoutId);
        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            text: await response.text()
        };
    } catch (error) {
        return {
            error: error.message,
            status: 0
        };
    }
}

export function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

export function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
}

export function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch {
        return 0;
    }
}

export function listFiles(directory, extension = null) {
    try {
        const files = fs.readdirSync(directory);
        if (extension) {
            return files.filter(file => file.endsWith(extension));
        }
        return files;
    } catch {
        return [];
    }
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function extractAssetPath(htmlContent) {
    const scriptMatch = htmlContent.match(/src="([^"]*\.js)"/);
    return scriptMatch ? scriptMatch[1] : null;
}

export function validateAssetPath(assetPath, expectedBasePath) {
    if (!assetPath) return false;
    return assetPath.startsWith(expectedBasePath);
} 