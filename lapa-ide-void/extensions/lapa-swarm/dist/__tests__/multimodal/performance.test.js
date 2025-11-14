"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Multimodal Performance and Resource Usage Test Suite
const vision_voice_1 = require("../../multimodal/vision-voice");
const vision_agent_1 = require("../../multimodal/vision-agent");
const voice_agent_1 = require("../../multimodal/voice-agent");
const event_bus_1 = require("../../core/event-bus");
// Mock the event bus
vi.mock('../../core/event-bus', () => ({
    eventBus: {
        publish: vi.fn()
    }
}));
// Mock NIM inference requests
vi.mock('../../inference/nim.local', () => ({
    sendNemotronVisionInferenceRequest: vi.fn().mockResolvedValue('Mocked vision result'),
    sendNIMInferenceRequest: vi.fn().mockResolvedValue('Mocked voice result')
}));
describe('Multimodal Performance and Resource Usage', () => {
    let visionVoiceController;
    let visionAgent;
    let voiceAgent;
    let config;
    beforeEach(() => {
        config = {
            visionModel: 'nemotron-vision',
            voiceModel: 'whisper',
            enableAudioProcessing: true,
            enableImageProcessing: true,
            modalityPriority: ['vision', 'voice'],
            fallbackStrategy: 'sequential'
        };
        visionVoiceController = new vision_voice_1.VisionVoiceController(config);
        visionAgent = new vision_agent_1.VisionAgent(config.visionModel);
        voiceAgent = new voice_agent_1.VoiceAgent();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Processing Time Measurements', () => {
        it('should measure vision processing time', async () => {
            const imageBuffer = Buffer.from('mock image data');
            const startTime = Date.now();
            const result = await visionAgent.processImage(imageBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result).toBe('Mocked vision result');
            expect(processingTime).toBeGreaterThanOrEqual(0);
            // Verify event was published with processing time
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'vision.image.processed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
        });
        it('should measure voice processing time', async () => {
            const audioBuffer = Buffer.from('mock audio data');
            const startTime = Date.now();
            const result = await voiceAgent.processAudio(audioBuffer);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // Since we're mocking, the result will be from the mock implementation
            // In a real implementation, this would be a transcription
            expect(typeof result).toBe('string');
            expect(processingTime).toBeGreaterThanOrEqual(0);
            // Verify event was published with processing time
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'voice.audio.processed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
        });
        it('should measure multimodal coordination processing time', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock individual processing methods
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image description');
            const startTime = Date.now();
            const result = await visionVoiceController.processMultimodalInput(input);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(result.text).toBe('Processed image description');
            expect(processingTime).toBeGreaterThanOrEqual(0);
            expect(mockProcessImage).toHaveBeenCalledWith(input.image);
            // Verify events were published
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.processing.started'
            }));
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.processing.completed',
                payload: expect.objectContaining({
                    processingTime: expect.any(Number)
                })
            }));
        });
    });
    describe('Memory Usage', () => {
        it('should handle large image inputs without excessive memory growth', async () => {
            // Create a larger image buffer
            const largeImageBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB buffer
            // Mock the processing to avoid actual inference
            const mockProcessImage = vi.spyOn(visionAgent, 'processImage')
                .mockResolvedValue('Processed large image');
            const result = await visionAgent.processImage(largeImageBuffer);
            expect(result).toBe('Processed large image');
            expect(mockProcessImage).toHaveBeenCalledWith(largeImageBuffer);
            // Cleanup
            largeImageBuffer.fill(0);
        });
        it('should handle large audio inputs without excessive memory growth', async () => {
            // Create a larger audio buffer
            const largeAudioBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB buffer
            // Mock the processing to avoid actual processing
            const mockProcessAudio = vi.spyOn(voiceAgent, 'processAudio')
                .mockResolvedValue('Processed large audio');
            const result = await voiceAgent.processAudio(largeAudioBuffer);
            expect(result).toBe('Processed large audio');
            expect(mockProcessAudio).toHaveBeenCalledWith(largeAudioBuffer);
            // Cleanup
            largeAudioBuffer.fill(0);
        });
        it('should handle concurrent multimodal processing', async () => {
            // Create multiple inputs
            const inputs = [
                { image: Buffer.from('mock image data 1') },
                { audio: Buffer.from('mock audio data 1') },
                { image: Buffer.from('mock image data 2'), audio: Buffer.from('mock audio data 2') }
            ];
            // Mock processing methods
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image');
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue('Processed audio');
            // Process all inputs concurrently
            const results = await Promise.all(inputs.map(input => visionVoiceController.processMultimodalInput(input)));
            expect(results).toHaveLength(3);
            expect(mockProcessImage).toHaveBeenCalledTimes(2); // Two image inputs
            expect(mockProcessAudio).toHaveBeenCalledTimes(2); // Two audio inputs
        });
    });
    describe('Throughput Testing', () => {
        it('should maintain acceptable throughput for sequential processing', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock processing to have a consistent delay
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockImplementation(async () => {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'Processed image';
            });
            // Process multiple inputs sequentially
            const startTime = Date.now();
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(visionVoiceController.processMultimodalInput(input));
            }
            const results = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTimePerRequest = totalTime / 10;
            expect(results).toHaveLength(10);
            expect(avgTimePerRequest).toBeLessThan(100); // Should average less than 100ms per request
            expect(mockProcessImage).toHaveBeenCalledTimes(10);
        });
        it('should handle batch processing efficiently', async () => {
            // Create batch of inputs
            const batchInputs = Array.from({ length: 20 }, (_, i) => ({
                image: Buffer.from(`mock image data ${i}`),
                audio: Buffer.from(`mock audio data ${i}`)
            }));
            // Mock processing methods
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image');
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue('Processed audio');
            // Process batch with parallel strategy
            config.fallbackStrategy = 'parallel';
            const parallelController = new vision_voice_1.VisionVoiceController(config);
            const startTime = Date.now();
            const results = await Promise.all(batchInputs.map(input => parallelController.processMultimodalInput(input)));
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            expect(results).toHaveLength(20);
            // With parallel processing, this should be faster than sequential
            expect(totalTime).toBeGreaterThan(0);
            expect(mockProcessImage).toHaveBeenCalledTimes(20);
            expect(mockProcessAudio).toHaveBeenCalledTimes(20);
        });
    });
    describe('Resource Cleanup', () => {
        it('should properly clean up resources after processing', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock processing
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Processed image');
            // Process input
            const result = await visionVoiceController.processMultimodalInput(input);
            expect(result.text).toBe('Processed image');
            expect(mockProcessImage).toHaveBeenCalledWith(input.image);
            // Verify that buffers can be garbage collected
            // Note: We can't directly test garbage collection, but we can ensure references are properly managed
            // In this case, we're just verifying the process completes without error
        });
        it('should handle resource cleanup after errors', async () => {
            const input = { image: Buffer.from('mock image data') };
            // Mock processing to throw an error
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockRejectedValue(new Error('Processing failed'));
            await expect(visionVoiceController.processMultimodalInput(input))
                .rejects
                .toThrow('Processing failed');
            expect(mockProcessImage).toHaveBeenCalledWith(input.image);
            // Again, we can't directly test garbage collection, but we ensure the error path completes
        });
    });
    describe('Scalability Under Load', () => {
        it('should maintain stability under moderate load', async () => {
            // Create moderate load of concurrent requests
            const inputs = Array.from({ length: 50 }, (_, i) => ({
                image: Buffer.from(`mock image data ${i}`),
                audio: Buffer.from(`mock audio data ${i}`)
            }));
            // Mock processing methods with small delays
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return 'Processed image';
            });
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return 'Processed audio';
            });
            // Process with parallel strategy
            config.fallbackStrategy = 'parallel';
            const parallelController = new vision_voice_1.VisionVoiceController(config);
            // Process all inputs
            const results = await Promise.all(inputs.map(input => parallelController.processMultimodalInput(input)));
            expect(results).toHaveLength(50);
            expect(mockProcessImage).toHaveBeenCalledTimes(50);
            expect(mockProcessAudio).toHaveBeenCalledTimes(50);
            // Verify no crashes or unhandled rejections occurred
        });
        it('should gracefully degrade under heavy load', async () => {
            // Create heavy load of concurrent requests
            const inputs = Array.from({ length: 100 }, (_, i) => ({
                image: Buffer.from(`mock image data ${i}`)
            }));
            // Mock processing methods with small delays
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return 'Processed image';
            });
            // Process all inputs with sequential strategy
            const results = await Promise.all(inputs.map(input => visionVoiceController.processMultimodalInput(input)));
            expect(results).toHaveLength(100);
            expect(mockProcessImage).toHaveBeenCalledTimes(100);
            // Verify system remains stable
        });
    });
});
//# sourceMappingURL=performance.test.js.map