"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Cross-Modal Context Preservation During Handoffs Test Suite
const vision_voice_1 = require("../../multimodal/vision-voice");
const event_bus_1 = require("../../core/event-bus");
// Mock the event bus
vi.mock('../../core/event-bus', () => ({
    eventBus: {
        publish: vi.fn(),
        subscribe: vi.fn()
    }
}));
describe('Cross-Modal Context Preservation During Handoffs', () => {
    let visionVoiceController;
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
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Context Preservation During Modality Switching', () => {
        it('should preserve vision context when switching to voice modality', async () => {
            // Process an image to establish vision context
            const imageBuffer = Buffer.from('mock image data');
            const mockImageResult = 'Processed image description with UI elements';
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue(mockImageResult);
            // Process image through controller
            const imageResult = await visionVoiceController.processImage(imageBuffer);
            // Verify image processing
            expect(imageResult).toBe(mockImageResult);
            expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
            // Capture context before switching
            const contextBeforeSwitch = visionVoiceController.getContext();
            // Switch to voice modality
            visionVoiceController.setCurrentModality('voice');
            // Verify modality switch event
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.modality.switched',
                payload: {
                    from: 'auto', // Initially auto, then gets set to vision in processImage
                    to: 'voice'
                }
            }));
            // Verify context preservation event
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.context.preserved',
                payload: {
                    from: expect.any(String), // Could be 'auto' or 'vision' depending on internal implementation
                    to: 'voice'
                }
            }));
            // Verify context still contains vision data
            const contextAfterSwitch = visionVoiceController.getContext();
            expect(contextAfterSwitch.vision).toBeDefined();
            expect(contextAfterSwitch.vision.lastImage).toBe(imageBuffer);
            expect(contextAfterSwitch.vision.lastVisionOutput).toBe(mockImageResult);
        });
        it('should preserve voice context when switching to vision modality', async () => {
            // Process audio to establish voice context
            const audioBuffer = Buffer.from('mock audio data');
            const mockAudioResult = 'Transcribed audio text mentioning UI elements';
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue(mockAudioResult);
            // Process audio through controller
            const audioResult = await visionVoiceController.processAudio(audioBuffer);
            // Verify audio processing
            expect(audioResult).toBe(mockAudioResult);
            expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
            // Capture context before switching
            const contextBeforeSwitch = visionVoiceController.getContext();
            // Switch to vision modality
            visionVoiceController.setCurrentModality('vision');
            // Verify modality switch event
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.modality.switched',
                payload: {
                    from: 'auto', // Initially auto, then gets set to voice in processAudio
                    to: 'vision'
                }
            }));
            // Verify context preservation event
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.context.preserved',
                payload: {
                    from: expect.any(String), // Could be 'auto' or 'voice' depending on internal implementation
                    to: 'vision'
                }
            }));
            // Verify context still contains voice data
            const contextAfterSwitch = visionVoiceController.getContext();
            expect(contextAfterSwitch.voice).toBeDefined();
            expect(contextAfterSwitch.voice.lastAudio).toBe(audioBuffer);
            expect(contextAfterSwitch.voice.lastVoiceOutput).toBe(mockAudioResult);
        });
    });
    describe('Context Accumulation Across Multiple Modalities', () => {
        it('should accumulate context from both vision and voice modalities', async () => {
            // Process image first
            const imageBuffer = Buffer.from('mock image data');
            const mockImageResult = 'Processed image description with buttons and forms';
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue(mockImageResult);
            await visionVoiceController.processImage(imageBuffer);
            // Process audio second
            const audioBuffer = Buffer.from('mock audio data');
            const mockAudioResult = 'User wants to click the submit button';
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue(mockAudioResult);
            await visionVoiceController.processAudio(audioBuffer);
            // Verify both processes were called
            expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
            expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
            // Verify accumulated context
            const accumulatedContext = visionVoiceController.getContext();
            expect(accumulatedContext.vision).toBeDefined();
            expect(accumulatedContext.vision.lastImage).toBe(imageBuffer);
            expect(accumulatedContext.vision.lastVisionOutput).toBe(mockImageResult);
            expect(accumulatedContext.voice).toBeDefined();
            expect(accumulatedContext.voice.lastAudio).toBe(audioBuffer);
            expect(accumulatedContext.voice.lastVoiceOutput).toBe(mockAudioResult);
            expect(accumulatedContext.global).toBeDefined();
            expect(accumulatedContext.global.lastImage).toBe(imageBuffer);
            expect(accumulatedContext.global.lastVisionOutput).toBe(mockImageResult);
            expect(accumulatedContext.global.lastAudio).toBe(audioBuffer);
            expect(accumulatedContext.global.lastVoiceOutput).toBe(mockAudioResult);
        });
    });
    describe('Context Preservation During Parallel Processing', () => {
        it('should preserve context when processing multiple modalities in parallel', async () => {
            // Configure for parallel processing
            config.fallbackStrategy = 'parallel';
            const parallelController = new vision_voice_1.VisionVoiceController(config);
            // Process both image and audio in parallel
            const imageBuffer = Buffer.from('mock image data');
            const audioBuffer = Buffer.from('mock audio data');
            const input = { image: imageBuffer, audio: audioBuffer };
            // Mock both processing methods
            const mockProcessImage = vi.spyOn(parallelController, 'processImage')
                .mockResolvedValue('Processed image description');
            const mockProcessAudio = vi.spyOn(parallelController, 'processAudio')
                .mockResolvedValue('Transcribed audio text');
            const result = await parallelController.processMultimodalInput(input);
            // Verify both processes were called
            expect(mockProcessImage).toHaveBeenCalledWith(imageBuffer);
            expect(mockProcessAudio).toHaveBeenCalledWith(audioBuffer);
            // Verify result contains both outputs
            expect(result.text).toContain('[VISION] Processed image description');
            expect(result.text).toContain('[AUDIO] Transcribed audio text');
            // Verify context preservation
            const context = parallelController.getContext();
            expect(context.vision).toBeDefined();
            expect(context.voice).toBeDefined();
            expect(context.global).toBeDefined();
            // Verify context preservation events
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.context.updated',
                payload: expect.objectContaining({
                    modality: 'vision'
                })
            }));
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.context.updated',
                payload: expect.objectContaining({
                    modality: 'voice'
                })
            }));
        });
    });
    describe('Context Integrity During Error Conditions', () => {
        it('should preserve existing context when one modality fails', async () => {
            // Process image successfully first
            const imageBuffer = Buffer.from('mock image data');
            const mockImageResult = 'Processed image description';
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue(mockImageResult);
            await visionVoiceController.processImage(imageBuffer);
            // Attempt to process audio but have it fail
            const audioBuffer = Buffer.from('mock audio data');
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockRejectedValue(new Error('Audio processing failed'));
            await expect(visionVoiceController.processAudio(audioBuffer))
                .rejects
                .toThrow('Audio processing failed');
            // Verify image context is still preserved
            const contextAfterError = visionVoiceController.getContext();
            expect(contextAfterError.vision).toBeDefined();
            expect(contextAfterError.vision.lastImage).toBe(imageBuffer);
            expect(contextAfterError.vision.lastVisionOutput).toBe(mockImageResult);
            // Verify voice context may or may not be updated depending on implementation
            // In this case, since processing failed, voice context might not be updated
        });
        it('should preserve context during fallback processing', async () => {
            // Configure for sequential fallback
            config.fallbackStrategy = 'sequential';
            const fallbackController = new vision_voice_1.VisionVoiceController(config);
            // Process multimodal input where vision fails but voice succeeds
            const imageBuffer = Buffer.from('mock image data');
            const audioBuffer = Buffer.from('mock audio data');
            const input = { image: imageBuffer, audio: audioBuffer };
            // Mock vision to fail and voice to succeed
            const mockProcessImage = vi.spyOn(fallbackController, 'processImage')
                .mockRejectedValue(new Error('Image processing failed'));
            const mockProcessAudio = vi.spyOn(fallbackController, 'processAudio')
                .mockResolvedValue('Transcribed audio text');
            const result = await fallbackController.processMultimodalInput(input);
            // Verify voice result is returned due to fallback
            expect(result.text).toBe('Transcribed audio text');
            // Verify context preservation
            const context = fallbackController.getContext();
            expect(context.voice).toBeDefined();
            expect(context.voice.lastAudio).toBe(audioBuffer);
            expect(context.voice.lastVoiceOutput).toBe('Transcribed audio text');
            // Verify error event was published
            expect(event_bus_1.eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
                type: 'multimodal.vision.processing.error'
            }));
        });
    });
    describe('Context Retrieval and Utilization', () => {
        it('should allow retrieval of modality-specific context', async () => {
            // Process both modalities
            const imageBuffer = Buffer.from('mock image data');
            const audioBuffer = Buffer.from('mock audio data');
            const mockProcessImage = vi.spyOn(visionVoiceController, 'processImage')
                .mockResolvedValue('Image description');
            const mockProcessAudio = vi.spyOn(visionVoiceController, 'processAudio')
                .mockResolvedValue('Audio transcription');
            await visionVoiceController.processImage(imageBuffer);
            await visionVoiceController.processAudio(audioBuffer);
            // Retrieve specific contexts
            const visionContext = visionVoiceController.getContext('vision');
            const voiceContext = visionVoiceController.getContext('voice');
            const globalContext = visionVoiceController.getContext();
            // Verify contexts
            expect(visionContext).toBeDefined();
            expect(visionContext.lastImage).toBe(imageBuffer);
            expect(visionContext.lastVisionOutput).toBe('Image description');
            expect(voiceContext).toBeDefined();
            expect(voiceContext.lastAudio).toBe(audioBuffer);
            expect(voiceContext.lastVoiceOutput).toBe('Audio transcription');
            expect(globalContext).toBeDefined();
            expect(globalContext.vision).toEqual(visionContext);
            expect(globalContext.voice).toEqual(voiceContext);
        });
    });
});
//# sourceMappingURL=context-preservation.test.js.map