"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Multimodal Agent Integration Test Suite
const vision_voice_ts_1 = require("../../multimodal/vision-voice.ts");
const vision_agent_tool_ts_1 = require("../../multimodal/vision-agent-tool.ts");
const voice_agent_tool_ts_1 = require("../../multimodal/voice-agent-tool.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
const agent_tool_ts_1 = require("../../core/agent-tool.ts");
const handoffs_ts_1 = require("../../orchestrator/handoffs.ts");
// Mock the event bus
vi.mock('../../core/event-bus', () => ({
    eventBus: {
        publish: vi.fn()
    }
}));
// Mock NIM inference requests
vi.mock('../../inference/nim.local', () => ({
    sendNemotronVisionInferenceRequest: vi.fn().mockImplementation((model, prompt, imageData, options) => {
        // Return different responses based on the prompt
        if (prompt.includes('Describe this image')) {
            return Promise.resolve('This is a test image showing a user interface with buttons and text fields.');
        }
        else if (prompt.includes('Analyze this screenshot')) {
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
        }
        else if (prompt.includes('Identify and locate all UI elements')) {
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
        }
        else if (prompt.includes('Generate React code')) {
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
        }
        else if (prompt.includes('synthesize')) {
            return Promise.resolve(JSON.stringify({
                audioBuffer: 'mock-audio-data',
                duration: 2.5,
                format: 'wav',
                processingTime: 200
            }));
        }
        else if (prompt.includes('command')) {
            return Promise.resolve(JSON.stringify({
                response: 'Hello! How can I assist you today?',
                action: 'greeting'
            }));
        }
        else if (prompt.includes('question')) {
            return Promise.resolve(JSON.stringify({
                answer: 'The weather is sunny today.',
                processingTime: 300
            }));
        }
        return Promise.resolve('Mocked voice result');
    })
}));
// Integration Test Suite Runner
class IntegrationTestSuiteRunner {
    results = [];
    async runTest(testName, testFn) {
        const startTime = Date.now();
        let passed = true;
        let errorMessage;
        let details;
        try {
            await testFn();
        }
        catch (error) {
            passed = false;
            errorMessage = error instanceof Error ? error.message : String(error);
        }
        const executionTime = Date.now() - startTime;
        const result = {
            testName,
            passed,
            executionTime,
            errorMessage,
            details
        };
        this.results.push(result);
        return result;
    }
    getResults() {
        return [...this.results];
    }
    getPassRate() {
        if (this.results.length === 0)
            return 1;
        const passed = this.results.filter(r => r.passed).length;
        return passed / this.results.length;
    }
    clearResults() {
        this.results = [];
    }
}
describe('Multimodal Agent Integration', () => {
    let testContext;
    let testRunner;
    beforeEach(() => {
        const config = {
            visionModel: 'nemotron-vision',
            voiceModel: 'whisper',
            enableAudioProcessing: true,
            enableImageProcessing: true,
            modalityPriority: ['vision', 'voice'],
            fallbackStrategy: 'sequential'
        };
        // Create multimodal components
        const visionVoiceController = new vision_voice_ts_1.VisionVoiceController(config);
        const visionAgentTool = new vision_agent_tool_ts_1.VisionAgentTool(config);
        const voiceAgentTool = new voice_agent_tool_ts_1.VoiceAgentTool();
        // Create agent wrapper
        const agentConfig = {
            id: 'multimodal-test-agent',
            type: 'multimodal',
            name: 'Multimodal Test Agent',
            capabilities: ['vision-processing', 'voice-processing', 'code-generation'],
            workload: 0,
            capacity: 10
        };
        const agentWrapper = new agent_tool_ts_1.HelixTeamAgentWrapper(agentConfig.id, agentConfig.type, agentConfig.name, agentConfig.capabilities, agentConfig.workload, agentConfig.capacity, agent_tool_ts_1.agentToolRegistry);
        // Add tools to agent
        agentWrapper.addTool(visionAgentTool);
        agentWrapper.addTool(voiceAgentTool);
        // Create handoff system
        const handoffSystem = new handoffs_ts_1.HybridHandoffSystem();
        testContext = {
            visionVoiceController,
            visionAgentTool,
            voiceAgentTool,
            agentWrapper,
            toolRegistry: agent_tool_ts_1.agentToolRegistry,
            handoffSystem
        };
        testRunner = new IntegrationTestSuiteRunner();
    });
    afterEach(() => {
        vi.clearAllMocks();
        testRunner.clearResults();
    });
    describe('Agent Tool Registration and Discovery', () => {
        it('should register and discover vision agent tool', async () => {
            const result = await testRunner.runTest('vision_tool_registration', async () => {
                // Register vision tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Verify tool is registered
                const isRegistered = testContext.toolRegistry.hasTool('vision-agent');
                expect(isRegistered).toBe(true);
                // Get tool by name
                const tool = testContext.toolRegistry.getTool('vision-agent');
                expect(tool).toBeDefined();
                expect(tool?.name).toBe('vision-agent');
                expect(tool?.type).toBe('code-generation');
            });
            expect(result.passed).toBe(true);
        });
        it('should register and discover voice agent tool', async () => {
            const result = await testRunner.runTest('voice_tool_registration', async () => {
                // Register voice tool
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Verify tool is registered
                const isRegistered = testContext.toolRegistry.hasTool('voice-agent');
                expect(isRegistered).toBe(true);
                // Get tool by name
                const tool = testContext.toolRegistry.getTool('voice-agent');
                expect(tool).toBeDefined();
                expect(tool?.name).toBe('voice-agent');
                expect(tool?.type).toBe('code-generation');
            });
            expect(result.passed).toBe(true);
        });
        it('should list all registered multimodal tools', async () => {
            const result = await testRunner.runTest('list_multimodal_tools', async () => {
                // Register both tools
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Get all tool names
                const toolNames = testContext.toolRegistry.getToolNames();
                expect(toolNames).toContain('vision-agent');
                expect(toolNames).toContain('voice-agent');
                expect(toolNames.length).toBeGreaterThanOrEqual(2);
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Agent Tool Execution Integration', () => {
        it('should execute vision agent tool through agent wrapper', async () => {
            const result = await testRunner.runTest('execute_vision_tool_via_wrapper', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                // Execute tool through agent wrapper
                const context = {
                    toolName: 'vision-agent',
                    parameters: {
                        action: 'processImage',
                        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'test-task-1'
                };
                const executionResult = await testContext.agentWrapper.executeTool('vision-agent', context);
                expect(executionResult.success).toBe(true);
                expect(executionResult.output).toBeDefined();
                expect(executionResult.executionTime).toBeGreaterThan(0);
            });
            expect(result.passed).toBe(true);
        });
        it('should execute voice agent tool through agent wrapper', async () => {
            const result = await testRunner.runTest('execute_voice_tool_via_wrapper', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.voiceAgentTool);
                // Execute tool through agent wrapper
                const context = {
                    toolName: 'voice-agent',
                    parameters: {
                        action: 'transcribe',
                        audioData: 'mock-audio-data'
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'test-task-2'
                };
                const executionResult = await testContext.agentWrapper.executeTool('voice-agent', context);
                expect(executionResult.success).toBe(true);
                expect(executionResult.output).toBeDefined();
                expect(executionResult.executionTime).toBeGreaterThan(0);
            });
            expect(result.passed).toBe(true);
        });
        it('should handle invalid tool execution gracefully', async () => {
            const result = await testRunner.runTest('handle_invalid_tool_execution', async () => {
                // Try to execute a non-existent tool
                const context = {
                    toolName: 'non-existent-tool',
                    parameters: {},
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'test-task-3'
                };
                const executionResult = await testContext.agentWrapper.executeTool('non-existent-tool', context);
                expect(executionResult.success).toBe(false);
                expect(executionResult.error).toBeDefined();
                expect(executionResult.error).toContain('not found');
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Multimodal Controller Integration', () => {
        it('should integrate vision agent tool with multimodal controller', async () => {
            const result = await testRunner.runTest('integrate_vision_tool_with_controller', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                // Process image through controller
                const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
                const result = await testContext.visionVoiceController.processImage(imageBuffer);
                expect(result).toBe('This is a test image showing a user interface with buttons and text fields.');
            });
            expect(result.passed).toBe(true);
        });
        it('should integrate voice agent tool with multimodal controller', async () => {
            const result = await testRunner.runTest('integrate_voice_tool_with_controller', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.voiceAgentTool);
                // Process audio through controller
                const audioBuffer = Buffer.from('mock-audio-data');
                const result = await testContext.visionVoiceController.processAudio(audioBuffer);
                expect(result).toContain('Hello, this is a test transcription.');
            });
            expect(result.passed).toBe(true);
        });
        it('should handle multimodal input through agent tools', async () => {
            const result = await testRunner.runTest('handle_multimodal_input_via_agents', async () => {
                // Register tools
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Add tools to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                testContext.agentWrapper.addTool(testContext.voiceAgentTool);
                // Process multimodal input
                const input = {
                    image: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64'),
                    audio: Buffer.from('mock-audio-data')
                };
                const result = await testContext.visionVoiceController.processMultimodalInput(input);
                expect(result).toBeDefined();
                expect(result.text).toBeDefined();
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Handoff System Integration', () => {
        it('should integrate with hybrid handoff system', async () => {
            const result = await testRunner.runTest('integrate_with_handoff_system', async () => {
                // Verify handoff system is initialized
                expect(testContext.handoffSystem).toBeDefined();
                // Get configuration
                const config = testContext.handoffSystem.getConfig();
                expect(config).toBeDefined();
                // Check config health
                const health = testContext.handoffSystem.checkConfigHealth();
                expect(health.isValid).toBe(true);
            });
            expect(result.passed).toBe(true);
        });
        it('should execute task with handoff capabilities', async () => {
            const result = await testRunner.runTest('execute_task_with_handoffs', async () => {
                // Create a test task
                const task = {
                    id: 'integration-test-task',
                    description: 'Test task for multimodal integration',
                    input: 'Test input data',
                    priority: 'medium'
                };
                // Create test context
                const context = {
                    testData: 'integration test data',
                    agentId: testContext.agentWrapper.id
                };
                // Execute task with handoffs
                // Note: This is a simplified test as the actual handoff system would require more complex setup
                const executionResult = await testContext.handoffSystem.executeTaskWithHandoffs(task, context);
                expect(executionResult).toBeDefined();
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Event Bus Integration', () => {
        it('should publish events during tool execution', async () => {
            const result = await testRunner.runTest('publish_events_during_execution', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                // Execute tool
                const context = {
                    toolName: 'vision-agent',
                    parameters: {
                        action: 'processImage',
                        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'event-test-task'
                };
                await testContext.agentWrapper.executeTool('vision-agent', context);
                // Verify events were published
                expect(event_bus_ts_1.eventBus.publish).toHaveBeenCalled();
            });
            expect(result.passed).toBe(true);
        });
        it('should handle event bus errors gracefully', async () => {
            const result = await testRunner.runTest('handle_event_bus_errors', async () => {
                // Mock event bus to throw an error
                const mockPublish = vi.spyOn(event_bus_ts_1.eventBus, 'publish').mockImplementationOnce(() => {
                    throw new Error('Event bus error');
                });
                // Register tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                // Execute tool - should not throw despite event bus error
                const context = {
                    toolName: 'vision-agent',
                    parameters: {
                        action: 'processImage',
                        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'event-error-test-task'
                };
                const executionResult = await testContext.agentWrapper.executeTool('vision-agent', context);
                // Tool execution should still succeed even if event publishing fails
                expect(executionResult.success).toBe(true);
                // Restore mock
                mockPublish.mockRestore();
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Performance and Resource Management', () => {
        it('should manage agent workload correctly', async () => {
            const result = await testRunner.runTest('manage_agent_workload', async () => {
                // Check initial workload
                expect(testContext.agentWrapper.workload).toBe(0);
                expect(testContext.agentWrapper.capacity).toBe(10);
                // Add tools and check capabilities
                expect(testContext.agentWrapper.tools).toHaveLength(2);
                expect(testContext.agentWrapper.capabilities).toContain('vision-processing');
                expect(testContext.agentWrapper.capabilities).toContain('voice-processing');
            });
            expect(result.passed).toBe(true);
        });
        it('should handle concurrent tool executions', async () => {
            const result = await testRunner.runTest('handle_concurrent_executions', async () => {
                // Register tools
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                // Add tools to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                testContext.agentWrapper.addTool(testContext.voiceAgentTool);
                // Create multiple execution contexts
                const contexts = [
                    {
                        toolName: 'vision-agent',
                        parameters: {
                            action: 'processImage',
                            imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
                        },
                        context: {},
                        agentId: testContext.agentWrapper.id,
                        taskId: 'concurrent-test-1'
                    },
                    {
                        toolName: 'voice-agent',
                        parameters: {
                            action: 'transcribe',
                            audioData: 'mock-audio-data'
                        },
                        context: {},
                        agentId: testContext.agentWrapper.id,
                        taskId: 'concurrent-test-2'
                    }
                ];
                // Execute tools concurrently
                const results = await Promise.all(contexts.map(context => testContext.agentWrapper.executeTool(context.toolName, context)));
                // Verify all executions succeeded
                expect(results).toHaveLength(2);
                expect(results[0].success).toBe(true);
                expect(results[1].success).toBe(true);
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should recover from tool execution errors', async () => {
            const result = await testRunner.runTest('recover_from_tool_errors', async () => {
                // Register tool
                testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                // Add tool to agent
                testContext.agentWrapper.addTool(testContext.visionAgentTool);
                // Execute tool with invalid parameters
                const context = {
                    toolName: 'vision-agent',
                    parameters: {
                        action: 'invalid-action',
                        invalidParam: 'invalid-value'
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'error-recovery-test'
                };
                const executionResult = await testContext.agentWrapper.executeTool('vision-agent', context);
                // Should handle error gracefully
                expect(executionResult.success).toBe(false);
                expect(executionResult.error).toBeDefined();
                // Execute tool with valid parameters afterward
                const validContext = {
                    toolName: 'vision-agent',
                    parameters: {
                        action: 'processImage',
                        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
                    },
                    context: {},
                    agentId: testContext.agentWrapper.id,
                    taskId: 'error-recovery-test-2'
                };
                const validResult = await testContext.agentWrapper.executeTool('vision-agent', validContext);
                // Should succeed with valid parameters
                expect(validResult.success).toBe(true);
                expect(validResult.output).toBeDefined();
            });
            expect(result.passed).toBe(true);
        });
        it('should handle agent tool registry errors gracefully', async () => {
            const result = await testRunner.runTest('handle_registry_errors', async () => {
                // Try to get a non-existent tool
                const tool = testContext.toolRegistry.getTool('non-existent-tool');
                expect(tool).toBeUndefined();
                // Check if tool exists
                const hasTool = testContext.toolRegistry.hasTool('non-existent-tool');
                expect(hasTool).toBe(false);
                // Try to create a tool with non-existent factory
                const createdTool = testContext.toolRegistry.createTool('non-existent-factory');
                expect(createdTool).toBeUndefined();
            });
            expect(result.passed).toBe(true);
        });
    });
    describe('Integration Test Reporting', () => {
        it('should generate comprehensive integration test report', async () => {
            // Run a series of integration tests
            const tests = [
                () => testRunner.runTest('registration_test', async () => {
                    testContext.toolRegistry.registerTool(testContext.visionAgentTool);
                    expect(testContext.toolRegistry.hasTool('vision-agent')).toBe(true);
                }),
                () => testRunner.runTest('execution_test', async () => {
                    testContext.toolRegistry.registerTool(testContext.voiceAgentTool);
                    testContext.agentWrapper.addTool(testContext.voiceAgentTool);
                    const context = {
                        toolName: 'voice-agent',
                        parameters: { action: 'transcribe', audioData: 'mock-data' },
                        context: {},
                        agentId: testContext.agentWrapper.id,
                        taskId: 'report-test'
                    };
                    const result = await testContext.agentWrapper.executeTool('voice-agent', context);
                    expect(result.success).toBe(true);
                }),
                () => testRunner.runTest('controller_integration_test', async () => {
                    const imageBuffer = Buffer.from('test-image-data');
                    // This will use the mock implementation
                    const result = await testContext.visionVoiceController.processImage(imageBuffer);
                    expect(result).toBe('This is a test image showing a user interface with buttons and text fields.');
                })
            ];
            // Run all tests
            for (const test of tests) {
                await test();
            }
            const results = testRunner.getResults();
            const passRate = testRunner.getPassRate();
            expect(results).toHaveLength(3);
            expect(passRate).toBe(1.0); // 100% pass rate
            // Verify each result
            for (const result of results) {
                expect(result.passed).toBe(true);
                expect(result.executionTime).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=agent.integration.test.js.map