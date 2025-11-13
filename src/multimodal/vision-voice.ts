// Unified multimodal interface for vision and voice agents
import { VisionAgent, VisionAgentInterface } from './vision-agent';
import { VoiceAgent, VoiceAgentInterface } from './voice-agent';
import { MultimodalConfig, MultimodalInput, MultimodalOutput } from './types';
import { eventBus } from '../core/event-bus';

export interface VisionVoiceInterface extends VisionAgentInterface, VoiceAgentInterface {
  processMultimodalInput(input: MultimodalInput): Promise<MultimodalOutput>;
  setCurrentModality(modality: 'vision' | 'voice' | 'auto'): void;
  getCurrentModality(): 'vision' | 'voice' | 'auto';
}

export class VisionVoiceController implements VisionVoiceInterface {
  private visionAgent: VisionAgent;
  private voiceAgent: VoiceAgent;
  private currentModality: 'vision' | 'voice' | 'auto';
  private config: MultimodalConfig;
  private context: Map<string, any>;
  private modalityPriority: ('vision' | 'voice')[];
  
  constructor(config: MultimodalConfig) {
    this.config = config;
    this.currentModality = 'auto';
    this.context = new Map();
    this.modalityPriority = ['vision', 'voice']; // Default priority
    
    // Initialize vision agent
    this.visionAgent = new VisionAgent(this.config.visionModel);
    
    // Initialize voice agent with default config
    this.voiceAgent = new VoiceAgent();
  }
  
  setCurrentModality(modality: 'vision' | 'voice' | 'auto'): void {
    const previousModality = this.currentModality;
    this.currentModality = modality;
    
    // Preserve context when switching modalities
    this.preserveContext(previousModality, modality);
    
    // Publish event
    eventBus.publish({
      id: `modality.switched.${Date.now()}`,
      type: 'multimodal.modality.switched',
      timestamp: Date.now(),
      source: 'vision-voice-controller',
      payload: {
        from: previousModality,
        to: modality
      }
    } as any);
  }
  
  setModalityPriority(priority: ('vision' | 'voice')[]): void {
    this.modalityPriority = priority;
    
    // Publish event
    eventBus.publish({
      id: `modality.priority.updated.${Date.now()}`,
      type: 'multimodal.modality.priority.updated',
      timestamp: Date.now(),
      source: 'vision-voice-controller',
      payload: {
        priority: priority
      }
    } as any);
  }
  
  getModalityPriority(): ('vision' | 'voice')[] {
    return [...this.modalityPriority]; // Return a copy to prevent external modification
  }
  
  getProcessingOrder(input: MultimodalInput): ('vision' | 'voice')[] {
    // If current modality is explicitly set, use that
    if (this.currentModality !== 'auto') {
      return [this.currentModality];
    }
    
    // Otherwise, use priority order
    return this.modalityPriority.filter(modality => {
      if (modality === 'vision') return !!input.image;
      if (modality === 'voice') return !!input.audio;
      return false;
    });
  }
  
  getCurrentModality(): 'vision' | 'voice' | 'auto' {
    return this.currentModality;
  }
  
