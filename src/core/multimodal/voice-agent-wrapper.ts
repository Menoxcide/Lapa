// Voice Agent Wrapper for integration with the LAPA Helix team agent pattern
import { HelixTeamAgentWrapper } from '../core/agent-tool.js';
import { AgentToolRegistry } from '../core/agent-tool.js';
import { VoiceAgentTool } from './voice-agent-tool.js';
import { VoiceAgentConfig } from './types.js';
import { RAGPipeline } from '../rag/pipeline.js';
import { HelixAgentType } from '../core/types/agent-types.js';

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
    const voiceTool = new VoiceAgentTool(config || { ttsProvider: 'system', sttProvider: 'system', language: 'en' }, ragPipeline);
    registry.registerTool(voiceTool);
    this.addTool(voiceTool);
  }

  public addTool(tool: any): void {
    // Add tool to the wrapper's internal registry
    // Assuming parent has a similar method or implement here
    super.addTool(tool);
  }
}