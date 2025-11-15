// Tests for Artifacts Builder implementation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtifactsBuilder } from '../../multimodal/artifacts-builder.ts';
import { MultimodalConfig } from '../../multimodal/types/index.ts';

describe('ArtifactsBuilder', () => {
  let artifactsBuilder: ArtifactsBuilder;
  
  beforeEach(() => {
    // Create a minimal config for testing
    const config: MultimodalConfig = {
      visionModel: 'nemotron-vision',
      voiceModel: 'whisper',
      enableAudioProcessing: true,
      enableImageProcessing: true,
      modalityPriority: ['vision', 'voice'],
      fallbackStrategy: 'sequential'
    };
    
    artifactsBuilder = new ArtifactsBuilder(config);
  });
  
  describe('Initialization', () => {
    it('should initialize with default templates', () => {
      const templates = artifactsBuilder.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // Check that we have templates for different categories
      const categories = templates.map(t => t.category);
      expect(categories).toContain('ui-component');
      expect(categories).toContain('layout');
    });
    
    it('should retrieve a template by ID', () => {
      const template = artifactsBuilder.getTemplate('button-primary');
      expect(template).toBeDefined();
      expect(template?.id).toBe('button-primary');
      expect(template?.name).toBe('Primary Button');
    });
  });
  
  describe('Template Management', () => {
    it('should create a new template', () => {
      const newTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        framework: 'react' as const,
        styling: 'tailwind' as const,
        category: 'ui-component' as const,
        code: 'console.log("test");'
      };
      
      artifactsBuilder.createTemplate(newTemplate);
      
      const retrieved = artifactsBuilder.getTemplate('test-template');
      expect(retrieved).toEqual(newTemplate);
    });
    
    it('should update an existing template', () => {
      const original = artifactsBuilder.getTemplate('button-primary');
      expect(original).toBeDefined();
      
      artifactsBuilder.updateTemplate('button-primary', {
        name: 'Updated Button'
      });
      
      const updated = artifactsBuilder.getTemplate('button-primary');
      expect(updated?.name).toBe('Updated Button');
      // Other properties should remain unchanged
      expect(updated?.description).toBe(original?.description);
    });
    
    it('should delete a template', () => {
      // First create a template to delete
      const newTemplate = {
        id: 'delete-test',
        name: 'Delete Test',
        description: 'Template to delete',
        framework: 'react' as const,
        styling: 'tailwind' as const,
        category: 'ui-component' as const,
        code: 'console.log("delete test");'
      };
      
      artifactsBuilder.createTemplate(newTemplate);
      expect(artifactsBuilder.getTemplate('delete-test')).toBeDefined();
      
      // Now delete it
      artifactsBuilder.deleteTemplate('delete-test');
      expect(artifactsBuilder.getTemplate('delete-test')).toBeUndefined();
    });
  });
  
  describe('Code Generation', () => {
    it('should generate React code from design', async () => {
      // Create a mock image buffer
      const imageBuffer = Buffer.from('mock image data');
      
      // Since we don't have access to the actual vision agent in tests,
      // we'll mock the generateCodeFromDesign method
      const mockCode = `
        import React from 'react';
        
        const MockComponent = () => {
          return <div>Hello World</div>;
        };
        
        export default MockComponent;
      `;
      
      // Mock the vision agent method
      vi.spyOn(artifactsBuilder as any, 'visionAgent', 'get').mockReturnValue({
        generateCodeFromDesign: vi.fn().mockResolvedValue(mockCode)
      });
      
      const result = await artifactsBuilder.generateReactCodeFromDesign(imageBuffer);
      expect(result).toContain('import React from \'react\'');
      expect(result).toContain('Hello World');
    });
    
    it('should add component name to generated code', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const mockCode = `
        import React from 'react';
        
        const Component = () => {
          return <div>Hello World</div>;
        };
        
        export default Component;
      `;
      
      // Mock the vision agent method
      vi.spyOn(artifactsBuilder as any, 'visionAgent', 'get').mockReturnValue({
        generateCodeFromDesign: vi.fn().mockResolvedValue(mockCode)
      });
      
      const result = await artifactsBuilder.generateReactCodeFromDesign(imageBuffer, {
        componentName: 'MyCustomComponent'
      });
      
      expect(result).toContain('const MyCustomComponent = () =>');
      expect(result).toContain('export default MyCustomComponent');
    });
    
    it('should add comments to generated code', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const mockCode = 'const Component = () => <div>Hello World</div>;';
      
      // Mock the vision agent method
      vi.spyOn(artifactsBuilder as any, 'visionAgent', 'get').mockReturnValue({
        generateCodeFromDesign: vi.fn().mockResolvedValue(mockCode)
      });
      
      const result = await artifactsBuilder.generateReactCodeFromDesign(imageBuffer);
      expect(result).toContain('// Generated by LAPA Artifacts Builder');
    });
  });
});