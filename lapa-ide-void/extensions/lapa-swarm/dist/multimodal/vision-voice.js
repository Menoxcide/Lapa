"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionVoiceController = void 0;
// Unified multimodal interface for vision and voice agents
const vision_agent_js_1 = require("./vision-agent.js");
const voice_agent_js_1 = require("./voice-agent.js");
const event_bus_js_1 = require("../core/event-bus.js");
class VisionVoiceController {
    visionAgent;
    voiceAgent;
    currentModality;
    config;
    context;
    modalityPriority;
    constructor(config) {
        this.config = config;
        this.currentModality = 'auto';
        this.context = new Map();
        this.modalityPriority = ['vision', 'voice']; // Default priority
        // Initialize vision agent
        this.visionAgent = new vision_agent_js_1.VisionAgent(this.config.visionModel);
        // Initialize voice agent with default config
        this.voiceAgent = new voice_agent_js_1.VoiceAgent();
    }
    setCurrentModality(modality) {
        const previousModality = this.currentModality;
        this.currentModality = modality;
        // Preserve context when switching modalities
        this.preserveContext(previousModality, modality);
        // Publish event
        event_bus_js_1.eventBus.publish({
            id: `modality.switched.${Date.now()}`,
            type: 'multimodal.modality.switched',
            timestamp: Date.now(),
            source: 'vision-voice-controller',
            payload: {
                from: previousModality,
                to: modality
            }
        });
    }
    setModalityPriority(priority) {
        this.modalityPriority = priority;
        // Publish event
        event_bus_js_1.eventBus.publish({
            id: `modality.priority.updated.${Date.now()}`,
            type: 'multimodal.modality.priority.updated',
            timestamp: Date.now(),
            source: 'vision-voice-controller',
            payload: {
                priority: priority
            }
        });
    }
    getModalityPriority() {
        return [...this.modalityPriority]; // Return a copy to prevent external modification
    }
    getProcessingOrder(input) {
        // If current modality is explicitly set, use that
        if (this.currentModality !== 'auto') {
            return [this.currentModality];
        }
        // Otherwise, use priority order
        return this.modalityPriority.filter(modality => {
            if (modality === 'vision')
                return !!input.imageData;
            if (modality === 'voice')
                return !!input.audioData;
            return false;
        });
    }
    getCurrentModality() {
        return this.currentModality;
    }
    async processMultimodalInput(input) {
        // Validate input
        if (!input.imageData && !input.audioData) {
            throw new Error('At least one modality (image or audio) must be provided');
        }
        // Publish event
        await event_bus_js_1.eventBus.publish({
            id: `multimodal.processing.${Date.now()}`,
            type: 'multimodal.processing.started',
            timestamp: Date.now(),
            source: 'vision-voice-controller',
            payload: {
                inputTypes: {
                    hasImage: !!input.imageData,
                    hasAudio: !!input.audioData
                },
                modality: this.currentModality
            }
        });
        try {
            const output = { text: '' };
            // Determine processing order based on priority
            const processingOrder = this.getProcessingOrder(input);
            // Process inputs according to priority with fallback strategy
            let processedSuccessfully = false;
            const fallbackStrategy = this.config.fallbackStrategy || 'sequential';
            if (fallbackStrategy === 'parallel') {
                // Process all modalities in parallel
                const promises = [];
                if (input.imageData) {
                    promises.push((async () => {
                        try {
                            const result = await this.visionAgent.processImage(input.imageData);
                            output.text += `\n[VISION] ${result}`;
                            output.imageData = input.imageData;
                            this.updateContext('vision', { lastImage: input.imageData, lastVisionOutput: result });
                            processedSuccessfully = true;
                        }
                        catch (error) {
                            console.error('Vision processing failed:', error);
                            // Don't throw, let other modalities try
                            // Publish error event
                            await event_bus_js_1.eventBus.publish({
                                id: `multimodal.vision.error.${Date.now()}`,
                                type: 'multimodal.vision.processing.error',
                                timestamp: Date.now(),
                                source: 'vision-voice-controller',
                                payload: {
                                    error: error instanceof Error ? error.message : String(error)
                                }
                            });
                        }
                    })());
                }
                if (input.audioData) {
                    promises.push((async () => {
                        try {
                            const result = await this.voiceAgent.processAudio(input.audioData);
                            output.text += `\n[AUDIO] ${result}`;
                            output.audioData = input.audioData;
                            this.updateContext('voice', { lastAudio: input.audioData, lastVoiceOutput: result });
                            processedSuccessfully = true;
                        }
                        catch (error) {
                            console.error('Voice processing failed:', error);
                            // Don't throw, let other modalities try
                            // Publish error event
                            await event_bus_js_1.eventBus.publish({
                                id: `multimodal.voice.error.${Date.now()}`,
                                type: 'multimodal.voice.processing.error',
                                timestamp: Date.now(),
                                source: 'vision-voice-controller',
                                payload: {
                                    error: error instanceof Error ? error.message : String(error)
                                }
                            });
                        }
                    })());
                }
                // Wait for all processing to complete
                await Promise.all(promises);
            }
            else {
                // Process inputs according to priority (sequential)
                for (const modality of processingOrder) {
                    try {
                        if (modality === 'vision' && input.imageData) {
                            // Process image with vision agent
                            output.text = await this.visionAgent.processImage(input.imageData);
                            output.imageData = input.imageData;
                            // Update context with vision processing results
                            this.updateContext('vision', { lastImage: input.imageData, lastVisionOutput: output.text });
                            processedSuccessfully = true;
                            // If sequential fallback is not enabled, break after first success
                            if (fallbackStrategy === 'none')
                                break;
                        }
                        else if (modality === 'voice' && input.audioData) {
                            // Process audio with voice agent
                            output.text = await this.voiceAgent.processAudio(input.audioData);
                            output.audioData = input.audioData;
                            // Update context with voice processing results
                            this.updateContext('voice', { lastAudio: input.audioData, lastVoiceOutput: output.text });
                            processedSuccessfully = true;
                            // If sequential fallback is not enabled, break after first success
                            if (fallbackStrategy === 'none')
                                break;
                        }
                    }
                    catch (error) {
                        console.error(`${modality} processing failed:`, error);
                        // Publish error event
                        await event_bus_js_1.eventBus.publish({
                            id: `multimodal.${modality}.error.${Date.now()}`,
                            type: `multimodal.${modality}.processing.error`,
                            timestamp: Date.now(),
                            source: 'vision-voice-controller',
                            payload: {
                                error: error instanceof Error ? error.message : String(error)
                            }
                        });
                        // Continue to next modality if fallback is enabled
                        if (fallbackStrategy === 'none') {
                            throw error;
                        }
                    }
                }
            }
            // If neither modality was processed successfully, fall back to simple text response
            if (!processedSuccessfully) {
                output.text = 'No input processed successfully';
                // Publish fallback event
                await event_bus_js_1.eventBus.publish({
                    id: `multimodal.fallback.${Date.now()}`,
                    type: 'multimodal.processing.fallback',
                    timestamp: Date.now(),
                    source: 'vision-voice-controller',
                    payload: {
                        reason: 'No modalities processed successfully'
                    }
                });
            }
            // Publish event
            await event_bus_js_1.eventBus.publish({
                id: `multimodal.processed.${Date.now()}`,
                type: 'multimodal.processing.completed',
                timestamp: Date.now(),
                source: 'vision-voice-controller',
                payload: {
                    outputLength: output.text.length,
                    modality: this.currentModality,
                    processingTime: Date.now() - event_bus_js_1.eventBus.lastEventTime // Approximate processing time
                }
            });
            return output;
        }
        catch (error) {
            // Publish error event
            await event_bus_js_1.eventBus.publish({
                id: `multimodal.error.${Date.now()}`,
                type: 'multimodal.processing.error',
                timestamp: Date.now(),
                source: 'vision-voice-controller',
                payload: {
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            throw error;
        }
    }
    preserveContext(fromModality, toModality) {
        // In a real implementation, this would preserve relevant context when switching modalities
        console.log(`Preserving context from ${fromModality} to ${toModality}`);
        // Publish event
        event_bus_js_1.eventBus.publish({
            id: `context.preserved.${Date.now()}`,
            type: 'multimodal.context.preserved',
            timestamp: Date.now(),
            source: 'vision-voice-controller',
            payload: {
                from: fromModality,
                to: toModality
            }
        });
    }
    updateContext(modality, data) {
        // Update context with new data from modality processing
        const existingData = this.context.get(modality) || {};
        this.context.set(modality, { ...existingData, ...data });
        // Also update global context
        const globalData = this.context.get('global') || {};
        this.context.set('global', { ...globalData, ...data });
        // Publish event
        event_bus_js_1.eventBus.publish({
            id: `context.updated.${Date.now()}`,
            type: 'multimodal.context.updated',
            timestamp: Date.now(),
            source: 'vision-voice-controller',
            payload: {
                modality: modality,
                data: data
            }
        });
    }
    getContext(modality) {
        if (modality) {
            return this.context.get(modality);
        }
        return Object.fromEntries(this.context);
    }
    // Vision agent methods
    async processImage(image) {
        return this.visionAgent.processImage(image);
    }
    async generateImage(description) {
        return this.visionAgent.generateImage(description);
    }
    async analyzeScreenshot(screenshot) {
        return this.visionAgent.analyzeScreenshot(screenshot);
    }
    async recognizeUIElements(image) {
        return this.visionAgent.recognizeUIElements(image);
    }
    async generateCodeFromDesign(image, framework) {
        return this.visionAgent.generateCodeFromDesign(image, framework);
    }
    // Voice agent methods
    async processAudio(audio) {
        return this.voiceAgent.processAudio(audio);
    }
    async generateAudio(text) {
        return this.voiceAgent.generateAudio(text);
    }
    async askQuestion(question) {
        return this.voiceAgent.askQuestion(question);
    }
    async executeVoiceCommand(command) {
        return this.voiceAgent.executeVoiceCommand(command);
    }
}
exports.VisionVoiceController = VisionVoiceController;
//# sourceMappingURL=vision-voice.js.map