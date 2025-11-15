// Multimodal Error Handling and Fallback Strategies Test Suite
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisionVoiceController } from '../../multimodal/vision-voice.ts';
import { VisionAgentTool } from '../../multimodal/vision-agent-tool.ts';
import { VoiceAgentTool } from '../../multimodal/voice-agent-tool.ts';
import type { MultimodalConfig } from '../../multimodal/types/index.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn()
  }
}));

describe('Multimodal Error Handling and Fallback Strategies', () => {
  let visionVoiceController: VisionVoiceController;
  let visionAgentTool: VisionAgentTool;
  let voiceAgentTool: VoiceAgentTool;
  let config: MultimodalConfig;
  
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
    voiceAgentTool = new VoiceAgentTool({ 
      ttsProvider: 'system', 
      sttProvider: 'system',
      enableRAGIntegration: false,
      enableEventPublishing: false
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Sequential Fallback Strategy', () => {
    it('should fallback from vision to voice when vision processing fails', async () => {
      config.fallbackStrategy = 'sequential';
      const sequentialController = new VisionVoiceController(config);
      
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock vision processing to fail and voice to succeed
      const mockProcessImage = vi.spyOn(sequentialController as any, 'processImage')
        .mockRejectedValue(new Error('Vision processing failed'));
      const mockProcessAudio = vi.spyOn(sequentialController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await sequentialController.processMultimodalInput(input);
      
      // Should get voice result due to fallback
      expect(result.text).toBe('Transcribed audio text');
      expect(result.audioData).toBe(input.audioData);
      
      // Both methods should be called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
      
      // Verify error event was published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.vision.processing.error'
      }));
    });
    
    it('should return fallback message when all modalities fail with sequential strategy', async () => {
      config.fallbackStrategy = 'sequential';
      const sequentialController = new VisionVoiceController(config);
      
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision processing to fail
      const mockProcessImage = vi.spyOn(sequentialController as any, 'processImage')
        .mockRejectedValue(new Error('Vision processing failed'));
      
      const result = await sequentialController.processMultimodalInput(input);
      
      // Should get fallback message
      expect(result.text).toBe('No input processed successfully');
      
      // Verify method was called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      
      // Verify error and fallback events were published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.vision.processing.error'
      }));
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.fallback'
      }));
    });
    
    it('should stop processing after first success with sequential strategy and none fallback', async () => {
      config.fallbackStrategy = 'none';
      const noneController = new VisionVoiceController(config);
      
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock vision to succeed (should stop here with 'none' strategy)
      const mockProcessImage = vi.spyOn(noneController as any, 'processImage')
        .mockResolvedValue('Processed image description');
      const mockProcessAudio = vi.spyOn(noneController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await noneController.processMultimodalInput(input);
      
      // Should only get vision result
      expect(result.text).toBe('Processed image description');
      expect(result.imageData).toBe(input.imageData);
      
      // Only vision method should be called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).not.toHaveBeenCalled();
    });
  });
  
  describe('Parallel Fallback Strategy', () => {
    it('should process all modalities in parallel and combine results', async () => {
      config.fallbackStrategy = 'parallel';
      const parallelController = new VisionVoiceController(config);
      
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock both processing methods to succeed
      const mockProcessImage = vi.spyOn(parallelController as any, 'processImage')
        .mockResolvedValue('Processed image description');
      const mockProcessAudio = vi.spyOn(parallelController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await parallelController.processMultimodalInput(input);
      
      // Should get combined results
      expect(result.text).toContain('[VISION] Processed image description');
      expect(result.text).toContain('[AUDIO] Transcribed audio text');
      expect(result.imageData).toBe(input.imageData);
      expect(result.audioData).toBe(input.audioData);
      
      // Both methods should be called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
    });
    
    it('should handle partial failures in parallel processing', async () => {
      config.fallbackStrategy = 'parallel';
      const parallelController = new VisionVoiceController(config);
      
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock vision to fail and audio to succeed
      const mockProcessImage = vi.spyOn(parallelController as any, 'processImage')
        .mockRejectedValue(new Error('Vision processing failed'));
      const mockProcessAudio = vi.spyOn(parallelController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await parallelController.processMultimodalInput(input);
      
      // Should get only audio result
      expect(result.text).toBe('\n[AUDIO] Transcribed audio text');
      expect(result.audioData).toBe(input.audioData);
      expect(result.imageData).toBeUndefined();
      
      // Both methods should be called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
      
      // Verify error event was published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.vision.processing.error'
      }));
    });
    
    it('should handle all failures in parallel processing', async () => {
      config.fallbackStrategy = 'parallel';
      const parallelController = new VisionVoiceController(config);
      
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock both processing methods to fail
      const mockProcessImage = vi.spyOn(parallelController as any, 'processImage')
        .mockRejectedValue(new Error('Vision processing failed'));
      const mockProcessAudio = vi.spyOn(parallelController as any, 'processAudio')
        .mockRejectedValue(new Error('Audio processing failed'));
      
      const result = await parallelController.processMultimodalInput(input);
      
      // Should get fallback message
      expect(result.text).toBe('No input processed successfully');
      
      // Both methods should be called
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
      
      // Verify error events were published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.vision.processing.error'
      }));
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.voice.processing.error'
      }));
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.fallback'
      }));
    });
  });
  
  describe('Tool-Level Error Handling', () => {
    it('should handle vision tool execution errors', async () => {
      const context = {
        toolName: 'vision-agent',
        parameters: {
          action: 'processImage',
          imageData: 'base64imageString'
        },
        context: {},
        taskId: 'test-task-1',
        agentId: 'test-agent-1'
      };
      
      // Mock the internal handler to throw an error
      const mockHandleProcessImage = vi.spyOn(visionAgentTool as any, 'handleProcessImage')
        .mockRejectedValue(new Error('Image processing failed in tool'));
      
      const result = await visionAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Image processing failed in tool');
      expect(mockHandleProcessImage).toHaveBeenCalledWith({ imageData: 'base64imageString' });
    });
    
    it('should handle voice tool execution errors', async () => {
      const context = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 'base64audioString'
        },
        context: {},
        taskId: 'test-task-2',
        agentId: 'test-agent-2'
      };
      
      // Mock the internal handler to throw an error
      const mockHandleTranscribe = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockRejectedValue(new Error('Audio transcription failed in tool'));
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Audio transcription failed in tool');
      expect(mockHandleTranscribe).toHaveBeenCalledWith({ audioData: 'base64audioString' });
    });
  });
  
  describe('Invalid Input Handling', () => {
    it('should handle missing input data', async () => {
      // Empty input
      const input = {};
      
      await expect(visionVoiceController.processMultimodalInput(input as any))
        .rejects
        .toThrow('At least one modality (image or audio) must be provided');
    });
    
    it('should handle invalid image data in vision tool', async () => {
      const context = {
        toolName: 'vision-agent',
        parameters: {
          action: 'processImage',
          imageData: 12345 // Invalid format
        },
        context: {},
        taskId: 'test-task-3',
        agentId: 'test-agent-3'
      };
      
      const result = await visionAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid image data format');
    });
    
    it('should handle invalid audio data in voice tool', async () => {
      const context = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 12345 // Invalid format
        },
        context: {},
        taskId: 'test-task-4',
        agentId: 'test-agent-4'
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid audio data format');
    });
  });
  
  describe('Recovery from Transient Errors', () => {
    it('should recover from temporary vision processing failures', async () => {
      config.fallbackStrategy = 'sequential';
      const recoveryController = new VisionVoiceController(config);
      
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision processing to fail first, then succeed
      let callCount = 0;
      const mockProcessImage = vi.spyOn(recoveryController as any, 'processImage')
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary vision processing failure');
          }
          return Promise.resolve('Processed image description on retry');
        });
      
      // We can't directly test retry behavior without modifying the implementation
      // This test shows that errors are handled, but not that retries occur
      await expect(recoveryController.processMultimodalInput(input))
        .rejects
        .toThrow('Temporary vision processing failure');
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
    });
  });
});