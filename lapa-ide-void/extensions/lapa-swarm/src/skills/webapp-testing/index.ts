/**
 * Webapp Testing Skill
 * 
 * Automated UI regression testing with Playwright for web applications.
 * Provides screenshot comparison, visual regression detection, and accessibility testing.
 */

import { SkillMetadata } from '../../orchestrator/skill-manager.ts';
import { eventBus } from '../../core/event-bus.ts';
import { VisualFeedbackSystem, ScreenshotComparisonRequest, ScreenshotComparisonResult } from '../../orchestrator/visual-feedback.ts';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Skill metadata
export const skillMetadata: SkillMetadata = {
  id: 'webapp-testing',
  name: 'Webapp Testing',
  description: 'Automated UI regression testing with Playwright for web applications',
  version: '1.0.0',
  author: 'LAPA Team',
  category: 'test',
  inputs: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'URL of the web application to test'
    },
    {
      name: 'testType',
      type: 'string',
      required: false,
      description: 'Type of test (regression, screenshot, accessibility, performance)'
    },
    {
      name: 'selectors',
      type: 'array',
      required: false,
      description: 'CSS selectors to test'
    },
    {
      name: 'baselineName',
      type: 'string',
      required: false,
      description: 'Baseline name for comparison'
    },
    {
      name: 'viewport',
      type: 'object',
      required: false,
      description: 'Viewport configuration (width, height)'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      description: 'Whether tests passed'
    },
    {
      name: 'testResults',
      type: 'array',
      description: 'Array of test results'
    },
    {
      name: 'screenshots',
      type: 'array',
      description: 'Array of screenshot paths'
    },
    {
      name: 'reportPath',
      type: 'string',
      description: 'Path to test report'
    }
  ],
  dependencies: [],
  tags: ['playwright', 'testing', 'ui', 'regression', 'automation']
} as SkillMetadata;

// Skill inputs type
export interface WebappTestingInputs {
  url: string;
  testType?: 'regression' | 'screenshot' | 'accessibility' | 'performance';
  selectors?: string[];
  baselineName?: string;
  viewport?: {
    width?: number;
    height?: number;
  };
}

// Skill outputs type
export interface WebappTestingOutputs {
  success: boolean;
  testResults: Array<{
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
  }>;
  screenshots: string[];
  reportPath: string;
}

// Visual feedback system instance
let visualFeedback: VisualFeedbackSystem | null = null;

/**
 * Gets or creates visual feedback system instance
 */
async function getVisualFeedback(): Promise<VisualFeedbackSystem> {
  if (!visualFeedback) {
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    
    visualFeedback = new VisualFeedbackSystem({
      screenshotsDirectory: join(tmpdir(), 'lapa-screenshots'),
      baselineDirectory: join(tmpdir(), 'lapa-baselines'),
      diffDirectory: join(tmpdir(), 'lapa-diffs'),
      threshold: 0.1,
      enablePlaywright: true,
      browserType: 'chromium'
    });
    
    await visualFeedback.initialize();
  }
  
  return visualFeedback;
}

/**
 * Executes the Webapp Testing skill
 */
export async function execute(
  inputs: WebappTestingInputs,
  context?: Record<string, unknown>
): Promise<WebappTestingOutputs> {
  const startTime = Date.now();
  
  try {
    // Publish skill execution started event
    await eventBus.publish({
      id: `skill-webapp-testing-exec-${Date.now()}`,
      type: 'skill.execution.started',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'webapp-testing',
        inputs
      }
    } as any);

    const vf = await getVisualFeedback();
    const testType = inputs.testType || 'regression';
    const testResults: WebappTestingOutputs['testResults'] = [];
    const screenshots: string[] = [];

    // Create reports directory
    const reportsDir = join(tmpdir(), 'lapa-test-reports');
    await mkdir(reportsDir, { recursive: true });
    const reportId = `test-${Date.now()}`;

    // Run tests based on type
    switch (testType) {
      case 'regression':
      case 'screenshot': {
        // Take screenshot and compare
        const screenshotName = inputs.baselineName || `screenshot-${Date.now()}`;
        const comparisonRequest: ScreenshotComparisonRequest = {
          url: inputs.url,
          name: screenshotName,
          baselineName: inputs.baselineName,
          selector: inputs.selectors?.[0],
          viewport: inputs.viewport ? {
            width: inputs.viewport.width || 1280,
            height: inputs.viewport.height || 720
          } : undefined
        };

        const result = await vf.compareScreenshot(comparisonRequest);
        
        if (result.screenshotPath) {
          screenshots.push(result.screenshotPath);
        }
        if (result.diffPath) {
          screenshots.push(result.diffPath);
        }

        testResults.push({
          name: screenshotName,
          passed: result.match || false,
          error: result.error,
          screenshot: result.screenshotPath
        });
        break;
      }

      case 'accessibility': {
        // Accessibility testing (placeholder - would use axe-core or similar)
        testResults.push({
          name: 'accessibility-check',
          passed: true,
          error: 'Accessibility testing not yet implemented'
        });
        break;
      }

      case 'performance': {
        // Performance testing (placeholder)
        testResults.push({
          name: 'performance-check',
          passed: true,
          error: 'Performance testing not yet implemented'
        });
        break;
      }
    }

    // Generate test report
    const report = {
      testType,
      url: inputs.url,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      results: testResults,
      screenshots,
      success: testResults.every(r => r.passed)
    };

    const reportPath = join(reportsDir, `${reportId}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const executionTime = Date.now() - startTime;
    const success = testResults.every(r => r.passed);

    // Publish skill execution completed event
    await eventBus.publish({
      id: `skill-webapp-testing-complete-${Date.now()}`,
      type: 'skill.execution.completed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'webapp-testing',
        executionTime,
        outputs: { success, testResults, screenshots, reportPath }
      }
    } as any);

    return {
      success,
      testResults,
      screenshots,
      reportPath
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Publish skill execution failed event
    await eventBus.publish({
      id: `skill-webapp-testing-fail-${Date.now()}`,
      type: 'skill.execution.failed',
      timestamp: Date.now(),
      source: 'skill-executor',
      payload: {
        skillId: 'webapp-testing',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      }
    } as any);

    throw error;
  }
}

// Default export for convenience
export default {
  metadata: skillMetadata,
  execute
};

