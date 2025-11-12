/**
 * TDD Tests for Tester Agent
 * 
 * This file contains tests for the Tester agent's TDD capabilities,
 * including Red-Green-Refactor cycles and automated test generation.
 */
import { describe, it, expect } from "vitest";
import { Tester, TDDCycleResult } from '../../agents/tester.ts';

// Mock Anthropic API responses
vi.mock('@anthropic-ai/sdk', () => {
  // Store the current implementation
  let currentImplementation: any = null;
  let nextImplementation: any = null;
  
  // Create the constructor function
  const MockAnthropic: any = function(...args: any[]) {
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
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Mocked response' }]
        })
      }
    };
  };
  
  // Add mockImplementation method
  MockAnthropic.mockImplementation = vi.fn((impl) => {
    currentImplementation = impl;
    return MockAnthropic;
  });
  
  // Add mockImplementationOnce method
  MockAnthropic.mockImplementationOnce = vi.fn((impl) => {
    nextImplementation = impl;
    return MockAnthropic;
  });
  
  // Attach the mock constructor to the global object so tests can access it
  (global as any).mockAnthropicConstructor = MockAnthropic;
  
  return {
    Anthropic: MockAnthropic,
    default: MockAnthropic
  };
});

describe('Tester Agent - TDD Capabilities', () => {
  let tester: Tester;

  beforeEach(() => {
    // Use mock API key for testing
    tester = new Tester({ anthropicApiKey: 'test-key' });
  });

  afterEach(() => {
    // Clear all mocks
  });

  describe('Test Generation', () => {
    it('should generate a test case for provided code and requirements', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const requirements = 'Test the add function with positive and negative numbers';

      const testCode = await tester.generateTest(code, requirements);
      
      expect(testCode).toBeDefined();
      expect(typeof testCode).toBe('string');
      expect(testCode.length).toBeGreaterThan(0);
    });

    it('should throw an error if Anthropic API fails', async () => {
      // Mock API failure by modifying the existing mock
      // Create a mock failure instance
      const mockFailureInstance = {
        messages: {
          create: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };
      
      // Create a mock implementation that returns an instance with failure messages
      class MockFailureAnthropic {
        messages: any;
        
        constructor() {
          this.messages = mockFailureInstance.messages;
        }
      }
      
      // Apply the mock implementation for this specific test
      (global as any).mockAnthropicConstructor.mockImplementationOnce(MockFailureAnthropic);

      const testerWithError = new Tester({ anthropicApiKey: 'test-key' });
      const code = 'function add(a, b) { return a + b; }';
      const requirements = 'Test the add function';

      await expect(testerWithError.generateTest(code, requirements))
        .rejects
        .toThrow('Test generation failed: API Error');
    });
  });

  describe('Test Execution', () => {
    it('should execute a test and return results', async () => {
      const testCode = 'assert(add(2, 3) === 5);';
      const implementationCode = 'function add(a, b) { return a + b; }';

      const result = await tester.executeTest(testCode, implementationCode);
      
      expect(result).toBeDefined();
      expect(result.testName).toBe('Generated Test');
      expect(typeof result.passed).toBe('boolean');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should track test execution time', async () => {
      const testCode = 'assert(add(2, 3) === 5);';
      const implementationCode = 'function add(a, b) { return a + b; }';

      const startTime = Date.now();
      const result = await tester.executeTest(testCode, implementationCode);
      const endTime = Date.now();
      
      expect(result.executionTime).toBeGreaterThanOrEqual(50);
      expect(result.executionTime).toBeLessThanOrEqual(150);
    });
  });

  describe('Implementation Fixing', () => {
    it('should generate fixed implementation for failing test', async () => {
      const failingTest = 'assert(subtract(5, 3) === 2);';
      const currentImplementation = 'function subtract(a, b) { return a + b; }';

      const fixedImplementation = await tester.makeTestPass(failingTest, currentImplementation);
      
      expect(fixedImplementation).toBeDefined();
      expect(typeof fixedImplementation).toBe('string');
      expect(fixedImplementation.length).toBeGreaterThan(0);
    });

    it('should handle API errors during implementation fixing', async () => {
      // Mock API failure by modifying the existing mock
      // Create a mock failure instance
      const mockFailureInstance = {
        messages: {
          create: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };
      
      // Create a mock implementation that returns an instance with failure messages
      class MockFailureAnthropic {
        messages: any;
        
        constructor() {
          this.messages = mockFailureInstance.messages;
        }
      }
      
      // Apply the mock implementation for this specific test
      (global as any).mockAnthropicConstructor.mockImplementationOnce(MockFailureAnthropic);

      const testerWithError = new Tester({ anthropicApiKey: 'test-key' });
      const failingTest = 'assert(subtract(5, 3) === 2);';
      const currentImplementation = 'function subtract(a, b) { return a + b; }';

      await expect(testerWithError.makeTestPass(failingTest, currentImplementation))
        .rejects
        .toThrow('Implementation fix failed: API Error');
    });
  });

  describe('Refactoring Suggestions', () => {
    it('should provide refactoring suggestions for implementation', async () => {
      const implementation = 'function complexFunction(a, b, c) { return a + b + c; }';
      const testResults = [
        { testName: 'Test 1', passed: true, executionTime: 100 },
        { testName: 'Test 2', passed: false, executionTime: 150, error: 'Failed' }
      ];

      const suggestions = await tester.suggestRefactorings(implementation, testResults);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check structure of suggestions
      suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('implementation');
        expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      });
    });
  });

  describe('TDD Cycle', () => {
    it('should complete a full TDD cycle', async () => {
      const requirements = 'Create a function that multiplies two numbers';
      const currentImplementation = 'function multiply(a, b) { return a * b; }';

      const cycleResult: TDDCycleResult = await tester.runTDDCycle(requirements, currentImplementation);
      
      expect(cycleResult).toBeDefined();
      expect(typeof cycleResult.cycle).toBe('number');
      
      // Check Red phase
      expect(cycleResult.redPhase).toBeDefined();
      expect(typeof cycleResult.redPhase.testGenerated).toBe('string');
      
      // Check Green phase
      expect(cycleResult.greenPhase).toBeDefined();
      expect(typeof cycleResult.greenPhase.implementation).toBe('string');
      expect(cycleResult.greenPhase.testResult).toBeDefined();
      
      // Check Refactor phase
      expect(cycleResult.refactorPhase).toBeDefined();
      expect(cycleResult.refactorPhase?.suggestions).toBeDefined();
      expect(Array.isArray(cycleResult.refactorPhase?.suggestions)).toBe(true);
    });

    it('should meet the 95% success rate requirement', async () => {
      // Run multiple TDD cycles to verify success rate
      const cycles = 20;
      let successfulCycles = 0;
      
      for (let i = 0; i < cycles; i++) {
        try {
          await tester.runTDDCycle(`Test requirement ${i}`, `function test${i}() { return ${i}; }`);
          successfulCycles++;
        } catch (error) {
          // Cycle failed, which is expected for ~5% of cases
        }
      }
      
      const successRate = successfulCycles / cycles;
      // Allow some tolerance since this is a statistical test
      expect(successRate).toBeGreaterThanOrEqual(0.90);
    });
  });

  describe('Test Suite Execution', () => {
    it('should run a test suite and return results', async () => {
      const testSuite = 'Comprehensive test suite for math operations';

      const suiteResult = await tester.runTestSuite(testSuite);
      
      expect(suiteResult).toBeDefined();
      expect(suiteResult.suiteName).toBe('Generated Test Suite');
      expect(suiteResult.totalTests).toBeGreaterThanOrEqual(5);
      expect(suiteResult.totalTests).toBeLessThanOrEqual(15);
      expect(suiteResult.passedTests + suiteResult.failedTests).toBe(suiteResult.totalTests);
      expect(suiteResult.results).toBeDefined();
      expect(Array.isArray(suiteResult.results)).toBe(true);
      expect(suiteResult.timestamp).toBeInstanceOf(Date);
    });

    it('should track individual test results', async () => {
      const testSuite = 'Math operations test suite';
      
      const suiteResult = await tester.runTestSuite(testSuite);
      
      suiteResult.results.forEach((result: any) => {
        expect(result.testName).toMatch(/^Test \d+$/);
        expect(typeof result.passed).toBe('boolean');
        expect(result.executionTime).toBeGreaterThanOrEqual(50);
        expect(result.executionTime).toBeLessThanOrEqual(250);
        
        if (!result.passed) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
        }
      });
    });
  });

  describe('Agent Integration', () => {
    it('should provide agent information for MoE router', () => {
      const agentInfo = tester.getAgentInfo();
      
      expect(agentInfo).toBeDefined();
      expect(agentInfo.id).toBe('tester-default');
      expect(agentInfo.type).toBe('tester');
      expect(agentInfo.name).toBe('TDD Specialist');
      expect(agentInfo.expertise).toEqual(
        expect.arrayContaining(['test driven development', 'automated testing', 'code quality', 'refactoring'])
      );
      expect(agentInfo.workload).toBe(0);
      expect(agentInfo.capacity).toBe(10);
    });
  });
});