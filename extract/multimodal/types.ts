export interface VoiceAgentConfig {
  ttsProvider: 'piper' | 'speechbrain' | 'system';
  sttProvider: 'whisper' | 'speechbrain' | 'system';
  enableRAGIntegration?: boolean;
  enableEventPublishing?: boolean;
  language?: string;
}