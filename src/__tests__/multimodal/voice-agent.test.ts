// Voice Agent Test Suite
import { AdvancedVoiceAgent } from '../../multimodal/advanced-voice-agent.ts';
import { VoiceAgentConfig } from '../../multimodal/types/index.ts';

describe('Voice Agent', () => {
  let voiceAgent: AdvancedVoiceAgent;
  
  beforeEach(() => {
    const config: VoiceAgentConfig = {
      ttsProvider: 'system',
      sttProvider: 'system',
      enableRAGIntegration: false,
      enableEventPublishing: false
    };
    
    voiceAgent = new AdvancedVoiceAgent(config);
  });
  
  describe('Text-to-Speech', () => {
    it('should generate audio from text', async () => {
      const text = 'Hello, this is a test.';
      const result = await voiceAgent.generateAudio(text);
      
      expect(result).toBeDefined();
      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.format).toBe('wav');
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
  
  describe('Speech-to-Text', () => {
    it('should process audio and return text', async () => {
      // Create a mock audio buffer
      const audioBuffer = Buffer.from('mock audio data');
      const result = await voiceAgent.processAudio(audioBuffer);
      
      expect(result).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.language).toBe('en');
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
  
  describe('Voice Commands', () => {
    it('should execute voice commands', async () => {
      const command = {
        command: 'Hello, how are you?'
      };
      
      const result = await voiceAgent.executeVoiceCommand(command);
      
      expect(result).toBeDefined();
      expect(result.response).toContain('Hello!');
      expect(result.action).toBe('greeting');
    });
    
    it('should handle time commands', async () => {
      const command = {
        command: 'What time is it?'
      };
      
      const result = await voiceAgent.executeVoiceCommand(command);
      
      expect(result).toBeDefined();
      expect(result.response).toContain('The current time is');
      expect(result.action).toBe('time');
    });
    
    it('should handle date commands', async () => {
      const command = {
        command: 'What is today\'s date?'
      };
      
      const result = await voiceAgent.executeVoiceCommand(command);
      
      expect(result).toBeDefined();
      expect(result.response).toContain('Today\'s date is');
      expect(result.action).toBe('date');
    });
  });
  
  describe('Question Answering', () => {
    it('should answer questions', async () => {
      const question = {
        question: 'What is the weather like today?'
      };
      
      const result = await voiceAgent.askQuestion(question);
      
      expect(result).toBeDefined();
      expect(typeof result.answer).toBe('string');
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
  
  describe('Dictation', () => {
    it('should start and stop dictation', async () => {
      // Start dictation
      await voiceAgent.startDictation();
      
      // Add some audio to the buffer
      const audioBuffer = Buffer.from('dictation audio data');
      await (voiceAgent as any).addToDictationBuffer(audioBuffer);
      
      // Stop dictation
      await voiceAgent.stopDictation();
      
      // This test mainly verifies that the methods don't throw errors
      expect(true).toBe(true);
    });
  });
});