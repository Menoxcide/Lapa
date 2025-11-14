// Vision Agent Wrapper for integration with the LAPA Helix team agent pattern
import { HelixTeamAgentWrapper } from '../core/agent-tool.js';
import { AgentToolRegistry } from '../core/agent-tool.js';
import { VisionAgentTool } from './vision-agent-tool.js';
import { MultimodalConfig } from './types/index.js';
import { HelixAgentType } from '../core/types/agent-types.js';

export class VisionAgentWrapper extends HelixTeamAgentWrapper {
  constructor(
    id: string, 
    name: string, 
    registry: AgentToolRegistry,
    config?: MultimodalConfig
  ) {
    // Initialize with vision agent-specific capabilities
    super(
      id,
      'vision' as HelixAgentType,
      name,
      ['vision-processing', 'image-analysis', 'ui-recognition', 'code-generation-from-design', 'screenshot-analysis'],
      0, // Initial workload
      5, // Capacity
      registry
    );
    
    // Register vision agent tools
    this.registerVisionTools(registry, config);
  }
  
  /**
   * Register vision agent tools
   * @param registry Tool registry
   * @param config Vision agent configuration
   */
  private registerVisionTools(
    registry: AgentToolRegistry, 
    config?: MultimodalConfig
  ): void {
    const visionTool = new VisionAgentTool(config);
    registry.registerTool(visionTool);
    this.addTool(visionTool);
  }
}