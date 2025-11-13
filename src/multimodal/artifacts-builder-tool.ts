// Artifacts Builder Tool for integration with the LAPA agent system
import { BaseAgentTool } from '../core/agent-tool';
import { AgentToolExecutionContext, AgentToolExecutionResult } from '../core/types/agent-types';
import { ArtifactsBuilder } from './artifacts-builder';
import { MultimodalConfig } from './types';

export class ArtifactsBuilderTool extends BaseAgentTool {
  private artifactsBuilder: ArtifactsBuilder;

  constructor(config?: MultimodalConfig) {
    super(
      'artifacts-builder',
      'multimodal',
      'Specialized artifacts builder for React/Tailwind HTML generation',
      '1.0.0'
    );
    
    // Create the artifacts builder with the provided configuration
    this.artifactsBuilder = new ArtifactsBuilder(config);
  }

  /**
   * Execute the artifacts builder tool
   * @param context Execution context
   * @returns Promise resolving to execution result
   */
  async execute(context: AgentToolExecutionContext): Promise<AgentToolExecutionResult> {
    try {
      // Extract parameters
      const { action, ...params } = context.parameters;
      
      // Validate parameters
      if (!this.validateParameters(context.parameters)) {
        return {
          success: false,
          error: 'Invalid parameters: action is required',
          executionTime: 0
        };
      }
      
      let result: any;
      const startTime = Date.now();
      
      // Execute the requested action
      switch (action) {
        case 'generateReactCodeFromDesign':
          result = await this.handleGenerateReactCodeFromDesign(params);
          break;
          
        case 'getTemplates':
          result = this.artifactsBuilder.getTemplates();
          break;
          
        case 'getTemplate':
          result = this.artifactsBuilder.getTemplate(params.id);
          break;
          
        case 'createTemplate':
          this.artifactsBuilder.createTemplate(params.template);
          result = { success: true };
          break;
          
        case 'updateTemplate':
          this.artifactsBuilder.updateTemplate(params.id, params.template);
          result = { success: true };
          break;
          
        case 'deleteTemplate':
          this.artifactsBuilder.deleteTemplate(params.id);
          result = { success: true };
          break;
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            executionTime: 0
          };
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        output: result,
        executionTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0
      };
    }
  }

  /**
   * Validate tool parameters
   * @param params Parameters to validate
   * @returns Boolean indicating if parameters are valid
   */
  validateParameters(params: Record<string, any>): boolean {
    return !!params.action && typeof params.action === 'string';
  }

  /**
   * Handle React code generation from design
   * @param params Parameters for code generation
   * @returns Generated code
   */
  private async handleGenerateReactCodeFromDesign(params: Record<string, any>): Promise<any> {
    if (!params.imageData) {
      throw new Error('Image data is required for code generation');
    }
    
    // Convert base64 image data to buffer if needed
    let imageBuffer: Buffer;
    if (typeof params.imageData === 'string') {
      imageBuffer = Buffer.from(params.imageData, 'base64');
    } else if (params.imageData instanceof Buffer) {
      imageBuffer = params.imageData;
    } else {
      throw new Error('Invalid image data format');
    }
    
    const options = {
      componentName: params.componentName,
      includeComments: params.includeComments,
      useTemplates: params.useTemplates
    };
    
    return await this.artifactsBuilder.generateReactCodeFromDesign(imageBuffer, options);
  }
}