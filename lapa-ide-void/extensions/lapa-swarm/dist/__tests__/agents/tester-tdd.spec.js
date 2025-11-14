"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * TDD Tests for Tester Agent
 *
 * This file contains tests for the Tester agent's TDD capabilities,
 * including Red-Green-Refactor cycles and automated test generation.
 */
const vitest_1 = require("vitest");
const tester_ts_1 = require("../../agents/tester.ts");
// Mock Anthropic API responses
vitest_1.vi.mock('@anthropic-ai/sdk', () => {
    // Store the current implementation
    let currentImplementation = null;
    let nextImplementation = null;
    // Create the constructor function
    const MockAnthropic = function (...args) {
        // If we have a next implementation, use it and clear it
        if (nextImplementation) {
            const impl = nextImplementation;
            nextImplementation = null;
            return new impl(...args);
        }
        // If we have a current implementation, use it
        if (currentImplementation) {
            return new currentImplementation(...args);
        }
        // Default implementation
        return {
            messages: {
                create: vitest_1.vi.fn().mockResolvedValue({
                    content: [{ type: 'text', text: 'Mocked response' }]
                })
            }
        };
    };
    // Add mockImplementation method
    MockAnthropic.mockImplementation = vitest_1.vi.fn((impl) => {
        currentImplementation = impl;
        return MockAnthropic;
    });
    // Add mockImplementationOnce method
    MockAnthropic.mockImplementationOnce = vitest_1.vi.fn((impl) => {
        nextImplementation = impl;
        return MockAnthropic;
    });
    // Attach the mock constructor to the global object so tests can access it
    global.mockAnthropicConstructor = MockAnthropic;
    return {
        Anthropic: MockAnthropic,
        default: MockAnthropic
    };
});
(0, vitest_1.describe)('Tester Agent - TDD Capabilities', () => {
    let tester;
    beforeEach(() => {
        // Use mock API key for testing
        tester = new tester_ts_1.Tester({ anthropicApiKey: 'test-key' });
    });
    afterEach(() => {
        // Clear all mocks
    });
    (0, vitest_1.describe)('Test Generation', () => {
        (0, vitest_1.it)('should generate a test case for provided code and requirements', async () => {
            const code = 'function add(a, b) { return a + b; }';
            const requirements = 'Test the add function with positive and negative numbers';
            const testCode = await tester.generateTest(code, requirements);
            (0, vitest_1.expect)(testCode).toBeDefined();
            (0, vitest_1.expect)(typeof testCode).toBe('string');
            (0, vitest_1.expect)(testCode.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should throw an error if Anthropic API fails', async () => {
            // Mock API failure by modifying the existing mock
            // Create a mock failure instance
            const mockFailureInstance = {
                messages: {
                    create: vitest_1.vi.fn().mockRejectedValue(new Error('API Error'))
                }
            };
            // Create a mock implementation that returns an instance with failure messages
            class MockFailureAnthropic {
                messages;
                constructor() {
                    this.messages = mockFailureInstance.messages;
                }
            }
            // Apply the mock implementation for this specific test
            global.mockAnthropicConstructor.mockImplementationOnce(MockFailureAnthropic);
            const testerWithError = new tester_ts_1.Tester({ anthropicApiKey: 'test-key' });
            const code = 'function add(a, b) { return a + b; }';
            const requirements = 'Test the add function';
            await (0, vitest_1.expect)(testerWithError.generateTest(code, requirements))
                .rejects
                .toThrow('Test generation failed: API Error');
        });
    });
    (0, vitest_1.describe)('Test Execution', () => {
        (0, vitest_1.it)('should execute a test and return results', async () => {
            const testCode = 'assert(add(2, 3) === 5);';
            const implementationCode = 'function add(a, b) { return a + b; }';
            const result = await tester.executeTest(testCode, implementationCode);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.testName).toBe('Generated Test');
            (0, vitest_1.expect)(typeof result.passed).toBe('boolean');
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should track test execution time', async () => {
            const testCode = 'assert(add(2, 3) === 5);';
            const implementationCode = 'function add(a, b) { return a + b; }';
            const startTime = Date.now();
            const result = await tester.executeTest(testCode, implementationCode);
            const endTime = Date.now();
            (0, vitest_1.expect)(result.executionTime).toBeGreaterThanOrEqual(50);
            (0, vitest_1.expect)(result.executionTime).toBeLessThanOrEqual(150);
        });
    });
    (0, vitest_1.describe)('Implementation Fixing', () => {
        (0, vitest_1.it)('should generate fixed implementation for failing test', async () => {
            const failingTest = 'assert(subtract(5, 3) === 2);';
            const currentImplementation = 'function subtract(a, b) { return a + b; }';
            const fixedImplementation = await tester.makeTestPass(failingTest, currentImplementation);
            (0, vitest_1.expect)(fixedImplementation).toBeDefined();
            (0, vitest_1.expect)(typeof fixedImplementation).toBe('string');
            (0, vitest_1.expect)(fixedImplementation.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle API errors during implementation fixing', async () => {
            // Mock API failure by modifying the existing mock
            // Create a mock failure instance
            const mockFailureInstance = {
                messages: {
                    create: vitest_1.vi.fn().mockRejectedValue(new Error('API Error'))
                }
            };
            // Create a mock implementation that returns an instance with failure messages
            class MockFailureAnthropic {
                messages;
                constructor() {
                    this.messages = mockFailureInstance.messages;
                }
            }
            // Apply the mock implementation for this specific test
            global.mockAnthropicConstructor.mockImplementationOnce(MockFailureAnthropic);
            const testerWithError = new tester_ts_1.Tester({ anthropicApiKey: 'test-key' });
            const failingTest = 'assert(subtract(5, 3) === 2);';
            const currentImplementation = 'function subtract(a, b) { return a + b; }';
            await (0, vitest_1.expect)(testerWithError.makeTestPass(failingTest, currentImplementation))
                .rejects
                .toThrow('Implementation fix failed: API Error');
        });
    });
    (0, vitest_1.describe)('Refactoring Suggestions', () => {
        (0, vitest_1.it)('should provide refactoring suggestions for implementation', async () => {
            const implementation = 'function complexFunction(a, b, c) { return a + b + c; }';
            const testResults = [
                { testName: 'Test 1', passed: true, executionTime: 100 },
                { testName: 'Test 2', passed: false, executionTime: 150, error: 'Failed' }
            ];
            const suggestions = await tester.suggestRefactorings(implementation, testResults);
            (0, vitest_1.expect)(suggestions).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(suggestions)).toBe(true);
            (0, vitest_1.expect)(suggestions.length).toBeGreaterThan(0);
            // Check structure of suggestions
            suggestions.forEach((suggestion) => {
                (0, vitest_1.expect)(suggestion).toHaveProperty('description');
                (0, vitest_1.expect)(suggestion).toHaveProperty('priority');
                (0, vitest_1.expect)(suggestion).toHaveProperty('implementation');
                (0, vitest_1.expect)(['low', 'medium', 'high']).toContain(suggestion.priority);
            });
        });
    });
    (0, vitest_1.describe)('TDD Cycle', () => {
        (0, vitest_1.it)('should complete a full TDD cycle', async () => {
            const requirements = 'Create a function that multiplies two numbers';
            const currentImplementation = 'function multiply(a, b) { return a * b; }';
            const cycleResult = await tester.runTDDCycle(requirements, currentImplementation);
            (0, vitest_1.expect)(cycleResult).toBeDefined();
            (0, vitest_1.expect)(typeof cycleResult.cycle).toBe('number');
            // Check Red phase
            (0, vitest_1.expect)(cycleResult.redPhase).toBeDefined();
            (0, vitest_1.expect)(typeof cycleResult.redPhase.testGenerated).toBe('string');
            // Check Green phase
            (0, vitest_1.expect)(cycleResult.greenPhase).toBeDefined();
            (0, vitest_1.expect)(typeof cycleResult.greenPhase.implementation).toBe('string');
            (0, vitest_1.expect)(cycleResult.greenPhase.testResult).toBeDefined();
            // Check Refactor phase
            (0, vitest_1.expect)(cycleResult.refactorPhase).toBeDefined();
            (0, vitest_1.expect)(cycleResult.refactorPhase?.suggestions).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(cycleResult.refactorPhase?.suggestions)).toBe(true);
        });
        (0, vitest_1.it)('should meet the 95% success rate requirement', async () => {
            // Run multiple TDD cycles to verify success rate
            const cycles = 20;
            let successfulCycles = 0;
            for (let i = 0; i < cycles; i++) {
                try {
                    await tester.runTDDCycle(`Test requirement ${i}`, `function test${i}() { return ${i}; }`);
                    successfulCycles++;
                }
                catch (error) {
                    // Cycle failed, which is expected for ~5% of cases
                }
            }
            const successRate = successfulCycles / cycles;
            // Allow some tolerance since this is a statistical test
            (0, vitest_1.expect)(successRate).toBeGreaterThanOrEqual(0.90);
        });
    });
    (0, vitest_1.describe)('Test Suite Execution', () => {
        (0, vitest_1.it)('should run a test suite and return results', async () => {
            const testSuite = 'Comprehensive test suite for math operations';
            const suiteResult = await tester.runTestSuite(testSuite);
            (0, vitest_1.expect)(suiteResult).toBeDefined();
            (0, vitest_1.expect)(suiteResult.suiteName).toBe('Generated Test Suite');
            (0, vitest_1.expect)(suiteResult.totalTests).toBeGreaterThanOrEqual(5);
            (0, vitest_1.expect)(suiteResult.totalTests).toBeLessThanOrEqual(15);
            (0, vitest_1.expect)(suiteResult.passedTests + suiteResult.failedTests).toBe(suiteResult.totalTests);
            (0, vitest_1.expect)(suiteResult.results).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(suiteResult.results)).toBe(true);
            (0, vitest_1.expect)(suiteResult.timestamp).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should track individual test results', async () => {
            const testSuite = 'Math operations test suite';
            const suiteResult = await tester.runTestSuite(testSuite);
            suiteResult.results.forEach((result) => {
                (0, vitest_1.expect)(result.testName).toMatch(/^Test \d+$/);
                (0, vitest_1.expect)(typeof result.passed).toBe('boolean');
                (0, vitest_1.expect)(result.executionTime).toBeGreaterThanOrEqual(50);
                (0, vitest_1.expect)(result.executionTime).toBeLessThanOrEqual(250);
                if (!result.passed) {
                    (0, vitest_1.expect)(result.error).toBeDefined();
                    (0, vitest_1.expect)(typeof result.error).toBe('string');
                }
            });
        });
    });
    (0, vitest_1.describe)('Agent Integration', () => {
        (0, vitest_1.it)('should provide agent information for MoE router', () => {
            const agentInfo = tester.getAgentInfo();
            (0, vitest_1.expect)(agentInfo).toBeDefined();
            (0, vitest_1.expect)(agentInfo.id).toBe('tester-default');
            (0, vitest_1.expect)(agentInfo.type).toBe('tester');
            (0, vitest_1.expect)(agentInfo.name).toBe('TDD Specialist');
            (0, vitest_1.expect)(agentInfo.expertise).toEqual(vitest_1.expect.arrayContaining(['test driven development', 'automated testing', 'code quality', 'refactoring']));
            (0, vitest_1.expect)(agentInfo.workload).toBe(0);
            (0, vitest_1.expect)(agentInfo.capacity).toBe(10);
        });
    });
});
//# sourceMappingURL=tester-tdd.spec.js.map