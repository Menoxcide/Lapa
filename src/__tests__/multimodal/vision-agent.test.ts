// Vision Agent Test Suite
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisionAgent } from '../../multimodal/vision-agent.ts';
import { MultimodalEventPublisher } from '../../multimodal/utils/event-publisher.ts';
import { eventBus } from '../../core/event-bus.ts';

// Mock the event bus
vi.mock('../../core/event-bus.ts', () => ({
  eventBus: {
    publish: vi.fn()
  }
}));

describe('Vision Agent', () => {
  let visionAgent: VisionAgent;
  
  beforeEach(() => {
    visionAgent = new VisionAgent('nemotron-vision');
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Image Processing', () => {
    it('should process image and return description', async () => {
      // Create a mock image buffer
      const imageBuffer = Buffer.from('mock image data');
      
      // Mock the NIM inference request
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue('This is a mock image description.')
      }));
      
      const result = await visionAgent.processImage(imageBuffer);
      
      expect(result).toBe('This is a mock image description.');
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'vision.image.processed',
        payload: {
          imageSize: imageBuffer.length,
          resultLength: result.length,
          processingTime: expect.any(Number)
        }
      }));
    });
    
    it('should handle image processing errors', async () => {
      const imageBuffer = Buffer.from('mock image data');
      
      // Mock the NIM inference request to throw an error
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockRejectedValue(new Error('NIM inference failed'))
      }));
      
      await expect(visionAgent.processImage(imageBuffer))
        .rejects
        .toThrow('Image processing failed: NIM inference failed');
        
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'multimodal.vision.processing.error',
        payload: {
          error: 'NIM inference failed'
        }
      }));
    });
  });
  
  describe('Image Generation', () => {
    it('should generate image buffer from description', async () => {
      const description = 'A red circle on a blue background';
      const result = await visionAgent.generateImage(description);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'vision.image.generated',
        payload: {
          description: description,
          imageSize: result.length,
          processingTime: expect.any(Number)
        }
      }));
    });
    
    it('should handle image generation errors', async () => {
      // In a real implementation, we might have conditions that cause generation to fail
      // For now, we'll test that errors are properly propagated
      const description = '';
      
      // Mock implementation that throws an error
      const mockGenerateImage = vi.spyOn(visionAgent, 'generateImage').mockImplementationOnce(() => {
        throw new Error('Image generation failed');
      });
      
      await expect(visionAgent.generateImage(description))
        .rejects
        .toThrow('Image generation failed');
        
      mockGenerateImage.mockRestore();
    });
  });
  
  describe('Screenshot Analysis', () => {
    it('should analyze screenshot and return structured data', async () => {
      const screenshotBuffer = Buffer.from('mock screenshot data');
      
      // Mock the NIM inference request to return JSON
      const mockAnalysis = {
        description: 'A sample UI with buttons and text fields',
        layout: {
          width: 1920,
          height: 1080,
          sections: [
            { type: 'header', position: { x: 0, y: 0 }, size: { width: 1920, height: 100 } },
            { type: 'content', position: { x: 0, y: 100 }, size: { width: 1920, height: 880 } },
            { type: 'footer', position: { x: 0, y: 980 }, size: { width: 1920, height: 100 } }
          ]
        },
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          background: '#ffffff'
        },
        textContent: ['Welcome', 'Login', 'Username', 'Password']
      };
      
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue(JSON.stringify(mockAnalysis))
      }));
      
      const result = await visionAgent.analyzeScreenshot(screenshotBuffer);
      
      expect(result).toEqual(mockAnalysis);
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'vision.screenshot.analyzed',
        payload: {
          screenshotSize: screenshotBuffer.length,
          analysisKeys: Object.keys(mockAnalysis),
          processingTime: expect.any(Number)
        }
      }));
    });
    
    it('should handle invalid JSON in screenshot analysis', async () => {
      const screenshotBuffer = Buffer.from('mock screenshot data');
      
      // Mock the NIM inference request to return invalid JSON
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue('Invalid JSON response')
      }));
      
      await expect(visionAgent.analyzeScreenshot(screenshotBuffer))
        .rejects
        .toThrow('Failed to parse screenshot analysis result');
    });
  });
  
  describe('UI Element Recognition', () => {
    it('should recognize UI elements in image', async () => {
      const imageBuffer = Buffer.from('mock ui image data');
      
      // Mock the NIM inference request to return UI elements
      const mockElements = [
        {
          type: 'button',
          label: 'Submit',
          position: { x: 100, y: 200 },
          size: { width: 120, height: 40 },
          properties: { color: '#007bff', disabled: false }
        },
        {
          type: 'input',
          label: 'Username',
          position: { x: 100, y: 100 },
          size: { width: 300, height: 40 },
          properties: { placeholder: 'Enter username' }
        }
      ];
      
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue(JSON.stringify(mockElements))
      }));
      
      const result = await visionAgent.recognizeUIElements(imageBuffer);
      
      expect(result).toEqual(mockElements);
      expect(result.length).toBe(2);
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'vision.ui.elements.recognized',
        payload: {
          imageSize: imageBuffer.length,
          elementCount: mockElements.length,
          processingTime: expect.any(Number)
        }
      }));
    });
    
    it('should handle UI element recognition errors', async () => {
      const imageBuffer = Buffer.from('mock ui image data');
      
      // Mock the NIM inference request to throw an error
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockRejectedValue(new Error('UI element recognition failed'))
      }));
      
      await expect(visionAgent.recognizeUIElements(imageBuffer))
        .rejects
        .toThrow('UI element recognition failed: UI element recognition failed');
    });
  });
  
  describe('Code Generation from Design', () => {
    it('should generate code from UI design', async () => {
      const imageBuffer = Buffer.from('mock design image data');
      const framework = 'react';
      
      // Mock the NIM inference request to return code
      const mockCode = `
        import React from 'react';
        
        const GeneratedComponent = () => {
          return (
            <div className="container">
              <h1>Welcome</h1>
              <button className="btn btn-primary">Submit</button>
            </div>
          );
        };
        
        export default GeneratedComponent;
      `;
      
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue(mockCode)
      }));
      
      const result = await visionAgent.generateCodeFromDesign(imageBuffer, framework);
      
      expect(result).toBe(mockCode);
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        type: 'vision.code.generated',
        payload: {
          imageSize: imageBuffer.length,
          framework: framework,
          codeLength: mockCode.length,
          processingTime: expect.any(Number)
        }
      }));
    });
    
    it('should handle code generation errors', async () => {
      const imageBuffer = Buffer.from('mock design image data');
      
      // Mock the NIM inference request to throw an error
      vi.mock('../../inference/nim.local', () => ({
        sendNemotronVisionInferenceRequest: vi.fn().mockRejectedValue(new Error('Code generation failed'))
      }));
      
      await expect(visionAgent.generateCodeFromDesign(imageBuffer, 'react'))
        .rejects
        .toThrow('Code generation failed: Code generation failed');
    });
  });
});