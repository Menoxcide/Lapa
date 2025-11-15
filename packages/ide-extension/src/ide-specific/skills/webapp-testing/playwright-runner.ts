/**
 * Playwright Test Runner
 * 
 * Utility for running Playwright tests programmatically.
 */

import type { Browser, BrowserContext, Page } from '@playwright/test';

export interface PlaywrightTestOptions {
  url: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  viewport?: {
    width: number;
    height: number;
  };
  timeout?: number;
}

export interface PlaywrightTestResult {
  success: boolean;
  screenshots: string[];
  metrics?: {
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint?: number;
  };
  errors: string[];
}

/**
 * Runs a Playwright test
 */
export async function runPlaywrightTest(
  options: PlaywrightTestOptions
): Promise<PlaywrightTestResult> {
  let playwright: any = null;
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  const screenshots: string[] = [];
  const errors: string[] = [];

  try {
    // Try to import Playwright
    try {
      const playwrightModule = await import('playwright');
      playwright = playwrightModule;
    } catch (error) {
      throw new Error(
        'Playwright not found. Install it with: npm install playwright && npx playwright install'
      );
    }

    const browserType = options.browserType || 'chromium';
    const browserLaunch = playwright[browserType];

    if (!browserLaunch) {
      throw new Error(`Browser type ${browserType} not available`);
    }

    // Launch browser
    browser = await browserLaunch.launch({
      headless: true
    });

    // Create context
    context = await browser.newContext({
      viewport: options.viewport || {
        width: 1280,
        height: 720
      }
    });

    // Create page
    page = await context.newPage();

    // Navigate to URL
    const startTime = Date.now();
    const response = await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000
    });

    if (!response || !response.ok()) {
      throw new Error(`Failed to load ${options.url}: ${response?.status() || 'Unknown error'}`);
    }

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Measure metrics
    const loadTime = Date.now() - startTime;
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        firstContentfulPaint: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
      };
    }).catch(() => ({
      domContentLoaded: 0,
      firstContentfulPaint: undefined
    }));

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    // Save screenshot to temp directory
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    const { writeFile } = await import('fs/promises');

    const screenshotsDir = join(tmpdir(), 'lapa-playwright-screenshots');
    await import('fs/promises').then(fs => fs.mkdir(screenshotsDir, { recursive: true }));

    const screenshotPath = join(screenshotsDir, `screenshot-${Date.now()}.png`);
    await writeFile(screenshotPath, screenshotBuffer);
    screenshots.push(screenshotPath);

    return {
      success: true,
      screenshots,
      metrics: {
        loadTime,
        ...metrics
      },
      errors: []
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));

    return {
      success: false,
      screenshots,
      errors
    };
  } finally {
    // Cleanup
    try {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

