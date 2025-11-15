// Multimodal User Acceptance Testing Scenarios
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisionVoiceController } from '../../multimodal/vision-voice.ts';
import { VisionAgentTool } from '../../multimodal/vision-agent-tool.ts';
import { VoiceAgentTool } from '../../multimodal/voice-agent-tool.ts';
import type { MultimodalConfig } from '../../multimodal/types/index.ts';
import { eventBus } from '../../core/event-bus.ts';
import { AgentToolExecutionContext, AgentToolExecutionResult } from '../../core/types/agent-types.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn()
  }
}));

// Mock NIM inference requests
vi.mock('../../inference/nim.local.ts', () => ({
  sendNemotronVisionInferenceRequest: vi.fn().mockImplementation((model: any, prompt: any, imageData: any, options: any) => {
    // Return different responses based on the prompt
    if (prompt.includes('Describe this image')) {
      return Promise.resolve('This is a test image showing a user interface with buttons and text fields.');
    } else if (prompt.includes('Analyze this screenshot')) {
      return Promise.resolve(JSON.stringify({
        description: 'A sample UI with buttons and text fields',
        layout: {
          width: 1920,
          height: 1080,
          sections: [
            { type: 'header', position: { x: 0, y: 0 }, size: { width: 1920, height: 100 } },
            { type: 'content', position: { x: 0, y: 100 }, size: { width: 1920, height: 880 } },
            { type: 'footer', position: { x: 0, y: 980 }, size: { width: 1920, height: 100 } }
          ]
        },
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          background: '#ffffff'
        },
        textContent: ['Welcome', 'Login', 'Username', 'Password']
      }));
    } else if (prompt.includes('Identify and locate all UI elements')) {
      return Promise.resolve(JSON.stringify([
        {
          type: 'button',
          label: 'Submit',
          position: { x: 100, y: 200 },
          size: { width: 120, height: 40 },
          properties: { color: '#007bff', disabled: false }
        },
        {
          type: 'input',
          label: 'Username',
          position: { x: 100, y: 100 },
          size: { width: 300, height: 40 },
          properties: { placeholder: 'Enter username' }
        }
      ]));
    } else if (prompt.includes('Generate React code')) {
      return Promise.resolve(`
        import React from 'react';
        
        const GeneratedComponent = () => {
          return (
            <div className="container">
              <h1>Welcome</h1>
              <button className="btn btn-primary">Submit</button>
            </div>
          );
        };
        
        export default GeneratedComponent;
      `);
    }
    return Promise.resolve('Mocked vision result');
  }),
  sendNIMInferenceRequest: vi.fn().mockImplementation((model, prompt, options) => {
    // Return different responses based on the prompt
    if (prompt.includes('transcribe')) {
      return Promise.resolve(JSON.stringify({
        text: 'Hello, this is a test transcription.',
        language: 'en',
        processingTime: 150
      }));
    } else if (prompt.includes('synthesize')) {
      return Promise.resolve(JSON.stringify({
        audioBuffer: 'mock-audio-data',
        duration: 2.5,
        format: 'wav',
        processingTime: 200
      }));
    } else if (prompt.includes('command')) {
      return Promise.resolve(JSON.stringify({
        response: 'Hello! How can I assist you today?',
        action: 'greeting'
      }));
    } else if (prompt.includes('question')) {
      return Promise.resolve(JSON.stringify({
        answer: 'The weather is sunny today.',
        processingTime: 300
      }));
    }
    return Promise.resolve('Mocked voice result');
  })
}));

// UAT Scenario Types
interface UATScenario {
  id: string;
  title: string;
  description: string;
  steps: UATStep[];
  expectedOutcome: string;
  priority: 'high' | 'medium' | 'low';
}

interface UATStep {
  step: number;
  action: string;
  input?: any;
  expectedResult: string;
}

interface UATResult {
  scenarioId: string;
  title: string;
  passed: boolean;
  executionTime: number;
  steps: UATStepResult[];
  errorMessage?: string;
}

interface UATStepResult {
  step: number;
  passed: boolean;
  actualResult: string;
  expectedResult: string;
  executionTime: number;
}

// UAT Scenario Runner
class UATScenarioRunner {
  private results: UATResult[] = [];

