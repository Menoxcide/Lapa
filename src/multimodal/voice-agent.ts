// Voice agent implementation
import { AudioProcessingPipeline, TTSSTTPipeline, TTSConfig, STTConfig } from './tts-stt';
import { RAGPipeline } from '../rag/pipeline';
import { MultimodalEventPublisher } from './utils/event-publisher.ts';

export interface VoiceAgentInterface {
  processAudio(audio: Buffer): Promise<string>;
  generateAudio(text: string): Promise<Buffer>;
  askQuestion(question: string): Promise<string>;
  executeVoiceCommand(command: string): Promise<any>;
}

export interface VoiceAgentConfig {
  ttsConfig?: TTSConfig;
  sttConfig?: STTConfig;
  enableRAGIntegration?: boolean;
  enableEventPublishing?: boolean;
}

export class VoiceAgent implements VoiceAgentInterface {
  private audioPipeline: AudioProcessingPipeline;
  private eventBus: LAPAEventBus;
  private ragPipeline?: RAGPipeline;
  private config: VoiceAgentConfig;
  
  constructor(config?: VoiceAgentConfig, ragPipeline?: RAGPipeline) {
    this.config = config || {};
    this.audioPipeline = new TTSSTTPipeline(
      this.config.ttsConfig,
      this.config.sttConfig
    );
    this.eventBus = eventBus;
    this.ragPipeline = ragPipeline;
  }

  async processAudio(audio: Buffer): Promise<string> {
    const processingStart = Date.now();
    try {
      // Publish event before processing
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceAudioProcessing(
          'voice-agent',
          audio.length,
          undefined, // format
          processingStart
        );
      }
      
      // Process audio using the audio pipeline
      const result = await this.audioPipeline.speechToText(audio);
      
      // Publish event after processing
      if (this.config.enableEventPublishing) {
        const processingEnd = Date.now();
        const processingTime = processingEnd - processingStart;
        await MultimodalEventPublisher.publishVoiceAudioProcessed(
          'voice-agent',
          result.length,
          processingTime,
          processingEnd
        );
      }
      
      return result;
    } catch (error) {
      // Publish error event
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceAudioError(
          'voice-agent',
          error instanceof Error ? error.message : String(error),
          audio.length
        );
      }
      throw error;
    }
  }

  async generateAudio(text: string): Promise<Buffer> {
    const generationStart = Date.now();
    try {
      // Publish event before processing
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceAudioGenerating(
          'voice-agent',
          text.length,
          generationStart
        );
      }
      
      // Generate audio using the audio pipeline
      const result = await this.audioPipeline.textToSpeech(text);
      
      // Publish event after processing
      if (this.config.enableEventPublishing) {
        const generationEnd = Date.now();
        const processingTime = generationEnd - generationStart;
        await MultimodalEventPublisher.publishVoiceAudioGenerated(
          'voice-agent',
          result.length,
          undefined, // duration
          processingTime,
          generationEnd
        );
      }
      
      return result;
    } catch (error) {
      // Publish error event
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceAudioError(
          'voice-agent',
          error instanceof Error ? error.message : String(error),
          undefined, // audioLength
          text.length
        );
      }
      throw error;
    }
  }

  async askQuestion(question: string): Promise<string> {
    const processingStart = Date.now();
    try {
      // Publish event before processing
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceQuestionAsking(
          'voice-agent',
          question,
          undefined, // context
          processingStart
        );
      }
      
      let answer: string;
      
      // If RAG integration is enabled and we have a RAG pipeline, use it
      if (this.config.enableRAGIntegration && this.ragPipeline) {
        try {
          // Search for similar content using RAG
          const similarContent = await this.ragPipeline.searchSimilar(question, 3);
          
          if (similarContent.length > 0) {
            // Create context from similar content
            const context = similarContent.map(item => item.content).join('\n\n');
            
            // Formulate a response based on the context
            answer = `Based on the available information:\n\n${context}\n\nRegarding your question: ${question}`;
          } else {
            answer = `I couldn't find specific information related to your question: ${question}`;
          }
        } catch (ragError) {
          console.error('RAG processing error:', ragError);
          answer = `I encountered an issue accessing the knowledge base. Direct response to your question: ${question}`;
        }
      } else {
        // Simple echo response if RAG is not enabled
        answer = `You asked: ${question}. This is a placeholder response as RAG integration is not enabled.`;
      }
      
      // Publish event after processing
      if (this.config.enableEventPublishing) {
        const processingEnd = Date.now();
        const processingTime = processingEnd - processingStart;
        await MultimodalEventPublisher.publishVoiceQuestionAnswered(
          'voice-agent',
          question,
          answer,
          processingTime,
          processingEnd
        );
      }
      
      return answer;
    } catch (error) {
      // Publish error event
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceQuestionError(
          'voice-agent',
          error instanceof Error ? error.message : String(error),
          question
        );
      }
      throw error;
    }
  }

  async executeVoiceCommand(command: string): Promise<any> {
    const executionStart = Date.now();
    try {
      // Publish event before processing
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceCommandExecuting(
          'voice-agent',
          command,
          undefined, // intent
          undefined, // entities
          undefined, // confidence
          executionStart
        );
      }
      
      // Parse and execute voice command
      let result: any;
      
      // Simple command parsing
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        result = { response: 'Hello! How can I assist you today?' };
      } else if (lowerCommand.includes('help')) {
        result = {
          response: 'I can help you with voice commands, answering questions, and processing audio. Try saying "hello" or asking a question.'
        };
      } else if (lowerCommand.includes('time')) {
        result = {
          response: `The current time is ${new Date().toLocaleTimeString()}`
        };
      } else if (lowerCommand.includes('date')) {
        result = {
          response: `Today's date is ${new Date().toLocaleDateString()}`
        };
      } else {
        // Default response for unrecognized commands
        result = {
          response: `I received your command: "${command}". I'm still learning to understand more commands.`
        };
      }
      
      // Publish event after processing
      if (this.config.enableEventPublishing) {
        const executionEnd = Date.now();
        const processingTime = executionEnd - executionStart;
        await MultimodalEventPublisher.publishVoiceCommandExecuted(
          'voice-agent',
          command,
          undefined, // intent
          undefined, // entities
          result,
          undefined, // confidence
          processingTime,
          executionEnd
        );
      }
      
      return result;
    } catch (error) {
      // Publish error event
      if (this.config.enableEventPublishing) {
        await MultimodalEventPublisher.publishVoiceCommandError(
          'voice-agent',
          error instanceof Error ? error.message : String(error),
          command
        );
      }
      throw error;
    }
  }
}