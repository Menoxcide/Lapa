import { HybridHandoffSystem } from '../../src/orchestrator/handoffs';
import { Agent } from '@openai/agents';

// Mock the OpenAI agents SDK
jest.mock('@openai/agents', () => {
  return {
    run: jest.fn()
  };
});

// Import the mocked run function
import { run } from '@openai/agents';

describe('OpenAI Handoff Performance', () => {
  let handoffSystem: HybridHandoffSystem;
  let mockOpenAIAgent: Agent;

  beforeEach(() => {
    handoffSystem = new HybridHandoffSystem();
    mockOpenAIAgent = {
      id: 'openai-agent-1',
      name: 'Test OpenAI Agent',
      instructions: 'Test instructions',
      tools: [],
      model: 'gpt-4'
    } as Agent;
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Latency Validation', () => {
    it('should complete OpenAI handoff within 2s target for simple tasks', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock a quick response
      const mockRunResult = {
        finalOutput: { result: 'Quick task completed by OpenAI' }
      };
      
      (run as jest.Mock).mockResolvedValue(mockRunResult);
      
      const startTime = performance.now();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'simple context data for OpenAI' }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete well within the 2s target
      expect(duration).toBeLessThan(2000);
    }, 10000); // 10 second timeout for the test

    it('should maintain <2s latency under moderate OpenAI API load', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock responses with slight delays to simulate API latency
      (run as jest.Mock).mockImplementation(async () => {
        // Simulate typical OpenAI API response time
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
          finalOutput: { result: 'Task completed under moderate OpenAI load' }
        };
      });
      
      const startTime = performance.now();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'moderate context data for OpenAI' }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should stay under 2s even with API latency
      expect(duration).toBeLessThan(2000);
    }, 10000);

    it('should track OpenAI handoff duration accurately', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock a response with known delay
      (run as jest.Mock).mockImplementation(async () => {
        // Simulate a specific delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          finalOutput: { result: 'OpenAI task completed' }
        };
      });
      
      // Spy on console.log to capture timing messages
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'timed context data for OpenAI' }
      );
      
      // Check that timing information was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Handoff from .* to .* completed in .*ms/)
      );
      
      // Verify warning when latency target is exceeded
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Configure a very short latency target for testing
      handoffSystem.updateConfig({ latencyTargetMs: 100 });
      
      await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'task-456',
        { testData: 'slow context data for OpenAI' }
      );
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handoff latency target exceeded')
      );
      
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    }, 10000);

    it('should meet latency target for batch OpenAI handoffs', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock quick responses for batch processing
      (run as jest.Mock).mockResolvedValue({
        finalOutput: { result: 'Batch task completed by OpenAI' }
      });
      
      // Test with 3 concurrent handoffs (smaller batch for unit test)
      const handoffPromises = [];
      const handoffCount = 3;
      
      const startTime = performance.now();
      
      for (let i = 0; i < handoffCount; i++) {
        handoffPromises.push(
          (handoffSystem as any).initiateHandoff(
            `source-agent-${i}`,
            'Test OpenAI Agent',
            `task-${i}`,
            { testData: `batch context data ${i} for OpenAI` }
          )
        );
      }
      
      // Wait for all handoffs to complete
      const results = await Promise.all(handoffPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all handoffs completed
      expect(results).toHaveLength(handoffCount);
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(3000); // 3 seconds for 3 concurrent handoffs
      
      // Verify all calls were made
      expect(run).toHaveBeenCalledTimes(handoffCount);
    }, 15000); // 15 second timeout for concurrent test
  });

  describe('High-Load Performance', () => {
    it('should handle burst of OpenAI handoffs without significant latency degradation', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock responses with realistic delays
      (run as jest.Mock).mockImplementation(async () => {
        // Simulate variable API response times
        const delay = 50 + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        return {
          finalOutput: { result: 'Burst task completed by OpenAI' }
        };
      });
      
      // Create burst of handoffs
      const burstSize = 8;
      const handoffPromises = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < burstSize; i++) {
        handoffPromises.push(
          (handoffSystem as any).initiateHandoff(
            `source-agent-${i}`,
            'Test OpenAI Agent',
            `burst-task-${i}`,
            { testData: `burst context data ${i} for OpenAI` }
          )
        );
      }
      
      // Wait for all handoffs to complete
      const results = await Promise.all(handoffPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all handoffs completed
      expect(results).toHaveLength(burstSize);
      
      // Average time per handoff should remain reasonable
      const averageTime = totalTime / burstSize;
      expect(averageTime).toBeLessThan(500); // Average < 500ms per handoff
      
      // Total time should be reasonable for burst processing
      expect(totalTime).toBeLessThan(8000); // 8 seconds for 8 concurrent handoffs
      
      // Verify all calls were made
      expect(run).toHaveBeenCalledTimes(burstSize);
    }, 20000); // 20 second timeout for burst test

    it('should maintain consistent performance with varying payload sizes', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock quick responses
      (run as jest.Mock).mockResolvedValue({
        finalOutput: { result: 'Variable payload task completed by OpenAI' }
      });
      
      // Test with different context sizes
      const testCases = [
        { size: 'small', context: { data: 'small payload' } },
        { size: 'medium', context: { data: 'a'.repeat(1000) } },
        { size: 'large', context: { data: 'b'.repeat(10000) } }
      ];
      
      for (const testCase of testCases) {
        const startTime = performance.now();
        
        await (handoffSystem as any).initiateHandoff(
          'source-agent-123',
          'Test OpenAI Agent',
          `payload-test-${testCase.size}`,
          testCase.context
        );
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // All should complete within 2s regardless of payload size
        expect(duration).toBeLessThan(2000);
      }
      
      // Should have made 3 calls total
      expect(run).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('Performance Edge Cases', () => {
    it('should handle OpenAI handoff with retry delays within acceptable timeframe', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Configure retry settings for test
      (handoffSystem as any).retryConfig = {
        maxRetries: 2,
        retryDelayMs: 100,
        exponentialBackoff: true
      };
      
      // Mock first attempt failing, second succeeding
      (run as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary OpenAI API error'))
        .mockResolvedValueOnce({
          finalOutput: { result: 'Task completed after retry' }
        });
      
      const startTime = performance.now();
      
      const result = await (handoffSystem as any).initiateHandoff(
        'source-agent-123',
        'Test OpenAI Agent',
        'retry-task-456',
        { testData: 'context data with retry' }
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result.result).toBe('Task completed after retry');
      // Should still complete within 2s even with retry delays
      expect(duration).toBeLessThan(2000);
      // Should have retried once
      expect(run).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should gracefully handle timeout scenarios while maintaining system stability', async () => {
      handoffSystem.registerOpenAIAgent(mockOpenAIAgent);
      
      // Mock a slow response that exceeds reasonable limits
      (run as jest.Mock).mockImplementation(async () => {
        // Simulate a slow response (but not so slow that it times out the test)
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          finalOutput: { result: 'Slow task completed by OpenAI' }
        };
      });
      
      // Test multiple slow handoffs concurrently
      const slowHandoffPromises = [];
      const handoffCount = 4;
      
      const startTime = performance.now();
      
      for (let i = 0; i < handoffCount; i++) {
        slowHandoffPromises.push(
          (handoffSystem as any).initiateHandoff(
            `slow-source-${i}`,
            'Test OpenAI Agent',
            `slow-task-${i}`,
            { testData: `slow context data ${i} for OpenAI` }
          )
        );
      }
      
      // Wait for all slow handoffs to complete
      const results = await Promise.all(slowHandoffPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all handoffs completed
      expect(results).toHaveLength(handoffCount);
      
      // Total time should be reasonable even for slow concurrent operations
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 4 concurrent slow handoffs
      
      // Verify all calls were made
      expect(run).toHaveBeenCalledTimes(handoffCount);
    }, 15000);
  });
});