  async runScenario(scenario: UATScenario, visionVoiceController: VisionVoiceController): Promise<UATResult> {
    const startTime = Date.now();
    const stepResults: UATStepResult[] = [];
    let passed = true;
    let errorMessage: string | undefined;

    try {
      for (const step of scenario.steps) {
        const stepStartTime = Date.now();
        let actualResult = '';
        let stepPassed = false;

        try {
          // Execute the step action
          switch (step.action) {
            case 'processImage':
              if (step.input && step.input.imageData) {
                const imageBuffer = Buffer.from(step.input.imageData, 'base64');
                const result = await visionVoiceController.processImage(imageBuffer);
                actualResult = result;
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'analyzeScreenshot':
              if (step.input && step.input.imageData) {
                const imageBuffer = Buffer.from(step.input.imageData, 'base64');
                const result = await visionVoiceController.analyzeScreenshot(imageBuffer);
                actualResult = JSON.stringify(result);
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'recognizeUIElements':
              if (step.input && step.input.imageData) {
                const imageBuffer = Buffer.from(step.input.imageData, 'base64');
                const result = await visionVoiceController.recognizeUIElements(imageBuffer);
                actualResult = JSON.stringify(result);
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'generateCodeFromDesign':
              if (step.input && step.input.imageData) {
                const imageBuffer = Buffer.from(step.input.imageData, 'base64');
                const result = await visionVoiceController.generateCodeFromDesign(imageBuffer, step.input.framework || 'react');
                actualResult = result;
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'processAudio':
              if (step.input && step.input.audioData) {
                const audioBuffer = Buffer.from(step.input.audioData, 'base64');
                const result = await visionVoiceController.processAudio(audioBuffer);
                actualResult = result;
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'generateAudio':
              if (step.input && step.input.text) {
                const result = await visionVoiceController.generateAudio(step.input.text);
                actualResult = result.toString();
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'executeVoiceCommand':
              if (step.input && step.input.command) {
                const result = await visionVoiceController.executeVoiceCommand(step.input.command);
                actualResult = JSON.stringify(result);
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            case 'askQuestion':
              if (step.input && step.input.question) {
                const result = await visionVoiceController.askQuestion(step.input.question);
                actualResult = result;
                stepPassed = actualResult.includes(step.expectedResult);
              }
              break;

            default:
              throw new Error(`Unknown action: ${step.action}`);
          }
        } catch (error) {
          actualResult = error instanceof Error ? error.message : String(error);
          stepPassed = false;
        }

        const stepExecutionTime = Date.now() - stepStartTime;

        stepResults.push({
          step: step.step,
          passed: stepPassed,
          actualResult,
          expectedResult: step.expectedResult,
          executionTime: stepExecutionTime
        });

        // If any step fails, mark the whole scenario as failed
        if (!stepPassed) {
          passed = false;
        }
      }
    } catch (error) {
      passed = false;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    const executionTime = Date.now() - startTime;

    const result: UATResult = {
      scenarioId: scenario.id,
      title: scenario.title,
      passed,
      executionTime,
      steps: stepResults,
      errorMessage
    };

    this.results.push(result);
    return result;
  }

  getResults(): UATResult[] {
    return [...this.results];
  }

  getPassRate(): number {
    if (this.results.length === 0) return 1;
    const passed = this.results.filter(r => r.passed).length;
    return passed / this.results.length;
  }

  clearResults(): void {
    this.results = [];
  }
}

describe('Multimodal User Acceptance Testing', () => {
  let visionVoiceController: VisionVoiceController;
  let visionAgentTool: VisionAgentTool;
  let voiceAgentTool: VoiceAgentTool;
  let config: MultimodalConfig;
  let uatRunner: UATScenarioRunner;

  beforeEach(() => {
    config = {
      visionModel: 'nemotron-vision',
      voiceModel: 'whisper',
      enableAudioProcessing: true,
      enableImageProcessing: true,
      modalityPriority: ['vision', 'voice'],
      fallbackStrategy: 'sequential'
    };

    visionVoiceController = new VisionVoiceController(config);
    visionAgentTool = new VisionAgentTool(config);
    voiceAgentTool = new VoiceAgentTool();
    uatRunner = new UATScenarioRunner();
  });

  afterEach(() => {
    vi.clearAllMocks();
    uatRunner.clearResults();
  });

  describe('Developer Workflow Scenarios', () => {
    it('should successfully analyze UI screenshot and generate code', async () => {
      const scenario: UATScenario = {
        id: 'dev-001',
        title: 'UI Analysis and Code Generation',
        description: 'Developer uploads a UI screenshot and generates React code from it',
        steps: [
          {
            step: 1,
            action: 'analyzeScreenshot',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'layout'
          },
          {
            step: 2,
            action: 'recognizeUIElements',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'button'
          },
          {
            step: 3,
            action: 'generateCodeFromDesign',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              framework: 'react'
            },
            expectedResult: 'import React'
          }
        ],
        expectedOutcome: 'Successfully analyze UI screenshot and generate React code',
        priority: 'high'
      };

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(3);
      for (const step of result.steps) {
        expect(step.passed).toBe(true);
      }
    });

    it('should successfully process voice commands for code generation', async () => {
      const scenario: UATScenario = {
        id: 'dev-002',
        title: 'Voice-Controlled Code Generation',
        description: 'Developer uses voice commands to generate a login form',
        steps: [
          {
            step: 1,
            action: 'executeVoiceCommand',
            input: {
              command: 'Create a login form with username and password fields'
            },
            expectedResult: 'login form'
          },
          {
            step: 2,
            action: 'generateCodeFromDesign',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              framework: 'react'
            },
            expectedResult: 'form'
          }
        ],
        expectedOutcome: 'Successfully generate login form using voice commands',
        priority: 'high'
      };

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(2);
      for (const step of result.steps) {
        expect(step.passed).toBe(true);
      }
    });
  });

  describe('Multimodal Coordination Scenarios', () => {
    it('should maintain context when switching between vision and voice modalities', async () => {
      const scenario: UATScenario = {
        id: 'mm-001',
        title: 'Multimodal Context Preservation',
        description: 'System preserves context when switching between vision and voice processing',
        steps: [
          {
            step: 1,
            action: 'processImage',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'user interface'
          },
          {
            step: 2,
            action: 'executeVoiceCommand',
            input: {
              command: 'Explain the UI elements I just analyzed'
            },
            expectedResult: 'UI elements'
          }
        ],
        expectedOutcome: 'Context is preserved between vision and voice processing',
        priority: 'high'
      };

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(2);
      for (const step of result.steps) {
        expect(step.passed).toBe(true);
      }
    });

    it('should handle multimodal input with fallback strategies', async () => {
      const scenario: UATScenario = {
        id: 'mm-002',
        title: 'Multimodal Fallback Handling',
        description: 'System gracefully handles failures in one modality by falling back to another',
        steps: [
          {
            step: 1,
            action: 'processMultimodalInput',
            input: {
              image: Buffer.from('invalid-image-data'),
              audio: Buffer.from('mock-audio-data')
            },
            expectedResult: 'audio'
          }
        ],
        expectedOutcome: 'System falls back to audio processing when image processing fails',
        priority: 'medium'
      };

      // Mock vision agent to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].passed).toBe(true);
      expect(mockProcessImage).toHaveBeenCalled();
    });
  });

  describe('Agent Tool Integration Scenarios', () => {
    it('should successfully execute vision agent tool', async () => {
      const scenario: UATScenario = {
        id: 'tool-001',
        title: 'Vision Agent Tool Execution',
        description: 'Execute vision agent tool to process an image',
        steps: [
          {
            step: 1,
            action: 'executeVisionTool',
            input: {
              action: 'processImage',
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'user interface'
          }
        ],
        expectedOutcome: 'Vision agent tool successfully processes image',
        priority: 'high'
      };

      const startTime = Date.now();
      const stepResults: UATStepResult[] = [];
      let passed = true;
      let errorMessage: string | undefined;

      try {
        const step = scenario.steps[0];
        const stepStartTime = Date.now();
        let actualResult = '';
        let stepPassed = false;

        try {
          // Execute vision agent tool
          const context: AgentToolExecutionContext = {
            toolName: 'vision-agent',
            parameters: step.input,
            context: {},
            agentId: 'test-agent',
            taskId: 'test-task'
          };

          const result: AgentToolExecutionResult = await visionAgentTool.execute(context);
          actualResult = result.output as string;
          stepPassed = actualResult.includes(step.expectedResult);
        } catch (error) {
          actualResult = error instanceof Error ? error.message : String(error);
          stepPassed = false;
        }

        const stepExecutionTime = Date.now() - stepStartTime;

        stepResults.push({
          step: step.step,
          passed: stepPassed,
          actualResult,
          expectedResult: step.expectedResult,
          executionTime: stepExecutionTime
        });

        if (!stepPassed) {
          passed = false;
        }
      } catch (error) {
        passed = false;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      const executionTime = Date.now() - startTime;

      const result: UATResult = {
        scenarioId: scenario.id,
        title: scenario.title,
        passed,
        executionTime,
        steps: stepResults,
        errorMessage
      };

      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].passed).toBe(true);
    });

    it('should successfully execute voice agent tool', async () => {
      const scenario: UATScenario = {
        id: 'tool-002',
        title: 'Voice Agent Tool Execution',
        description: 'Execute voice agent tool to process audio',
        steps: [
          {
            step: 1,
            action: 'executeVoiceTool',
            input: {
              action: 'transcribe',
              audioData: 'mock-audio-data'
            },
            expectedResult: 'Hello'
          }
        ],
        expectedOutcome: 'Voice agent tool successfully processes audio',
        priority: 'high'
      };

      const startTime = Date.now();
      const stepResults: UATStepResult[] = [];
      let passed = true;
      let errorMessage: string | undefined;

      try {
        const step = scenario.steps[0];
        const stepStartTime = Date.now();
        let actualResult = '';
        let stepPassed = false;

        try {
          // Execute voice agent tool
          const context: AgentToolExecutionContext = {
            toolName: 'voice-agent',
            parameters: step.input,
            context: {},
            agentId: 'test-agent',
            taskId: 'test-task'
          };

          const result: AgentToolExecutionResult = await voiceAgentTool.execute(context);
          actualResult = result.output.text;
          stepPassed = actualResult.includes(step.expectedResult);
        } catch (error) {
          actualResult = error instanceof Error ? error.message : String(error);
          stepPassed = false;
        }

        const stepExecutionTime = Date.now() - stepStartTime;

        stepResults.push({
          step: step.step,
          passed: stepPassed,
          actualResult,
          expectedResult: step.expectedResult,
          executionTime: stepExecutionTime
        });

        if (!stepPassed) {
          passed = false;
        }
      } catch (error) {
        passed = false;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      const executionTime = Date.now() - startTime;

      const result: UATResult = {
        scenarioId: scenario.id,
        title: scenario.title,
        passed,
        executionTime,
        steps: stepResults,
        errorMessage
      };

      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].passed).toBe(true);
    });
  });

  describe('Real-World Use Case Scenarios', () => {
    it('should handle complete developer workflow: design to implementation', async () => {
      const scenario: UATScenario = {
        id: 'real-001',
        title: 'Complete Developer Workflow',
        description: 'Developer goes from UI design to implementation using multimodal capabilities',
        steps: [
          {
            step: 1,
            action: 'analyzeScreenshot',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'layout'
          },
          {
            step: 2,
            action: 'recognizeUIElements',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            expectedResult: 'button'
          },
          {
            step: 3,
            action: 'generateCodeFromDesign',
            input: {
              imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              framework: 'react'
            },
            expectedResult: 'import React'
          },
          {
            step: 4,
            action: 'executeVoiceCommand',
            input: {
              command: 'Add validation to the form fields'
            },
            expectedResult: 'validation'
          }
        ],
        expectedOutcome: 'Successfully complete developer workflow from design to implementation',
        priority: 'high'
      };

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      expect(result.passed).toBe(true);
      expect(result.steps).toHaveLength(4);
      for (const step of result.steps) {
        expect(step.passed).toBe(true);
      }
    });

    it('should handle error recovery in multimodal processing', async () => {
      const scenario: UATScenario = {
        id: 'real-002',
        title: 'Error Recovery in Multimodal Processing',
        description: 'System gracefully handles errors and recovers appropriately',
        steps: [
          {
            step: 1,
            action: 'processImage',
            input: {
              imageData: 'invalid-image-data'
            },
            expectedResult: 'Error'
          },
          {
            step: 2,
            action: 'processAudio',
            input: {
              audioData: 'mock-audio-data'
            },
            expectedResult: 'Hello'
          }
        ],
        expectedOutcome: 'System handles errors gracefully and continues processing',
        priority: 'medium'
      };

      // Mock vision agent to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockRejectedValue(new Error('Invalid image data'));

      const result = await uatRunner.runScenario(scenario, visionVoiceController);
      
      // First step should fail (which is expected in this test case)
      // Second step should pass
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].passed).toBe(false); // Error case
      expect(result.steps[1].passed).toBe(true);  // Success case
      expect(mockProcessImage).toHaveBeenCalled();
    });
  });

  describe('UAT Reporting', () => {
    it('should generate comprehensive UAT report', async () => {
      // Run several scenarios
      const scenarios: UATScenario[] = [
        {
          id: 'report-001',
          title: 'Test Scenario 1',
          description: 'Test scenario for reporting',
          steps: [
            {
              step: 1,
              action: 'processImage',
              input: {
                imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
              },
              expectedResult: 'user interface'
            }
          ],
          expectedOutcome: 'Successfully process image',
          priority: 'high'
        },
        {
          id: 'report-002',
          title: 'Test Scenario 2',
          description: 'Test scenario for reporting',
          steps: [
            {
              step: 1,
              action: 'processAudio',
              input: {
                audioData: 'mock-audio-data'
              },
              expectedResult: 'Hello'
            }
          ],
          expectedOutcome: 'Successfully process audio',
          priority: 'high'
        }
      ];

      // Run all scenarios
      for (const scenario of scenarios) {
        await uatRunner.runScenario(scenario, visionVoiceController);
      }

      const results = uatRunner.getResults();
      const passRate = uatRunner.getPassRate();

      expect(results).toHaveLength(2);
      expect(passRate).toBe(1.0); // 100% pass rate

      // Verify each result
      for (const result of results) {
        expect(result.passed).toBe(true);
        expect(result.steps).toHaveLength(1);
        expect(result.steps[0].passed).toBe(true);
      }
    });
  });
});