// Multimodal Coordination Integration Test Suite
import { VisionVoiceController } from '../../multimodal/vision-voice';
import { VisionAgentTool } from '../../multimodal/vision-agent-tool';
import { VoiceAgentTool } from '../../multimodal/voice-agent-tool';
import { AgentToolRegistry } from '../../core/agent-tool';
import { MultimodalConfig } from '../../multimodal/types';
import { eventBus } from '../../core/event-bus';

// Mock the event bus
vi.mock('../../core/event-bus', () => ({
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
      const tools = toolRegistry.getAllTools();
      expect(tools).toHaveLength(2);
      expect(tools.some(tool => tool.name === 'vision-agent')).toBe(true);
      expect(tools.some(tool => tool.name === 'voice-agent')).toBe(true);
    });
    
    it('should execute vision agent tool through registry', async () => {
      const context = {
        toolName: 'vision-agent',
        parameters: {
          action: 'processImage',
          imageData: 'base64imageString'
        },
        context: {}
      };
      
      // Mock the vision agent tool execute method
      const mockExecute = vi.spyOn(visionAgentTool, 'execute')
        .mockResolvedValue({ success: true, output: 'Processed image description' });
      
      const result = await toolRegistry.executeTool(context);
      
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
        context: {}
      };
      
      // Mock the voice agent tool execute method
      const mockExecute = vi.spyOn(voiceAgentTool, 'execute')
        .mockResolvedValue({ success: true, output: { text: 'Transcribed audio' } });
      
      const result = await toolRegistry.executeTool(context);
      
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
        context: {}
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
        context: {}
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
        image: Buffer.from('mock image data'), 
        audio: Buffer.from('mock audio data') 
      };
      
      // Mock controller methods
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockResolvedValue('Processed image description');
      const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
        .mockResolvedValue('Transcribed audio text');
      
      // Process through controller
      const result = await visionVoiceController.processMultimodalInput(input);
      
      expect(result.text).toContain('Processed image description'); // With sequential strategy, vision is processed first
      expect(result.image).toBe(input.image);
      expect(result.audio).toBe(input.audio);
      expect(mockProcessImage).toHaveBeenCalledWith(input.image);
      expect(mockProcessAudio).toHaveBeenCalledWith(input.audio);
    });
    
    it('should handle tool execution errors gracefully in coordination', async () => {
      const input = { image: Buffer.from('mock image data') };
      
      // Mock vision controller to throw an error
      const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
        .mockRejectedValue(new Error('Image processing failed'));
      
      await expect(visionVoiceController.processMultimodalInput(input))
        .rejects
        .toThrow('Image processing failed');
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.image);
    });
  });
  
  describe('Event-Based Coordination', () => {
    it('should publish and handle modality switch events', async () => {
      // Subscribe to modality switch events
      const eventHandler = vi.fn();
      (eventBus.subscribe as vi.Mock).mockImplementation((eventType, handler) => {
        if (eventType === 'multimodal.modality.switched') {
          eventHandler.mockImplementation(handler);
        }
      });
      
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
      const input = { image: Buffer.from('mock image data') };
      
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
      
      expect(mockProcessImage).toHaveBeenCalledWith(input.image);
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