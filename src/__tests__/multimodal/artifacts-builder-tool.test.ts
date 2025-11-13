// Tests for Artifacts Builder Tool implementation

import { ArtifactsBuilderTool } from '../../multimodal/artifacts-builder-tool';
import { AgentToolExecutionContext } from '../../core/types/agent-types';
import { MultimodalConfig } from '../../multimodal/types';

describe('ArtifactsBuilderTool', () => {
  let artifactsBuilderTool: ArtifactsBuilderTool;
  
  beforeEach(() => {
    // Create a minimal config for testing
    const config: MultimodalConfig = {
      visionModel: 'nemotron-vision'
    };
    
    artifactsBuilderTool = new ArtifactsBuilderTool(config);
  });
  
  describe('Tool Registration and Properties', () => {
    it('should have correct tool properties', () => {
      expect(artifactsBuilderTool.name).toBe('artifacts-builder');
      expect(artifactsBuilderTool.category).toBe('multimodal');
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
        context: {}
      };
      
      // Mock the artifacts builder generateReactCodeFromDesign method
      const mockGenerateReactCodeFromDesign = jest.spyOn(artifactsBuilderTool as any, 'handleGenerateReactCodeFromDesign')
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
        context: {}
      };
      
      // Mock the artifacts builder generateReactCodeFromDesign method
      const mockGenerateReactCodeFromDesign = jest.spyOn(artifactsBuilderTool as any, 'handleGenerateReactCodeFromDesign')
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
      };
      
      await artifactsBuilderTool.execute(createContext);
      
      // Verify it exists
      const getBeforeContext: AgentToolExecutionContext = {
        toolName: 'artifacts-builder',
        parameters: {
          action: 'getTemplate',
          id: 'delete-test'
        },
        context: {}
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
        context: {}
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
        context: {}
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
        context: {}
      };
      
      const result = await artifactsBuilderTool.execute(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action: unknownAction');
    });
  });
});