// Tests for Artifacts Builder Tool implementation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtifactsBuilderTool } from '../../multimodal/artifacts-builder-tool.ts';
import { AgentToolExecutionContext } from '../../core/types/agent-types.ts';
import { MultimodalConfig } from '../../multimodal/types/index.ts';

describe('ArtifactsBuilderTool', () => {
  let artifactsBuilderTool: ArtifactsBuilderTool;
  
  beforeEach(() => {
    // Create a complete config for testing
    const config: MultimodalConfig = {
      visionModel: 'nemotron-vision',
      voiceModel: 'whisper',
      enableAudioProcessing: true,
      enableImageProcessing: true,
      modalityPriority: ['vision', 'voice'],
      fallbackStrategy: 'sequential'
    };
    
    artifactsBuilderTool = new ArtifactsBuilderTool(config);
  });
  
  describe('Tool Registration and Properties', () => {
    it('should have correct tool properties', () => {
      expect(artifactsBuilderTool.name).toBe('artifacts-builder');
      expect(artifactsBuilderTool.type).toBe('code-generation');
      expect(artifactsBuilderTool.version).toBe('1.0.0');
      expect(artifactsBuilderTool.description).toBe('Specialized artifacts builder for React/Tailwind HTML generation');
    });
  });
  
  describe('Parameter Validation', () => {
    it('should validate parameters correctly', () => {
      expect(artifactsBuilderTool.validateParameters({ action: 'generateReactCodeFromDesign' })).toBe(true);
      expect(artifactsBuilderTool.validateParameters({ action: '' })).toBe(false);
      expect(artifactsBuilderTool.validateParameters({})).toBe(false);
      expect(artifactsBuilderTool.validateParameters({ action: 123 })).toBe(false);
    });
  });
  
  describe('Tool Execution', () => {
    it('should handle generateReactCodeFromDesign action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'generateReactCodeFromDesign',
          imageData: 'base64imageString',
          componentName: 'TestComponent'
        },
        context: {},
        taskId: 'test-task-1',
        agentId: 'test-agent-1'
      };
      
      // Mock the artifacts builder generateReactCodeFromDesign method
      const mockGenerateReactCodeFromDesign = vi.spyOn(artifactsBuilderTool as any, 'handleGenerateReactCodeFromDesign')
        .mockResolvedValue('<div>Generated React code</div>');
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('<div>Generated React code</div>');
      expect(mockGenerateReactCodeFromDesign).toHaveBeenCalledWith({ 
        imageData: 'base64imageString', 
        componentName: 'TestComponent' 
      });
    });
    
    it('should handle generateReactCodeFromDesign action with default component name', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'generateReactCodeFromDesign',
          imageData: 'base64imageString'
          // No componentName specified, should work fine
        },
        context: {},
        taskId: 'test-task-2',
        agentId: 'test-agent-1'
      };
      
      // Mock the artifacts builder generateReactCodeFromDesign method
      const mockGenerateReactCodeFromDesign = vi.spyOn(artifactsBuilderTool as any, 'handleGenerateReactCodeFromDesign')
        .mockResolvedValue('<div>Generated React code</div>');
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toBe('<div>Generated React code</div>');
      expect(mockGenerateReactCodeFromDesign).toHaveBeenCalledWith({ imageData: 'base64imageString' });
    });
    
    it('should handle generateReactCodeFromDesign action without imageData', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'generateReactCodeFromDesign'
          // Missing imageData
        },
        context: {},
        taskId: 'test-task-3',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Image data is required for code generation');
    });
    
    it('should handle getTemplates action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplates'
        },
        context: {},
        taskId: 'test-task-4',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.output)).toBe(true);
    });
    
    it('should handle getTemplate action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'button-primary'
        },
        context: {},
        taskId: 'test-task-5',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.id).toBe('button-primary');
    });
    
    it('should handle createTemplate action', async () => {
      const newTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        framework: 'react' as const,
        styling: 'tailwind' as const,
        category: 'ui-component' as const,
        code: 'console.log("test");'
      };
      
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'createTemplate',
          template: newTemplate
        },
        context: {},
        taskId: 'test-task-6',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(true);
      
      // Verify the template was created
      const getContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'test-template'
        },
        context: {},
        taskId: 'test-task-7',
        agentId: 'test-agent-1'
      };
      
      const getResult = await artifactsBuilderTool.execute(getContext);
      expect(getResult.success).toBe(true);
      expect(getResult.output).toEqual(newTemplate);
    });
    
    it('should handle updateTemplate action', async () => {
      // First create a template
      const createContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'createTemplate',
          template: {
            id: 'update-test',
            name: 'Original Name',
            description: 'Original description',
            framework: 'react' as const,
            styling: 'tailwind' as const,
            category: 'ui-component' as const,
            code: 'console.log("original");'
          }
        },
        context: {},
        taskId: 'test-task-8',
        agentId: 'test-agent-1'
      };
      
      await artifactsBuilderTool.execute(createContext);
      
      // Now update it
      const updateContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'updateTemplate',
          id: 'update-test',
          template: {
            name: 'Updated Name'
          }
        },
        context: {},
        taskId: 'test-task-9',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(updateContext);
      expect(result.success).toBe(true);
      
      // Verify the template was updated
      const getContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'update-test'
        },
        context: {},
        taskId: 'test-task-10',
        agentId: 'test-agent-1'
      };
      
      const getResult = await artifactsBuilderTool.execute(getContext);
      expect(getResult.success).toBe(true);
      expect(getResult.output?.name).toBe('Updated Name');
      // Description should remain unchanged
      expect(getResult.output?.description).toBe('Original description');
    });
    
    it('should handle deleteTemplate action', async () => {
      // First create a template
      const createContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'createTemplate',
          template: {
            id: 'delete-test',
            name: 'Delete Test',
            description: 'Template to delete',
            framework: 'react' as const,
            styling: 'tailwind' as const,
            category: 'ui-component' as const,
            code: 'console.log("delete test");'
          }
        },
        context: {},
        taskId: 'test-task-11',
        agentId: 'test-agent-1'
      };
      
      await artifactsBuilderTool.execute(createContext);
      
      // Verify it exists
      const getBeforeContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'delete-test'
        },
        context: {},
        taskId: 'test-task-12',
        agentId: 'test-agent-1'
      };
      
      const getResultBefore = await artifactsBuilderTool.execute(getBeforeContext);
      expect(getResultBefore.success).toBe(true);
      expect(getResultBefore.output).toBeDefined();
      
      // Now delete it
      const deleteContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'deleteTemplate',
          id: 'delete-test'
        },
        context: {},
        taskId: 'test-task-13',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(deleteContext);
      expect(result.success).toBe(true);
      
      // Verify it was deleted
      const getAfterContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'delete-test'
        },
        context: {},
        taskId: 'test-task-14',
        agentId: 'test-agent-1'
      };
      
      const getResultAfter = await artifactsBuilderTool.execute(getAfterContext);
      expect(getResultAfter.success).toBe(true);
      expect(getResultAfter.output).toBeUndefined();
    });
    
    it('should handle unknown action', async () => {
      const context: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'unknownAction'
        },
        context: {},
        taskId: 'test-task-15',
        agentId: 'test-agent-1'
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action: unknownAction');
    });
  });
});