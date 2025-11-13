// Vision Agent Tool for integration with the LAPA agent system
import { BaseAgentTool } from '../core/agent-tool.ts';
import { AgentToolExecutionContext, AgentToolExecutionResult } from '../core/types/agent-types.ts';
import { VisionAgent } from './vision-agent.ts';
import { MultimodalConfig } from './types/index.ts';
import { MultimodalEventPublisher } from './utils/event-publisher.ts';

export class VisionAgentTool extends BaseAgentTool {
  private visionAgent: VisionAgent;

  constructor(config?: MultimodalConfig) {
    super(
      'vision-agent',
      'code-generation',
      'Advanced vision agent with image processing and UI analysis capabilities',
      '1.0.0'
    );
    
    // Create the vision agent with the provided configuration
    this.visionAgent = new VisionAgent(config?.visionModel || 'nemotron-vision');
  }

  /**
   * Execute the vision agent tool
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
        case 'processImage':
          result = await this.handleProcessImage(params);
          break;
          
        case 'analyzeScreenshot':
          result = await this.handleAnalyzeScreenshot(params);
          break;
          
        case 'recognizeUIElements':
          result = await this.handleRecognizeUIElements(params);
          break;
          
        case 'generateCodeFromDesign':
          result = await this.handleGenerateCodeFromDesign(params);
          break;
          
        case 'generateImage':
          result = await this.handleGenerateImage(params);
          break;
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            executionTime: 0
          };
      }
      
      const executionTime = Date.now() - startTime;
      
      // For vision tools, we don't have a specific event to publish as they already publish their own events
      // The vision agent methods already publish events through MultimodalEventPublisher
      // So we just return the result
      
      return {
        success: true,
        output: result,
        executionTime
      };
    } catch (error) {
      // For vision tools, we don't have a specific error event to publish
      // The vision agent methods already publish error events through MultimodalEventPublisher
      // So we just return the error
      
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
   * Handle image processing
   * @param params Parameters for image processing
   * @returns Processing result
   */
  private async handleProcessImage(params: Record<string, any>): Promise<any> {
    if (!params.imageData) {
      throw new Error('Image data is required for processing');
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
    
    return await this.visionAgent.processImage(imageBuffer);
  }

  /**
   * Handle screenshot analysis
   * @param params Parameters for screenshot analysis
   * @returns Analysis result
   */
  private async handleAnalyzeScreenshot(params: Record<string, any>): Promise<any> {
    if (!params.imageData) {
      throw new Error('Image data is required for screenshot analysis');
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
    
    return await this.visionAgent.analyzeScreenshot(imageBuffer);
  }

  /**
   * Handle UI element recognition
   * @param params Parameters for UI element recognition
   * @returns Recognition result
   */
  private async handleRecognizeUIElements(params: Record<string, any>): Promise<any> {
    if (!params.imageData) {
      throw new Error('Image data is required for UI element recognition');
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
    
    return await this.visionAgent.recognizeUIElements(imageBuffer);
  }

  /**
   * Handle code generation from design
   * @param params Parameters for code generation
   * @returns Generated code
   */
  private async handleGenerateCodeFromDesign(params: Record<string, any>): Promise<any> {
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
    
    const framework = params.framework || 'react';
    return await this.visionAgent.generateCodeFromDesign(imageBuffer, framework);
  }

  /**
   * Handle image generation
   * @param params Parameters for image generation
   * @returns Generated image data
   */
  private async handleGenerateImage(params: Record<string, any>): Promise<any> {
    if (!params.description) {
      throw new Error('Description is required for image generation');
    }
    
    return await this.visionAgent.generateImage(params.description);
  }
}