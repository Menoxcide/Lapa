import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FallbackStrategiesManager } from '../../validation/fallback-strategies.ts';
import { LAPAEventBus } from '../../core/event-bus.ts';
import { AgentTool } from '../../core/types/agent-types.ts';

describe('FallbackStrategiesManager', () => {
  let fallbackStrategiesManager: FallbackStrategiesManager;
  let eventBus: LAPAEventBus;

  beforeEach(() => {
    eventBus = new LAPAEventBus();
    fallbackStrategiesManager = new FallbackStrategiesManager(eventBus);
  });

  describe('registerFallbackProvider', () => {
    it('should register a fallback provider', () => {
      const provider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: async (operation: string, params: any) => ({ success: true, result: 'test result' })
      };

      const publishSpy = vi.spyOn(eventBus, 'publish');

      fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'fallback.provider.registered',
        payload: expect.objectContaining({
          name: 'test-provider'
        })
      }));
      
      // Verify provider is registered by checking if it can handle operations
      const providers = fallbackStrategiesManager.getRegisteredProviders();
      expect(providers).toContain('test-provider');
    });
  });

  describe('executeWithFallback', () => {
    it('should execute primary operation successfully', async () => {
      const primaryExecutor = vi.fn().mockResolvedValue('primary result');
      const params = { testParam: 'value' };

      const result = await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
      
      expect(result).toBe('primary result');
      expect(primaryExecutor).toHaveBeenCalledTimes(1);
    });

    it('should execute fallback when primary operation fails', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that can handle the operation
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      const result = await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
      
      expect(result).toBe('fallback result');
      expect(primaryExecutor).toHaveBeenCalledTimes(1);
      expect(fallbackProvider.execute).toHaveBeenCalledWith('test-operation', params);
    });

    it('should fail when both primary and fallback fail', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that also fails
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: vi.fn().mockResolvedValue({ success: false, error: 'Fallback failed' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      await expect(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
        .rejects
        .toThrow(/Both primary execution and fallback failed/);
      
      expect(primaryExecutor).toHaveBeenCalledTimes(1);
      expect(fallbackProvider.execute).toHaveBeenCalledWith('test-operation', params);
    });

    it('should fail when no suitable fallback provider is found', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that cannot handle the operation
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'different-operation',
        execute: vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      await expect(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
        .rejects
        .toThrow(/Operation test-operation failed and no suitable fallback provider found/);
      
      expect(primaryExecutor).toHaveBeenCalledTimes(1);
      expect(fallbackProvider.execute).not.toHaveBeenCalled();
    });

    it('should publish events for successful primary execution', async () => {
      const primaryExecutor = vi.fn().mockResolvedValue('primary result');
      const params = { testParam: 'value' };

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'operation.executed',
        payload: expect.objectContaining({
          operation: 'test-operation',
          strategy: 'primary',
          result: 'primary result'
        })
      }));
    });

    it('should publish events for fallback initiation and success', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that can handle the operation
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params);
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'operation.fallback.initiated',
        payload: expect.objectContaining({
          operation: 'test-operation',
          provider: 'test-fallback',
          primaryError: 'Primary failed'
        })
      }));
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'operation.fallback.succeeded',
        payload: expect.objectContaining({
          operation: 'test-operation',
          provider: 'test-fallback',
          result: 'fallback result'
        })
      }));
    });

    it('should publish events for fallback failure', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that also fails
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: vi.fn().mockResolvedValue({ success: false, error: 'Fallback failed' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await expect(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
        .rejects
        .toThrow();
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'operation.fallback.failed',
        payload: expect.objectContaining({
          operation: 'test-operation',
          provider: 'test-fallback',
          primaryError: 'Primary failed',
          fallbackError: 'Fallback failed'
        })
      }));
    });

    it('should publish events for permanent failure when no fallback available', async () => {
      const primaryExecutor = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const params = { testParam: 'value' };
      
      // Register a fallback provider that cannot handle the operation
      const fallbackProvider = {
        canHandle: (operation: string) => operation === 'different-operation',
        execute: vi.fn().mockResolvedValue({ success: true, result: 'fallback result' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-fallback', fallbackProvider);

      const publishSpy = vi.spyOn(eventBus, 'publish');

      await expect(fallbackStrategiesManager.executeWithFallback('test-operation', primaryExecutor, params))
        .rejects
        .toThrow();
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'operation.failed.permanently',
        payload: expect.objectContaining({
          operation: 'test-operation',
          error: 'Primary failed'
        })
      }));
    });
  });

  describe('gracefulDegradationForTool', () => {
    it('should perform graceful degradation for tool execution', async () => {
      const mockTool: AgentTool = {
        name: 'test-tool',
        type: 'testing',
        description: 'Test tool',
        version: '1.0.0',
        execute: vi.fn(),
        validateParameters: vi.fn()
      };
      
      const context = { testParam: 'value' };

      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = await fallbackStrategiesManager.gracefulDegradationForTool(mockTool, context);
      
      expect(result).toEqual({
        success: true,
        result: 'Degraded result for test-tool',
        degraded: true
      });
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tool.degraded',
        payload: expect.objectContaining({
          toolName: 'test-tool',
          contextKeys: ['testParam']
        })
      }));
    });
  });

  describe('gracefulDegradationForModeSwitch', () => {
    it('should perform graceful degradation for mode switching', async () => {
      const fromMode = 'ask';
      const toMode = 'code';

      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = await fallbackStrategiesManager.gracefulDegradationForModeSwitch(fromMode, toMode);
      
      expect(result).toEqual({
        success: true,
        result: 'Degraded mode switch from ask to code',
        degraded: true
      });
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'mode.degraded',
        payload: expect.objectContaining({
          fromMode: 'ask',
          toMode: 'code'
        })
      }));
    });
  });

  describe('removeFallbackProvider', () => {
    it('should remove a fallback provider', () => {
      const provider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: async (operation: string, params: any) => ({ success: true, result: 'test result' })
      };

      fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
      
      // Verify provider is registered
      let providers = fallbackStrategiesManager.getRegisteredProviders();
      expect(providers).toContain('test-provider');
      
      const publishSpy = vi.spyOn(eventBus, 'publish');

      fallbackStrategiesManager.removeFallbackProvider('test-provider');
      
      expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'fallback.provider.removed',
        payload: expect.objectContaining({
          name: 'test-provider'
        })
      }));
      
      // Verify provider is removed
      providers = fallbackStrategiesManager.getRegisteredProviders();
      expect(providers).not.toContain('test-provider');
    });
  });

  describe('getRegisteredProviders', () => {
    it('should return list of registered fallback providers', () => {
      // Initially should have default providers
      let providers = fallbackStrategiesManager.getRegisteredProviders();
      expect(providers).toContain('agent-tool-local');
      expect(providers).toContain('handoff-simplified');
      expect(providers).toContain('mode-switch-cache');
      
      // Register additional provider
      const provider = {
        canHandle: (operation: string) => operation === 'test-operation',
        execute: async (operation: string, params: any) => ({ success: true, result: 'test result' })
      };
      
      fallbackStrategiesManager.registerFallbackProvider('test-provider', provider);
      
      providers = fallbackStrategiesManager.getRegisteredProviders();
      expect(providers).toContain('test-provider');
    });
  });
});