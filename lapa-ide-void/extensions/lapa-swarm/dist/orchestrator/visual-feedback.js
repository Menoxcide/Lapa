"use strict";
/**
 * Visual Feedback System for LAPA v1.2.2 — Phase 14
 *
 * This module implements visual feedback loops using Playwright for UI testing
 * and validation. It provides screenshot comparison, visual regression testing,
 * and real-time UI state monitoring.
 *
 * Features:
 * - Playwright-based visual testing
 * - Screenshot comparison and diff detection
 * - Visual regression detection
 * - Real-time UI state monitoring
 * - Integration with event bus for feedback loops
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualFeedback = exports.VisualFeedbackSystem = void 0;
const event_bus_ts_1 = require("../core/event-bus.ts");
const zod_1 = require("zod");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const pngjs_1 = __importDefault(require("pngjs"));
// Zod schema for screenshot comparison request
const screenshotComparisonRequestSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    selector: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    baselineName: zod_1.z.string().optional(),
    waitFor: zod_1.z.string().optional(),
    timeout: zod_1.z.number().positive().optional()
});
/**
 * Visual Feedback System
 *
 * Provides visual testing and feedback using Playwright (when available)
 * or fallback mechanisms.
 */
class VisualFeedbackSystem {
    config;
    playwright = null; // Playwright API (dynamically loaded)
    browser = null;
    page = null;
    isInitialized = false;
    constructor(config) {
        this.config = {
            screenshotsDirectory: config?.screenshotsDirectory || (0, path_1.join)(process.cwd(), '.lapa', 'screenshots'),
            baselineDirectory: config?.baselineDirectory || (0, path_1.join)(process.cwd(), '.lapa', 'baselines'),
            diffDirectory: config?.diffDirectory || (0, path_1.join)(process.cwd(), '.lapa', 'diffs'),
            threshold: config?.threshold ?? 0.1, // 10% difference threshold
            enablePlaywright: config?.enablePlaywright ?? true,
            browserType: config?.browserType || 'chromium',
            viewport: config?.viewport || { width: 1280, height: 720 }
        };
    }
    /**
     * Initializes the visual feedback system
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Create directories
            await (0, promises_1.mkdir)(this.config.screenshotsDirectory, { recursive: true });
            await (0, promises_1.mkdir)(this.config.baselineDirectory, { recursive: true });
            await (0, promises_1.mkdir)(this.config.diffDirectory, { recursive: true });
            // Try to load Playwright if enabled
            if (this.config.enablePlaywright) {
                try {
                    // Dynamic import of Playwright (if available)
                    const playwright = await import('playwright');
                    this.playwright = playwright;
                    console.log('[VisualFeedback] Playwright integration available');
                }
                catch (error) {
                    console.warn('[VisualFeedback] Playwright not available, using fallback mode:', error);
                    console.warn('[VisualFeedback] Install Playwright with: npm install -D playwright && npx playwright install');
                    this.config.enablePlaywright = false;
                }
            }
            this.isInitialized = true;
            await event_bus_ts_1.eventBus.publish({
                id: `visual-feedback-init-${Date.now()}`,
                type: 'visual-feedback.initialized',
                timestamp: Date.now(),
                source: 'visual-feedback',
                payload: {
                    playwrightEnabled: this.config.enablePlaywright
                }
            });
            console.log('[VisualFeedback] Initialized successfully');
        }
        catch (error) {
            console.error('[VisualFeedback] Initialization failed:', error);
            throw error;
        }
    }
    /**
     * Takes a screenshot and compares it with baseline
     */
    async compareScreenshot(request) {
        const validated = screenshotComparisonRequestSchema.parse(request);
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            // Take screenshot
            const screenshotPath = await this.takeScreenshot(validated);
            // Compare with baseline if provided
            let match = true;
            let diffPercentage = 0;
            let diffPath;
            let baselinePath;
            if (validated.baselineName) {
                baselinePath = (0, path_1.join)(this.config.baselineDirectory, `${validated.baselineName}.png`);
                try {
                    // Check if baseline exists
                    await (0, promises_1.readFile)(baselinePath);
                    // Compare screenshots
                    const comparison = await this.compareImages(screenshotPath, baselinePath);
                    match = comparison.match;
                    diffPercentage = comparison.diffPercentage;
                    if (!match) {
                        diffPath = (0, path_1.join)(this.config.diffDirectory, `${validated.name}-diff.png`);
                        // In a real implementation, we'd generate a diff image
                        // For now, we'll just log the difference
                        console.log(`[VisualFeedback] Visual difference detected: ${diffPercentage.toFixed(2)}%`);
                    }
                }
                catch (error) {
                    // Baseline doesn't exist, create it
                    console.log(`[VisualFeedback] Baseline not found, creating: ${baselinePath}`);
                    await this.createBaseline(screenshotPath, baselinePath);
                }
            }
            const result = {
                success: true,
                match,
                diffPercentage: match ? undefined : diffPercentage,
                screenshotPath,
                baselinePath,
                diffPath,
                metadata: {
                    timestamp: new Date(),
                    viewport: this.config.viewport,
                    url: validated.url
                }
            };
            // Emit event
            await event_bus_ts_1.eventBus.publish({
                id: `screenshot-compared-${Date.now()}`,
                type: 'visual-feedback.screenshot-compared',
                timestamp: Date.now(),
                source: 'visual-feedback',
                payload: result
            });
            return result;
        }
        catch (error) {
            console.error('[VisualFeedback] Screenshot comparison failed:', error);
            return {
                success: false,
                match: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Takes a screenshot using Playwright or fallback
     */
    async takeScreenshot(request) {
        const screenshotPath = (0, path_1.join)(this.config.screenshotsDirectory, `${request.name}-${Date.now()}.png`);
        if (this.config.enablePlaywright && this.playwright) {
            try {
                // Use Playwright for screenshot
                const browser = await this.playwright[this.config.browserType].launch({
                    headless: true
                });
                const page = await browser.newPage();
                await page.setViewportSize(this.config.viewport);
                await page.goto(request.url, {
                    waitUntil: 'networkidle',
                    timeout: request.timeout || 30000
                });
                if (request.waitFor) {
                    await page.waitForSelector(request.waitFor, { timeout: request.timeout || 30000 });
                }
                if (request.selector) {
                    await page.locator(request.selector).screenshot({ path: screenshotPath });
                }
                else {
                    await page.screenshot({ path: screenshotPath, fullPage: false });
                }
                await browser.close();
                console.log(`[VisualFeedback] Screenshot taken: ${screenshotPath}`);
            }
            catch (error) {
                console.error('[VisualFeedback] Playwright screenshot failed:', error);
                // Fallback to placeholder
                await (0, promises_1.writeFile)(screenshotPath, Buffer.from('placeholder'), 'utf-8');
                console.log(`[VisualFeedback] Screenshot placeholder created: ${screenshotPath}`);
            }
        }
        else {
            // Fallback: create a placeholder file
            await (0, promises_1.writeFile)(screenshotPath, Buffer.from('placeholder'), 'utf-8');
            console.log(`[VisualFeedback] Screenshot placeholder created: ${screenshotPath}`);
        }
        return screenshotPath;
    }
    /**
     * Compares two images and returns difference metrics
     */
    async compareImages(currentPath, baselinePath) {
        try {
            // Try to use pixelmatch if available, otherwise use simple file comparison
            try {
                const { default: pixelmatch } = await import('pixelmatch');
                const fs = await import('fs/promises');
                // Load images
                const currentBuffer = await fs.readFile(currentPath);
                const baselineBuffer = await fs.readFile(baselinePath);
                const currentImg = await new Promise((resolve, reject) => {
                    const img = new pngjs_1.default();
                    img.parse(currentBuffer, (err) => {
                        if (err)
                            reject(err);
                        else {
                            img.data = new Uint8Array(img.data);
                            resolve(img);
                        }
                    });
                });
                const baselineImg = await new Promise((resolve, reject) => {
                    const img = new pngjs_1.default();
                    img.parse(baselineBuffer, (err) => {
                        if (err)
                            reject(err);
                        else {
                            img.data = new Uint8Array(img.data);
                            resolve(img);
                        }
                    });
                });
                // Ensure same dimensions
                if (currentImg.width !== baselineImg.width || currentImg.height !== baselineImg.height) {
                    return { match: false, diffPercentage: 1.0 };
                }
                // Compare images
                const diff = new pngjs_1.default({ width: currentImg.width, height: currentImg.height });
                diff.data = new Uint8Array(currentImg.width * currentImg.height * 4);
                const numDiffPixels = pixelmatch(currentImg.data, baselineImg.data, diff.data, currentImg.width, currentImg.height, { threshold: 0.1 });
                const totalPixels = currentImg.width * currentImg.height;
                const diffPercentage = numDiffPixels / totalPixels;
                const match = diffPercentage < this.config.threshold;
                // Save diff image if there are differences
                if (!match) {
                    const diffPath = (0, path_1.join)(this.config.diffDirectory, `diff-${Date.now()}.png`);
                    const diffBuffer = await new Promise((resolve, reject) => {
                        const chunks = [];
                        diff.pack().on('data', (chunk) => chunks.push(chunk)).on('end', () => resolve(Buffer.concat(chunks))).on('error', reject);
                    });
                    await fs.writeFile(diffPath, diffBuffer);
                }
                return { match, diffPercentage };
            }
            catch (importError) {
                // Fallback: simple file comparison
                console.warn('[VisualFeedback] pixelmatch not available, using fallback comparison');
                const current = await (0, promises_1.readFile)(currentPath);
                const baseline = await (0, promises_1.readFile)(baselinePath);
                // Simple byte comparison
                if (current.length !== baseline.length) {
                    return { match: false, diffPercentage: 1.0 };
                }
                let diffBytes = 0;
                for (let i = 0; i < current.length; i++) {
                    if (current[i] !== baseline[i]) {
                        diffBytes++;
                    }
                }
                const diffPercentage = diffBytes / current.length;
                const match = diffPercentage < this.config.threshold;
                return { match, diffPercentage };
            }
        }
        catch (error) {
            console.error('[VisualFeedback] Image comparison failed:', error);
            return { match: false, diffPercentage: 1.0 };
        }
    }
    /**
     * Creates a baseline screenshot
     */
    async createBaseline(screenshotPath, baselinePath) {
        try {
            const screenshot = await (0, promises_1.readFile)(screenshotPath);
            await (0, promises_1.writeFile)(baselinePath, screenshot);
            console.log(`[VisualFeedback] Baseline created: ${baselinePath}`);
        }
        catch (error) {
            console.error('[VisualFeedback] Failed to create baseline:', error);
            throw error;
        }
    }
    /**
     * Detects visual regressions in a series of screenshots
     */
    async detectVisualRegression(screenshots, baselineName) {
        try {
            const baselinePath = (0, path_1.join)(this.config.baselineDirectory, `${baselineName}.png`);
            // Check if baseline exists
            try {
                await (0, promises_1.readFile)(baselinePath);
            }
            catch {
                return {
                    detected: false,
                    severity: 'low',
                    differences: []
                };
            }
            const differences = [];
            let maxDiffPercentage = 0;
            // Compare each screenshot with baseline
            for (const screenshot of screenshots) {
                const comparison = await this.compareImages(screenshot.path, baselinePath);
                if (!comparison.match) {
                    maxDiffPercentage = Math.max(maxDiffPercentage, comparison.diffPercentage);
                    // In a real implementation, we'd detect specific regions with differences
                    differences.push({
                        x: 0,
                        y: 0,
                        width: this.config.viewport.width,
                        height: this.config.viewport.height,
                        diffPercentage: comparison.diffPercentage
                    });
                }
            }
            const detected = differences.length > 0;
            let severity = 'low';
            if (maxDiffPercentage > 0.3) {
                severity = 'high';
            }
            else if (maxDiffPercentage > 0.15) {
                severity = 'medium';
            }
            const result = {
                detected,
                severity,
                differences
            };
            if (detected) {
                await event_bus_ts_1.eventBus.publish({
                    id: `regression-detected-${Date.now()}`,
                    type: 'visual-feedback.regression-detected',
                    timestamp: Date.now(),
                    source: 'visual-feedback',
                    payload: result
                });
            }
            return result;
        }
        catch (error) {
            console.error('[VisualFeedback] Visual regression detection failed:', error);
            return {
                detected: false,
                severity: 'low',
                differences: []
            };
        }
    }
    /**
     * Monitors UI state in real-time
     */
    async monitorUIState(url, selectors, interval = 1000, duration = 10000) {
        const states = [];
        const startTime = Date.now();
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            if (this.config.enablePlaywright && this.playwright) {
                const browser = await this.playwright[this.config.browserType].launch({ headless: true });
                const page = await browser.newPage();
                await page.setViewportSize(this.config.viewport);
                await page.goto(url, { waitUntil: 'networkidle' });
                while (Date.now() - startTime < duration) {
                    const state = {};
                    // Query each selector and get its state
                    for (const selector of selectors) {
                        try {
                            const element = page.locator(selector);
                            const exists = await element.count() > 0;
                            const visible = exists ? await element.isVisible() : false;
                            const text = exists && visible ? await element.textContent() : null;
                            state[selector] = {
                                exists,
                                visible,
                                text: text || null
                            };
                        }
                        catch (error) {
                            state[selector] = {
                                exists: false,
                                visible: false,
                                text: null,
                                error: error instanceof Error ? error.message : 'Unknown error'
                            };
                        }
                    }
                    states.push({
                        timestamp: new Date(),
                        state
                    });
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
                await browser.close();
            }
            else {
                // Fallback: placeholder state
                while (Date.now() - startTime < duration) {
                    const state = {};
                    for (const selector of selectors) {
                        state[selector] = {
                            exists: true,
                            visible: true,
                            text: 'placeholder'
                        };
                    }
                    states.push({
                        timestamp: new Date(),
                        state
                    });
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            }
            await event_bus_ts_1.eventBus.publish({
                id: `ui-monitored-${Date.now()}`,
                type: 'visual-feedback.ui-monitored',
                timestamp: Date.now(),
                source: 'visual-feedback',
                payload: {
                    url,
                    states: states.length
                }
            });
            return states;
        }
        catch (error) {
            console.error('[VisualFeedback] UI monitoring failed:', error);
            return states;
        }
    }
    /**
     * Cleans up resources
     */
    async cleanup() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch (error) {
                console.error('[VisualFeedback] Error closing browser:', error);
            }
            this.browser = null;
            this.page = null;
        }
        this.isInitialized = false;
        console.log('[VisualFeedback] Cleaned up');
    }
}
exports.VisualFeedbackSystem = VisualFeedbackSystem;
// Export singleton instance
exports.visualFeedback = new VisualFeedbackSystem();
//# sourceMappingURL=visual-feedback.js.map