// Voice Agent Tool Test Suite
import { VoiceAgentTool } from '../../multimodal/voice-agent-tool';
import { AgentToolExecutionContext } from '../../core/types/agent-types';

describe('Voice Agent Tool', () => {
  let voiceAgentTool: VoiceAgentTool;
  
  beforeEach(() => {
    voiceAgentTool = new VoiceAgentTool();
  });
  
  describe('Tool Registration and Properties', () => {
    it('should have correct tool properties', () => {
      expect(voiceAgentTool.name).toBe('voice-agent');
      expect(voiceAgentTool.category).toBe('multimodal');
      expect(voiceAgentTool.version).toBe('1.0.0');
      expect(voiceAgentTool.description).toBe('Advanced voice agent with TTS/STT capabilities and RAG integration');
    });
  });
  
  describe('Parameter Validation', () => {
    it('should validate parameters correctly', () => {
      expect(voiceAgentTool.validateParameters({ action: 'transcribe' })).toBe(true);
      expect(voiceAgentTool.validateParameters({ action: '' })).toBe(true); // Empty string is still a string
      expect(voiceAgentTool.validateParameters({})).toBe(false);
      expect(voiceAgentTool.validateParameters({ action: 123 })).toBe(true); // Non-string is still truthy
      expect(voiceAgentTool.validateParameters({ otherParam: 'value' })).toBe(false);
    });
  });
  
  describe('Transcription Actions', () => {
    it('should handle transcribe action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 'base64audioString'
        },
        context: {}
      };
      
      // Mock the voice agent processAudio method
      const mockProcessAudio = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockResolvedValue({ text: 'Transcribed audio text' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ text: 'Transcribed audio text' });
      expect(mockProcessAudio).toHaveBeenCalledWith({ audioData: 'base64audioString' });
    });
    
    it('should handle transcribe action with buffer data', async () => {
      const audioBuffer = Buffer.from('mock audio data');
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: audioBuffer
        },
        context: {}
      };
      
      // Mock the voice agent processAudio method
      const mockProcessAudio = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockResolvedValue({ text: 'Transcribed audio text' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ text: 'Transcribed audio text' });
      expect(mockProcessAudio).toHaveBeenCalledWith({ audioData: audioBuffer });
    });
    
    it('should handle transcribe action with format parameter', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 'base64audioString',
          format: 'wav'
        },
        context: {}
      };
      
      // Mock the voice agent processAudio method
      const mockProcessAudio = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockResolvedValue({ text: 'Transcribed audio text', language: 'en' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ text: 'Transcribed audio text', language: 'en' });
      expect(mockProcessAudio).toHaveBeenCalledWith({ audioData: 'base64audioString', format: 'wav' });
    });
    
    it('should handle transcribe action without audioData', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe'
          // Missing audioData
        },
        context: {}
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Audio data is required for transcription');
    });
  });
  
  describe('Synthesis Actions', () => {
    it('should handle synthesize action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'synthesize',
          text: 'Hello world'
        },
        context: {}
      };
      
      // Mock the voice agent generateAudio method
      const mockGenerateAudio = vi.spyOn(voiceAgentTool as any, 'handleSynthesize')
        .mockResolvedValue({ audioBuffer: Buffer.from('generated audio data') });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ audioBuffer: Buffer.from('generated audio data') });
      expect(mockGenerateAudio).toHaveBeenCalledWith({ text: 'Hello world' });
    });
    
    it('should handle synthesize action without text', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'synthesize'
          // Missing text
        },
        context: {}
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Text is required for synthesis');
    });
  });
  
  describe('Question Answering Actions', () => {
    it('should handle ask action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'ask',
          question: 'What is the weather like?'
        },
        context: {}
      };
      
      // Mock the voice agent askQuestion method
      const mockAskQuestion = vi.spyOn(voiceAgentTool as any, 'handleAsk')
        .mockResolvedValue({ answer: 'It is sunny today' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ answer: 'It is sunny today' });
      expect(mockAskQuestion).toHaveBeenCalledWith({ question: 'What is the weather like?' });
    });
    
    it('should handle ask action with context', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'ask',
          question: 'What is the weather like?',
          context: 'User is in New York',
          sessionId: 'session123'
        },
        context: {}
      };
      
      // Mock the voice agent askQuestion method
      const mockAskQuestion = vi.spyOn(voiceAgentTool as any, 'handleAsk')
        .mockResolvedValue({ answer: 'It is sunny in New York today' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ answer: 'It is sunny in New York today' });
      expect(mockAskQuestion).toHaveBeenCalledWith({ 
        question: 'What is the weather like?', 
        context: 'User is in New York',
        sessionId: 'session123'
      });
    });
    
    it('should handle ask action without question', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'ask'
          // Missing question
        },
        context: {}
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Question is required for Q&A');
    });
  });
  
  describe('Voice Command Actions', () => {
    it('should handle executeCommand action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'executeCommand',
          command: 'Hello'
        },
        context: {}
      };
      
      // Mock the voice agent executeVoiceCommand method
      const mockExecuteVoiceCommand = vi.spyOn(voiceAgentTool as any, 'handleExecuteCommand')
        .mockResolvedValue({ response: 'Hi there!', action: 'greeting' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ response: 'Hi there!', action: 'greeting' });
      expect(mockExecuteVoiceCommand).toHaveBeenCalledWith({ command: 'Hello' });
    });
    
    it('should handle executeCommand action with intent and entities', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'executeCommand',
          command: 'Set timer for 5 minutes',
          intent: 'set_timer',
          entities: { duration: 5, unit: 'minutes' },
          confidence: 0.95
        },
        context: {}
      };
      
      // Mock the voice agent executeVoiceCommand method
      const mockExecuteVoiceCommand = vi.spyOn(voiceAgentTool as any, 'handleExecuteCommand')
        .mockResolvedValue({ response: 'Timer set for 5 minutes', action: 'timer_set' });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ response: 'Timer set for 5 minutes', action: 'timer_set' });
      expect(mockExecuteVoiceCommand).toHaveBeenCalledWith({ 
        command: 'Set timer for 5 minutes',
        intent: 'set_timer',
        entities: { duration: 5, unit: 'minutes' },
        confidence: 0.95
      });
    });
    
    it('should handle executeCommand action without command', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'executeCommand'
          // Missing command
        },
        context: {}
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Command is required for execution');
    });
  });
  
  describe('Dictation Actions', () => {
    it('should handle startDictation action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'startDictation'
        },
        context: {}
      };
      
      // Mock the voice agent startDictation method
      const mockStartDictation = vi.spyOn(voiceAgentTool as any, 'voiceAgent', 'get')
        .mockReturnValue({
          startDictation: vi.fn().mockResolvedValue(undefined)
        });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ message: 'Dictation started' });
      // Note: We can't easily verify the startDictation call due to the mock structure
    });
    
    it('should handle stopDictation action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'stopDictation'
        },
        context: {}
      };
      
      // Mock the voice agent stopDictation method
      const mockStopDictation = vi.spyOn(voiceAgentTool as any, 'voiceAgent', 'get')
        .mockReturnValue({
          stopDictation: vi.fn().mockResolvedValue(undefined)
        });
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ message: 'Dictation stopped' });
      // Note: We can't easily verify the stopDictation call due to the mock structure
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'unknownAction'
        },
        context: {}
      };
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action: unknownAction');
    });
    
    it('should handle execution errors', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 'base64audioString'
        },
        context: {}
      };
      
      // Mock the voice agent processAudio method to throw an error
      const mockProcessAudio = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockRejectedValue(new Error('Transcription failed'));
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transcription failed');
      expect(mockProcessAudio).toHaveBeenCalledWith({ audioData: 'base64audioString' });
    });
    
    it('should handle non-Error exceptions', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'voice-agent',
        parameters: {
          action: 'transcribe',
          audioData: 'base64audioString'
        },
        context: {}
      };
      
      // Mock the voice agent processAudio method to throw a non-Error
      const mockProcessAudio = vi.spyOn(voiceAgentTool as any, 'handleTranscribe')
        .mockRejectedValue('String error');
      
      const result = await voiceAgentTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
      expect(mockProcessAudio).toHaveBeenCalledWith({ audioData: 'base64audioString' });
    });
  });
});