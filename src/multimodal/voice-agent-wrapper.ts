// Voice Agent Wrapper for integration with the LAPA Helix team agent pattern
import { HelixTeamAgentWrapper } from '../core/agent-tool';
import { AgentToolRegistry } from '../core/agent-tool';
import { VoiceAgentTool } from './voice-agent-tool';
import { VoiceAgentConfig } from './types';
import { RAGPipeline } from '../rag/pipeline';
import { HelixAgentType } from '../core/types/agent-types';

export class VoiceAgentWrapper extends HelixTeamAgentWrapper {
  constructor(
    id: string, 
    name: string, 
    registry: AgentToolRegistry,
    config?: VoiceAgentConfig,
    ragPipeline?: RAGPipeline
  ) {
    // Initialize with voice agent-specific capabilities
    super(
      id,
      'voice' as HelixAgentType,
      name,
      ['voice-processing', 'speech-to-text', 'text-to-speech', 'voice-commands', 'voice-qa'],
      0, // Initial workload
      5, // Capacity
      registry
    );
    
    // Register voice agent tools
    this.registerVoiceTools(registry, config, ragPipeline);
  }
  
  /**
   * Register voice agent tools
   * @param registry Tool registry
   * @param config Voice agent configuration
   * @param ragPipeline RAG pipeline for Q&A integration
   */
  private registerVoiceTools(
    registry: AgentToolRegistry, 
    config?: VoiceAgentConfig,
    ragPipeline?: RAGPipeline
  ): void {
    const voiceTool = new VoiceAgentTool(config, ragPipeline);
    registry.registerTool(voiceTool);
    this.addTool(voiceTool);
  }
}