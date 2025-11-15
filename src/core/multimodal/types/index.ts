// Multimodal type definitions
export interface MultimodalConfig {
  visionModel: string;
  voiceModel: string;
  enableAudioProcessing: boolean;
  enableImageProcessing: boolean;
  modalityPriority?: ('vision' | 'voice')[];
  fallbackStrategy?: 'sequential' | 'parallel' | 'none';
}

export interface MultimodalRequest {
  imageData?: Buffer;
  audioData?: Buffer;
  text?: string;
}

export interface MultimodalResponse {
  text: string;
  imageData?: Buffer;
  audioData?: Buffer;
}

// Voice agent specific types
export interface VoiceAgentConfig {
  ttsProvider: 'piper' | 'speechbrain' | 'system';
  sttProvider: 'whisper' | 'speechbrain' | 'system';
  voiceModel?: string;
  language?: string;
  enableRAGIntegration?: boolean;
  enableEventPublishing?: boolean;
}

export interface SpeechToTextResult {
  text: string;
  confidence?: number;
  language?: string;
  processingTime?: number;
}

export interface TextToSpeechResult {
  audioBuffer: Buffer;
  duration?: number;
  format?: string;
  processingTime?: number;
}

export interface VoiceCommand {
  command: string;
  intent?: string;
  entities?: Record<string, any>;
  confidence?: number;
}

export interface VoiceQuestion {
  question: string;
  context?: string;
  sessionId?: string;
}

export interface VoiceAnswer {
  answer: string;
  sources?: string[];
  confidence?: number;
  processingTime?: number;
}