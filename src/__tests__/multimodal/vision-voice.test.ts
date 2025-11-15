// Vision-Voice Controller Test Suite
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisionVoiceController } from '../../multimodal/vision-voice.ts';
import { MultimodalConfig } from '../../multimodal/types/index.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn()
  }
}));

describe('Vision-Voice Controller', () => {
  let visionVoiceController: VisionVoiceController;
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
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Modality Management', () => {
    it('should set and get current modality', () => {
      expect(visionVoiceController.getCurrentModality()).toBe('auto');
      
      visionVoiceController.setCurrentModality('vision');
      expect(visionVoiceController.getCurrentModality()).toBe('vision');
      
      visionVoiceController.setCurrentModality('voice');
      expect(visionVoiceController.getCurrentModality()).toBe('voice');
      
      // Verify event publishing
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.modality.switched',
        payload: {
          from: 'auto',
          to: 'vision'
        }
      }));
    });
    
    it('should set and get modality priority', () => {
      expect(visionVoiceController.getModalityPriority()).toEqual(['vision', 'voice']);
      
      visionVoiceController.setModalityPriority(['voice', 'vision']);
      expect(visionVoiceController.getModalityPriority()).toEqual(['voice', 'vision']);
      
      // Verify event publishing
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.modality.priority.updated',
        payload: {
          priority: ['voice', 'vision']
        }
      }));
    });
  });
  
  describe('Processing Order Determination', () => {
    it('should use current modality when explicitly set', () => {
      visionVoiceController.setCurrentModality('vision');
      const input = { image: Buffer.from('image'), audio: Buffer.from('audio') };
      const order = (visionVoiceController as any).getProcessingOrder(input);
      expect(order).toEqual(['vision']);
      
      visionVoiceController.setCurrentModality('voice');
      const order2 = (visionVoiceController as any).getProcessingOrder(input);
      expect(order2).toEqual(['voice']);
    });
    
    it('should use priority order when in auto mode with image input', () => {
      visionVoiceController.setCurrentModality('auto');
      const input = { image: Buffer.from('image') };
      const order = (visionVoiceController as any).getProcessingOrder(input);
      expect(order).toEqual(['vision']);
    });
    
    it('should use priority order when in auto mode with audio input', () => {
      visionVoiceController.setCurrentModality('auto');
      const input = { audio: Buffer.from('audio') };
      const order = (visionVoiceController as any).getProcessingOrder(input);
      expect(order).toEqual(['voice']);
    });
    
    it('should use priority order when in auto mode with both inputs', () => {
      visionVoiceController.setCurrentModality('auto');
      const input = { image: Buffer.from('image'), audio: Buffer.from('audio') };
      const order = (visionVoiceController as any).getProcessingOrder(input);
      expect(order).toEqual(['vision', 'voice']);
    });
  });
  
  describe('Multimodal Input Processing', () => {
    it('should process image input successfully', async () => {
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision agent processImage method
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockResolvedValue('Processed image description');
      
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toBe('Processed image description');
      expect(result.imageData).toBe(input.imageData);
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      
      // Verify event publishing
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.started'
      }));
      
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.completed'
      }));
    });
    
    it('should process audio input successfully', async () => {
      const input = { audioData: Buffer.from('mock audio data') };
      
      // Mock voice agent processAudio method
      const mockProcessAudio = vi.spyOn(visionVoiceController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toBe('Transcribed audio text');
      expect(result.audioData).toBe(input.audioData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
    });
    
    it('should process both image and audio inputs with parallel strategy', async () => {
      config.fallbackStrategy = 'parallel';
      visionVoiceController = new VisionVoiceController(config);
      
      const input = { imageData: Buffer.from('mock image data'), audioData: Buffer.from('mock audio data') };
      
      // Mock both agents
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockResolvedValue('Processed image description');
      const mockProcessAudio = vi.spyOn(visionVoiceController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toContain('[VISION] Processed image description');
      expect(result.text).toContain('[AUDIO] Transcribed audio text');
      expect(result.imageData).toBe(input.imageData);
      expect(result.audioData).toBe(input.audioData);
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
    });
    
    it('should handle processing errors gracefully', async () => {
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision agent to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));
      
      await expect(visionVoiceController.processMultimodalInput(input))
        .rejects
        .toThrow('Image processing failed');
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      
      // Verify error event publishing
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.error'
      }));
    });
    
    it('should handle fallback when first modality fails with sequential strategy', async () => {
      config.fallbackStrategy = 'sequential';
      visionVoiceController = new VisionVoiceController(config);
      
      const input = { imageData: Buffer.from('mock image data'), audioData: Buffer.from('mock audio data') };
      
      // Mock vision agent to throw an error and voice agent to succeed
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));
      const mockProcessAudio = vi.spyOn(visionVoiceController as any, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toBe('Transcribed audio text');
      expect(result.audioData).toBe(input.audioData);
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
    });
    
    it('should return fallback message when all modalities fail', async () => {
      config.fallbackStrategy = 'sequential';
      visionVoiceController = new VisionVoiceController(config);
      
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision agent to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));
      
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toBe('No input processed successfully');
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      
      // Verify fallback event publishing
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.fallback'
      }));
    });
  });
  
  describe('Context Management', () => {
    it('should update and retrieve context', () => {
      // Update context for vision modality
      (visionVoiceController as any).updateContext('vision', { lastImage: 'image1', lastVisionOutput: 'desc1' });
      
      // Retrieve context for vision modality
      const visionContext = (visionVoiceController as any).getContext('vision');
      expect(visionContext).toEqual({ lastImage: 'image1', lastVisionOutput: 'desc1' });
      
      // Update context for voice modality
      (visionVoiceController as any).updateContext('voice', { lastAudio: 'audio1', lastVoiceOutput: 'text1' });
      
      // Retrieve all context
      const allContext = (visionVoiceController as any).getContext();
      expect(allContext.vision).toEqual({ lastImage: 'image1', lastVisionOutput: 'desc1' });
      expect(allContext.voice).toEqual({ lastAudio: 'audio1', lastVoiceOutput: 'text1' });
      expect(allContext.global).toEqual({ lastImage: 'image1', lastVisionOutput: 'desc1', lastAudio: 'audio1', lastVoiceOutput: 'text1' });
    });
    
    it('should preserve context when switching modalities', () => {
      // Set some context
      (visionVoiceController as any).updateContext('vision', { lastImage: 'image1', lastVisionOutput: 'desc1' });
      
      // Switch modality
      visionVoiceController.setCurrentModality('voice');
      
      // Verify context preservation event
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.context.preserved'
      }));
    });
  });
  
  // Test individual vision agent methods delegation
  describe('Vision Agent Method Delegation', () => {
    it('should delegate processImage to vision agent', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const mockResult = 'Processed image description';
      
      const mockProcessImage = vi.spyOn(visionVoiceController as any, 'processImage')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.processImage(imageBuffer);
      
      expect(result).toBe(mockResult);
      expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
    });
    
    it('should delegate generateImage to vision agent', async () => {
      const description = 'A red circle';
      const mockResult = Buffer.from('generated image data');
      
      const mockGenerateImage = vi.spyOn(visionVoiceController as any, 'generateImage')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.generateImage(description);
      
      expect(result).toBe(mockResult);
      expect(mockGenerateImage).toHaveBeenCalledWith(description);
    });
    
    it('should delegate analyzeScreenshot to vision agent', async () => {
      const screenshotBuffer = Buffer.from('mock screenshot data');
      const mockResult = { description: 'UI screenshot' };
      
      const mockAnalyzeScreenshot = vi.spyOn(visionVoiceController as any, 'analyzeScreenshot')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.analyzeScreenshot(screenshotBuffer);
      
      expect(result).toEqual(mockResult);
      expect(mockAnalyzeScreenshot).toHaveBeenCalledWith(screenshotBuffer);
    });
    
    it('should delegate recognizeUIElements to vision agent', async () => {
      const imageBuffer = Buffer.from('mock ui image data');
      const mockResult = [{ type: 'button', label: 'Submit' }];
      
      const mockRecognizeUIElements = vi.spyOn(visionVoiceController as any, 'recognizeUIElements')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.recognizeUIElements(imageBuffer);
      
      expect(result).toEqual(mockResult);
      expect(mockRecognizeUIElements).toHaveBeenCalledWith(imageBuffer);
    });
    
    it('should delegate generateCodeFromDesign to vision agent', async () => {
      const imageBuffer = Buffer.from('mock design image data');
      const framework = 'react';
      const mockResult = '<div>Generated code</div>';
      
      const mockGenerateCodeFromDesign = vi.spyOn(visionVoiceController as any, 'generateCodeFromDesign')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.generateCodeFromDesign(imageBuffer, framework);
      
      expect(result).toBe(mockResult);
      expect(mockGenerateCodeFromDesign).toHaveBeenCalledWith(imageBuffer, framework);
    });
  });
  
  // Test individual voice agent methods delegation
  describe('Voice Agent Method Delegation', () => {
    it('should delegate processAudio to voice agent', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const mockResult = 'Transcribed text';
      
      const mockProcessAudio = vi.spyOn(visionVoiceController as any, 'processAudio')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.processAudio(audioBuffer);
      
      expect(result).toBe(mockResult);
      expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
    });
    
    it('should delegate generateAudio to voice agent', async () => {
      const text = 'Hello world';
      const mockResult = Buffer.from('generated audio data');
      
      const mockGenerateAudio = vi.spyOn(visionVoiceController as any, 'generateAudio')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.generateAudio(text);
      
      expect(result).toBe(mockResult);
      expect(mockGenerateAudio).toHaveBeenCalledWith(text);
    });
    
    it('should delegate askQuestion to voice agent', async () => {
      const question = 'What is the weather?';
      const mockResult = 'It is sunny today';
      
      const mockAskQuestion = vi.spyOn(visionVoiceController as any, 'askQuestion')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.askQuestion(question);
      
      expect(result).toBe(mockResult);
      expect(mockAskQuestion).toHaveBeenCalledWith(question);
    });
    
    it('should delegate executeVoiceCommand to voice agent', async () => {
      const command = 'Hello';
      const mockResult = { response: 'Hi there!' };
      
      const mockExecuteVoiceCommand = vi.spyOn(visionVoiceController as any, 'executeVoiceCommand')
        .mockResolvedValue(mockResult);
      
      const result = await visionVoiceController.executeVoiceCommand(command);
      
      expect(result).toEqual(mockResult);
      expect(mockExecuteVoiceCommand).toHaveBeenCalledWith(command);
    });
  });
});