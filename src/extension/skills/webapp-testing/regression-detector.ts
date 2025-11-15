/**
 * Visual Regression Detector
 * 
 * Detects visual regressions by comparing screenshots.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import PNG from 'pngjs';

export interface RegressionDetectionOptions {
  currentScreenshot: string;
  baselineScreenshot: string;
  threshold?: number; // 0-1, percentage difference threshold
}

export interface RegressionDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  diffPercentage: number;
  differences: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    diffPercentage: number;
  }>;
  diffImagePath?: string;
}

/**
 * Detects visual regression by comparing screenshots
 */
export async function detectRegression(
  options: RegressionDetectionOptions
): Promise<RegressionDetectionResult> {
  const threshold = options.threshold || 0.1; // 10% default threshold

  try {
    // Read both images
    const currentBuffer = await readFile(options.currentScreenshot);
    const baselineBuffer = await readFile(options.baselineScreenshot);

    // Parse PNG images
    const currentPNG = PNG.PNG.sync.read(currentBuffer);
    const baselinePNG = PNG.PNG.sync.read(baselineBuffer);

    // Check dimensions match
    if (
      currentPNG.width !== baselinePNG.width ||
      currentPNG.height !== baselinePNG.height
    ) {
      return {
        detected: true,
        severity: 'high',
        diffPercentage: 1.0,
        differences: [{
          x: 0,
          y: 0,
          width: Math.abs(currentPNG.width - baselinePNG.width),
          height: Math.abs(currentPNG.height - baselinePNG.height),
          diffPercentage: 1.0
        }]
      };
    }

    // Compare pixels
    let totalDiff = 0;
    const totalPixels = currentPNG.width * currentPNG.height;
    const diffMap: number[] = [];

    for (let i = 0; i < currentPNG.data.length; i += 4) {
      const rDiff = Math.abs(currentPNG.data[i] - baselinePNG.data[i]);
      const gDiff = Math.abs(currentPNG.data[i + 1] - baselinePNG.data[i + 1]);
      const bDiff = Math.abs(currentPNG.data[i + 2] - baselinePNG.data[i + 2]);
      const aDiff = Math.abs(currentPNG.data[i + 3] - baselinePNG.data[i + 3]);

      const pixelDiff = (rDiff + gDiff + bDiff + aDiff) / (4 * 255);
      diffMap.push(pixelDiff);
      totalDiff += pixelDiff;
    }

    const diffPercentage = totalDiff / totalPixels;
    const detected = diffPercentage > threshold;

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (diffPercentage > 0.5) {
      severity = 'high';
    } else if (diffPercentage > 0.2) {
      severity = 'medium';
    }

    // Create diff image (simplified - would generate actual diff image in production)
    let diffImagePath: string | undefined;
    if (detected) {
      // In production, would generate actual diff image
      // For now, just indicate diff was detected
      diffImagePath = options.currentScreenshot.replace('.png', '-diff.png');
    }

    // Find regions with significant differences
    const differences: RegressionDetectionResult['differences'] = [];
    // Simplified: would use more sophisticated region detection in production

    return {
      detected,
      severity,
      diffPercentage,
      differences,
      diffImagePath
    };
  } catch (error) {
    throw new Error(
      `Failed to detect regression: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