  async processMultimodalInput(input: MultimodalInput): Promise<MultimodalOutput> {
    // Validate input
    if (!input.image && !input.audio) {
      throw new Error('At least one modality (image or audio) must be provided');
    }
    
    // Publish event
    await eventBus.publish({
      id: `multimodal.processing.${Date.now()}`,
      type: 'multimodal.processing.started',
      timestamp: Date.now(),
      source: 'vision-voice-controller',
      payload: {
        inputTypes: {
          hasImage: !!input.image,
          hasAudio: !!input.audio
        },
        modality: this.currentModality
      }
    } as any);
    
    try {
      const output: MultimodalOutput = { text: '' };
      
      // Determine processing order based on priority
      const processingOrder = this.getProcessingOrder(input);
      
      // Process inputs according to priority with fallback strategy
      let processedSuccessfully = false;
      const fallbackStrategy = this.config.fallbackStrategy || 'sequential';
      
      if (fallbackStrategy === 'parallel') {
        // Process all modalities in parallel
        const promises: Promise<void>[] = [];
        
        if (input.image) {
          promises.push((async () => {
            try {
              const result = await this.visionAgent.processImage(input.image!);
              output.text += `\n[VISION] ${result}`;
              output.image = input.image;
              this.updateContext('vision', { lastImage: input.image, lastVisionOutput: result });
              processedSuccessfully = true;
            } catch (error) {
              console.error('Vision processing failed:', error);
              // Don't throw, let other modalities try
              // Publish error event
              await eventBus.publish({
                id: `multimodal.vision.error.${Date.now()}`,
                type: 'multimodal.vision.processing.error',
                timestamp: Date.now(),
                source: 'vision-voice-controller',
                payload: {
                  error: error instanceof Error ? error.message : String(error)
                }
              } as any);
            }
          })());
        }
        
        if (input.audio) {
          promises.push((async () => {
            try {
              const result = await this.voiceAgent.processAudio(input.audio!);
              output.text += `\n[AUDIO] ${result}`;
              output.audio = input.audio;
              this.updateContext('voice', { lastAudio: input.audio, lastVoiceOutput: result });
              processedSuccessfully = true;
            } catch (error) {
              console.error('Voice processing failed:', error);
              // Don't throw, let other modalities try
              // Publish error event
              await eventBus.publish({
                id: `multimodal.voice.error.${Date.now()}`,
                type: 'multimodal.voice.processing.error',
                timestamp: Date.now(),
                source: 'vision-voice-controller',
                payload: {
                  error: error instanceof Error ? error.message : String(error)
                }
              } as any);
            }
          })());
        }
        
        // Wait for all processing to complete
        await Promise.all(promises);
      } else {
        // Process inputs according to priority (sequential)
        for (const modality of processingOrder) {
          try {
            if (modality === 'vision' && input.image) {
              // Process image with vision agent
              output.text = await this.visionAgent.processImage(input.image);
              output.image = input.image;
              
              // Update context with vision processing results
              this.updateContext('vision', { lastImage: input.image, lastVisionOutput: output.text });
              processedSuccessfully = true;
              
              // If sequential fallback is not enabled, break after first success
              if (fallbackStrategy === 'none') break;
            } else if (modality === 'voice' && input.audio) {
              // Process audio with voice agent
              output.text = await this.voiceAgent.processAudio(input.audio);
              output.audio = input.audio;
              
              // Update context with voice processing results
              this.updateContext('voice', { lastAudio: input.audio, lastVoiceOutput: output.text });
              processedSuccessfully = true;
              
              // If sequential fallback is not enabled, break after first success
              if (fallbackStrategy === 'none') break;
            }
          } catch (error) {
            console.error(`${modality} processing failed:`, error);
            // Publish error event
            await eventBus.publish({
              id: `multimodal.${modality}.error.${Date.now()}`,
              type: `multimodal.${modality}.processing.error`,
              timestamp: Date.now(),
              source: 'vision-voice-controller',
              payload: {
                error: error instanceof Error ? error.message : String(error)
              }
            } as any);
            
            // Continue to next modality if fallback is enabled
            if (fallbackStrategy === 'none') {
              throw error;
            }
          }
        }
      }
      
      // If neither modality was processed successfully, fall back to simple text response
      if (!processedSuccessfully) {
        output.text = 'No input processed successfully';
        
        // Publish fallback event
        await eventBus.publish({
          id: `multimodal.fallback.${Date.now()}`,
          type: 'multimodal.processing.fallback',
          timestamp: Date.now(),
          source: 'vision-voice-controller',
          payload: {
            reason: 'No modalities processed successfully'
          }
        } as any);
      }
      
      // Publish event
      await eventBus.publish({
        id: `multimodal.processed.${Date.now()}`,
        type: 'multimodal.processing.completed',
        timestamp: Date.now(),
        source: 'vision-voice-controller',
        payload: {
          outputLength: output.text.length,
          modality: this.currentModality,
          processingTime: Date.now() - (eventBus as any).lastEventTime // Approximate processing time
        }
      } as any);
      
      return output;
    } catch (error) {
      // Publish error event
      await eventBus.publish({
        id: `multimodal.error.${Date.now()}`,
        type: 'multimodal.processing.error',
        timestamp: Date.now(),
        source: 'vision-voice-controller',
        payload: {
          error: error instanceof Error ? error.message : String(error)
        }
      } as any);
      
      throw error;
    }
  }
    
  private preserveContext(fromModality: string, toModality: string): void {
    // In a real implementation, this would preserve relevant context when switching modalities
    console.log(`Preserving context from ${fromModality} to ${toModality}`);
    
    // Publish event
    eventBus.publish({
      id: `context.preserved.${Date.now()}`,
      type: 'multimodal.context.preserved',
      timestamp: Date.now(),
      source: 'vision-voice-controller',
      payload: {
        from: fromModality,
        to: toModality
      }
    } as any);
  }
  
  private updateContext(modality: string, data: any): void {
    // Update context with new data from modality processing
    const existingData = this.context.get(modality) || {};
    this.context.set(modality, { ...existingData, ...data });
    
    // Also update global context
    const globalData = this.context.get('global') || {};
    this.context.set('global', { ...globalData, ...data });
    
    // Publish event
    eventBus.publish({
      id: `context.updated.${Date.now()}`,
      type: 'multimodal.context.updated',
      timestamp: Date.now(),
      source: 'vision-voice-controller',
      payload: {
        modality: modality,
        data: data
      }
    } as any);
  }
  
  getContext(modality?: string): any {
    if (modality) {
      return this.context.get(modality);
    }
    return Object.fromEntries(this.context);
  }
  
  // Vision agent methods
  async processImage(image: Buffer): Promise<string> {
    return this.visionAgent.processImage(image);
  }
  
  async generateImage(description: string): Promise<Buffer> {
    return this.visionAgent.generateImage(description);
  }
  
  async analyzeScreenshot(screenshot: Buffer): Promise<any> {
    return this.visionAgent.analyzeScreenshot(screenshot);
  }
  
  async recognizeUIElements(image: Buffer): Promise<any[]> {
    return this.visionAgent.recognizeUIElements(image);
  }
  
  async generateCodeFromDesign(image: Buffer, framework: string): Promise<string> {
    return this.visionAgent.generateCodeFromDesign(image, framework);
  }
  
  // Voice agent methods
  async processAudio(audio: Buffer): Promise<string> {
    return this.voiceAgent.processAudio(audio);
  }
  
  async generateAudio(text: string): Promise<Buffer> {
    return this.voiceAgent.generateAudio(text);
  }
  
  async askQuestion(question: string): Promise<string> {
    return this.voiceAgent.askQuestion(question);
  }
  
  async executeVoiceCommand(command: string): Promise<any> {
    return this.voiceAgent.executeVoiceCommand(command);
  }
}