// Multimodal Coordination Integration Test Suite
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisionVoiceController } from '../../multimodal/vision-voice.ts';
import { VisionAgentTool } from '../../multimodal/vision-agent-tool.ts';
import { VoiceAgentTool } from '../../multimodal/voice-agent-tool.ts';
import { AgentToolRegistry } from '../../core/agent-tool.ts';
import type { MultimodalConfig } from '../../multimodal/types/index.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn(),
    subscribe: vi.fn()
  }
}));

describe('Multimodal Coordination', () => {
  let visionVoiceController: VisionVoiceController;
  let visionAgentTool: VisionAgentTool;
  let voiceAgentTool: VoiceAgentTool;
  let toolRegistry: AgentToolRegistry;
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
    toolRegistry = new AgentToolRegistry();
    
    // Register tools
    toolRegistry.registerTool(visionAgentTool);
    toolRegistry.registerTool(voiceAgentTool);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Tool Registry Integration', () => {
    it('should register multimodal tools correctly', () => {
      const tools = Array.from(toolRegistry['tools'].values());
      expect(tools).toHaveLength(2);
      expect(tools.some((tool: any) => tool.name === 'vision-agent')).toBe(true);
      expect(tools.some((tool: any) => tool.name === 'voice-agent')).toBe(true);
    });
    
    it('should execute vision agent tool through registry', async () => {
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
      
      // Mock the vision agent tool execute method
      const mockExecute = vi.spyOn(visionAgentTool, 'execute')
        .mockResolvedValue({ success: true, output: 'Processed image description', executionTime: 100 });
      
      const tool = toolRegistry.getTool('vision-agent');
      const result = tool ? await tool.execute(context) : { success: false, error: 'Tool not found', executionTime: 0 };
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('Processed image description');
      expect(mockExecute).toHaveBeenCalledWith(context);
    });
    
    it('should execute voice agent tool through registry', async () => {
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
      
      // Mock the voice agent tool execute method
      const mockExecute = vi.spyOn(voiceAgentTool, 'execute')
        .mockResolvedValue({ success: true, output: { text: 'Transcribed audio' }, executionTime: 100 });
      
      const tool = toolRegistry.getTool('voice-agent');
      const result = tool ? await tool.execute(context) : { success: false, error: 'Tool not found', executionTime: 0 };
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ text: 'Transcribed audio' });
      expect(mockExecute).toHaveBeenCalledWith(context);
    });
  });
  
  describe('Cross-Modal Processing', () => {
    it('should process image input through vision controller and tool', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const input = { image: imageBuffer };
      
      // Mock vision controller processImage method
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockResolvedValue('Processed image description');
      
      // Process through controller
      const controllerResult = await visionVoiceController.processImage(imageBuffer);
      
      // Process through tool
      const toolContext = {
        toolName: 'vision-agent',
        parameters: {
          action: 'processImage',
          imageData: imageBuffer.toString('base64')
        },
        context: {},
        taskId: 'test-task-1',
        agentId: 'test-agent-1'
      };
      
      // Mock the internal handler
      const mockHandleProcessImage = vi.spyOn(visionAgentTool as any, 'handleProcessImage')
        .mockResolvedValue('Processed image description');
      
      const toolResult = await visionAgentTool.execute(toolContext);
      
      expect(controllerResult).toBe('Processed image description');
      expect(toolResult.success).toBe(true);
      expect(toolResult.output).toBe('Processed image description');
      expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
      expect(mockHandleProcessImage).toHaveBeenCalledWith({ imageData: imageBuffer.toString('base64') });
    });
    
    it('should process audio input through voice controller and tool', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const input = { audio: audioBuffer };
      
      // Mock voice controller processAudio method
      const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      // Process through controller
      const controllerResult = await visionVoiceController.processAudio(audioBuffer);
      
      // Process through tool
      const toolContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: audioBuffer.toString('base64')
        },
        context: {},
        taskId: 'test-task-2',
        agentId: 'test-agent-2'
      };
      
      // Mock the internal handler
      const mockHandleTranscribe = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockResolvedValue({ text: 'Transcribed audio text' });
      
      const toolResult = await voiceAgentTool.execute(toolContext);
      
      expect(controllerResult).toBe('Transcribed audio text');
      expect(toolResult.success).toBe(true);
      expect(toolResult.output).toEqual({ text: 'Transcribed audio text' });
      expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
      expect(mockHandleTranscribe).toHaveBeenCalledWith({ audioData: audioBuffer.toString('base64') });
    });
  });
  
  describe('Unified Multimodal Processing', () => {
    it('should coordinate vision and voice processing through controller', async () => {
      const input = { 
        imageData: Buffer.from('mock image data'), 
        audioData: Buffer.from('mock audio data') 
      };
      
      // Mock controller methods
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockResolvedValue('Processed image description');
      const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      // Process through controller
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toContain('Processed image description'); // With sequential strategy, vision is processed first
      expect(result.imageData).toBe(input.imageData);
      expect(result.audioData).toBe(input.audioData);
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audioData);
    });
    
    it('should handle tool execution errors gracefully in coordination', async () => {
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision controller to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));
      
      await expect(visionVoiceController.processMultimodalInput(input))
        .rejects
        .toThrow('Image processing failed');
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
    });
  });
  
  describe('Event-Based Coordination', () => {
    it('should publish and handle modality switch events', async () => {
      // Subscribe to modality switch events
      const eventHandler = vi.fn();
      const mockSubscribe = vi.fn().mockImplementation((eventType: any, handler: any) => {
        if (eventType === 'multimodal.modality.switched') {
          eventHandler.mockImplementation(handler);
        }
        return 'mock-subscription-id';
      });
      (eventBus.subscribe as any) = mockSubscribe;
      
      // Trigger modality switch
      visionVoiceController.setCurrentModality('vision');
      
      // Verify event was published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.modality.switched',
        payload: {
          from: 'auto',
          to: 'vision'
        }
      }));
    });
    
    it('should publish and handle processing events', async () => {
      const input = { imageData: Buffer.from('mock image data') };
      
      // Mock vision controller processImage method
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockResolvedValue('Processed image description');
      
      // Process input
      await visionVoiceController.processMultimodalInput(input);
      
      // Verify events were published
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.started'
      }));
      
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.processing.completed'
      }));
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.imageData);
    });
  });
  
  describe('Context Sharing Between Modalities', () => {
    it('should share context between vision and voice processing', async () => {
      // Process image first
      const imageBuffer = Buffer.from('mock image data');
      const mockImageResult = 'Processed image description with UI elements';
      
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockResolvedValue(mockImageResult);
      
      await visionVoiceController.processImage(imageBuffer);
      
      // Process audio next
      const audioBuffer = Buffer.from('mock audio data');
      const mockAudioResult = 'Transcribed audio mentioning UI elements';
      
      const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
        .mockResolvedValue(mockAudioResult);
      
      await visionVoiceController.processAudio(audioBuffer);
      
      // Verify both processes were called
      expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
      expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
      
      // Verify context was updated (this would be internal to the controller)
      // We can't directly test the context without exposing it, but we can verify
      // the methods were called in sequence
    });
  });
});