"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Vision Agent Tool Test Suite
const vision_agent_tool_ts_1 = require("../../multimodal/vision-agent-tool.ts");
describe('Vision Agent Tool', () => {
    let visionAgentTool;
    beforeEach(() => {
        visionAgentTool = new vision_agent_tool_ts_1.VisionAgentTool();
    });
    describe('Tool Registration and Properties', () => {
        it('should have correct tool properties', () => {
            expect(visionAgentTool.name).toBe('vision-agent');
            expect(visionAgentTool.type).toBe('code-generation');
            expect(visionAgentTool.version).toBe('1.0.0');
            expect(visionAgentTool.description).toBe('Advanced vision agent with image processing and UI analysis capabilities');
        });
    });
    describe('Parameter Validation', () => {
        it('should validate parameters correctly', () => {
            expect(visionAgentTool.validateParameters({ action: 'processImage' })).toBe(true);
            expect(visionAgentTool.validateParameters({ action: '' })).toBe(true); // Empty string is still a string
            expect(visionAgentTool.validateParameters({})).toBe(false);
            expect(visionAgentTool.validateParameters({ action: 123 })).toBe(true); // Non-string is still truthy
            expect(visionAgentTool.validateParameters({ otherParam: 'value' })).toBe(false);
        });
    });
    describe('Image Processing Actions', () => {
        it('should handle processImage action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: 'base64imageString'
                },
                context: {},
                taskId: 'test-task-1',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent processImage method
            const mockProcessImage = vi.spyOn(visionAgentTool, 'handleProcessImage')
                .mockResolvedValue('Processed image description');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toBe('Processed image description');
            expect(mockProcessImage).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
        it('should handle processImage action with buffer data', async () => {
            const imageBuffer = Buffer.from('mock image data');
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: imageBuffer
                },
                context: {},
                taskId: 'test-task-2',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent processImage method
            const mockProcessImage = vi.spyOn(visionAgentTool, 'handleProcessImage')
                .mockResolvedValue('Processed image description');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toBe('Processed image description');
            expect(mockProcessImage).toHaveBeenCalledWith({ imageData: imageBuffer });
        });
        it('should handle processImage action with invalid data format', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: 12345 // Invalid format
                },
                context: {},
                taskId: 'test-task-3',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid image data format');
        });
        it('should handle processImage action without imageData', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage'
                    // Missing imageData
                },
                context: {},
                taskId: 'test-task-4',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Image data is required for processing');
        });
    });
    describe('Screenshot Analysis Actions', () => {
        it('should handle analyzeScreenshot action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'analyzeScreenshot',
                    imageData: 'base64imageString'
                },
                context: {},
                taskId: 'test-task-5',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent analyzeScreenshot method
            const mockAnalyzeScreenshot = vi.spyOn(visionAgentTool, 'handleAnalyzeScreenshot')
                .mockResolvedValue({ description: 'UI screenshot analysis' });
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toEqual({ description: 'UI screenshot analysis' });
            expect(mockAnalyzeScreenshot).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
        it('should handle analyzeScreenshot action without imageData', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'analyzeScreenshot'
                    // Missing imageData
                },
                context: {},
                taskId: 'test-task-6',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Image data is required for screenshot analysis');
        });
    });
    describe('UI Element Recognition Actions', () => {
        it('should handle recognizeUIElements action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'recognizeUIElements',
                    imageData: 'base64imageString'
                },
                context: {},
                taskId: 'test-task-7',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent recognizeUIElements method
            const mockRecognizeUIElements = vi.spyOn(visionAgentTool, 'handleRecognizeUIElements')
                .mockResolvedValue([{ type: 'button', label: 'Submit' }]);
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toEqual([{ type: 'button', label: 'Submit' }]);
            expect(mockRecognizeUIElements).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
        it('should handle recognizeUIElements action without imageData', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'recognizeUIElements'
                    // Missing imageData
                },
                context: {},
                taskId: 'test-task-8',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Image data is required for UI element recognition');
        });
    });
    describe('Code Generation Actions', () => {
        it('should handle generateCodeFromDesign action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'generateCodeFromDesign',
                    imageData: 'base64imageString',
                    framework: 'react'
                },
                context: {},
                taskId: 'test-task-9',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent generateCodeFromDesign method
            const mockGenerateCodeFromDesign = vi.spyOn(visionAgentTool, 'handleGenerateCodeFromDesign')
                .mockResolvedValue('<div>Generated React code</div>');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toBe('<div>Generated React code</div>');
            expect(mockGenerateCodeFromDesign).toHaveBeenCalledWith({ imageData: 'base64imageString', framework: 'react' });
        });
        it('should handle generateCodeFromDesign action with default framework', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'generateCodeFromDesign',
                    imageData: 'base64imageString'
                    // No framework specified, should default to 'react'
                },
                context: {},
                taskId: 'test-task-10',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent generateCodeFromDesign method
            const mockGenerateCodeFromDesign = vi.spyOn(visionAgentTool, 'handleGenerateCodeFromDesign')
                .mockResolvedValue('<div>Generated React code</div>');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toBe('<div>Generated React code</div>');
            expect(mockGenerateCodeFromDesign).toHaveBeenCalledWith({ imageData: 'base64imageString', framework: 'react' });
        });
        it('should handle generateCodeFromDesign action without imageData', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'generateCodeFromDesign'
                    // Missing imageData
                },
                context: {},
                taskId: 'test-task-11',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Image data is required for code generation');
        });
    });
    describe('Image Generation Actions', () => {
        it('should handle generateImage action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'generateImage',
                    description: 'A red circle on a blue background'
                },
                context: {},
                taskId: 'test-task-12',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent generateImage method
            const mockGenerateImage = vi.spyOn(visionAgentTool, 'handleGenerateImage')
                .mockResolvedValue(Buffer.from('generated image data'));
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(true);
            expect(result.output).toEqual(Buffer.from('generated image data'));
            expect(mockGenerateImage).toHaveBeenCalledWith({ description: 'A red circle on a blue background' });
        });
        it('should handle generateImage action without description', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'generateImage'
                    // Missing description
                },
                context: {},
                taskId: 'test-task-13',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Description is required for image generation');
        });
    });
    describe('Error Handling', () => {
        it('should handle unknown action', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'unknownAction'
                },
                context: {},
                taskId: 'test-task-14',
                agentId: 'test-agent-1'
            };
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown action: unknownAction');
        });
        it('should handle execution errors', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: 'base64imageString'
                },
                context: {},
                taskId: 'test-task-15',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent processImage method to throw an error
            const mockProcessImage = vi.spyOn(visionAgentTool, 'handleProcessImage')
                .mockRejectedValue(new Error('Processing failed'));
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Processing failed');
            expect(mockProcessImage).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
        it('should handle non-Error exceptions', async () => {
            const context = {
                toolName: 'vision-agent',
                parameters: {
                    action: 'processImage',
                    imageData: 'base64imageString'
                },
                context: {},
                taskId: 'test-task-16',
                agentId: 'test-agent-1'
            };
            // Mock the vision agent processImage method to throw a non-Error
            const mockProcessImage = vi.spyOn(visionAgentTool, 'handleProcessImage')
                .mockRejectedValue('String error');
            const result = await visionAgentTool.execute(context);
            expect(result.success).toBe(false);
            expect(result.error).toBe('String error');
            expect(mockProcessImage).toHaveBeenCalledWith({ imageData: 'base64imageString' });
        });
    });
});
//# sourceMappingURL=vision-agent-tool.test.js.map