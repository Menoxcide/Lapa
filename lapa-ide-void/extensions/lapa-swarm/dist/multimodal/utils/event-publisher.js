"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultimodalEventPublisher = void 0;
// Utility functions for publishing multimodal events
const event_bus_js_1 = require("../../core/event-bus.js");
class MultimodalEventPublisher {
    /**
     * Publishes a vision image processed event
     * @param source Source of the event
     * @param imageSize Size of the image in bytes
     * @param resultLength Length of the result
     * @param processingTime Optional processing time in ms
     */
    static async publishVisionImageProcessed(source, imageSize, resultLength, processingTime) {
        const event = {
            id: this.generateEventId(),
            type: 'vision.image.processed',
            timestamp: Date.now(),
            source,
            payload: {
                imageSize,
                resultLength,
                processingTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a vision image generated event
     * @param source Source of the event
     * @param description Description of the image
     * @param imageSize Size of the generated image in bytes
     * @param processingTime Optional processing time in ms
     */
    static async publishVisionImageGenerated(source, description, imageSize, processingTime) {
        const event = {
            id: this.generateEventId(),
            type: 'vision.image.generated',
            timestamp: Date.now(),
            source,
            payload: {
                description,
                imageSize,
                processingTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a vision screenshot analyzed event
     * @param source Source of the event
     * @param screenshotSize Size of the screenshot in bytes
     * @param analysisKeys Keys in the analysis result
     * @param processingTime Optional processing time in ms
     */
    static async publishVisionScreenshotAnalyzed(source, screenshotSize, analysisKeys, processingTime) {
        const event = {
            id: this.generateEventId(),
            type: 'vision.screenshot.analyzed',
            timestamp: Date.now(),
            source,
            payload: {
                screenshotSize,
                analysisKeys,
                processingTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a vision UI elements recognized event
     * @param source Source of the event
     * @param imageSize Size of the image in bytes
     * @param elementCount Number of elements recognized
     * @param processingTime Optional processing time in ms
     */
    static async publishVisionUIElementsRecognized(source, imageSize, elementCount, processingTime) {
        const event = {
            id: this.generateEventId(),
            type: 'vision.ui.elements.recognized',
            timestamp: Date.now(),
            source,
            payload: {
                imageSize,
                elementCount,
                processingTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a vision code generated event
     * @param source Source of the event
     * @param imageSize Size of the input image in bytes
     * @param framework Framework used for code generation
     * @param codeLength Length of the generated code
     * @param processingTime Optional processing time in ms
     */
    static async publishVisionCodeGenerated(source, imageSize, framework, codeLength, processingTime) {
        const event = {
            id: this.generateEventId(),
            type: 'vision.code.generated',
            timestamp: Date.now(),
            source,
            payload: {
                imageSize,
                framework,
                codeLength,
                processingTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice audio processing event
     * @param source Source of the event
     * @param audioLength Length of the audio in bytes
     * @param format Optional audio format
     * @param processingStart Processing start timestamp
     */
    static async publishVoiceAudioProcessing(source, audioLength, format, processingStart) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.audio.processing',
            timestamp: Date.now(),
            source,
            payload: {
                audioLength,
                format,
                processingStart
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice audio processed event
     * @param source Source of the event
     * @param textLength Length of the transcribed text
     * @param processingTime Processing time in ms
     * @param processingEnd Processing end timestamp
     */
    static async publishVoiceAudioProcessed(source, textLength, processingTime, processingEnd) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.audio.processed',
            timestamp: Date.now(),
            source,
            payload: {
                textLength,
                processingTime,
                processingEnd
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice audio generating event
     * @param source Source of the event
     * @param textLength Length of the text to synthesize
     * @param generationStart Generation start timestamp
     */
    static async publishVoiceAudioGenerating(source, textLength, generationStart) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.audio.generating',
            timestamp: Date.now(),
            source,
            payload: {
                textLength,
                generationStart
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice audio generated event
     * @param source Source of the event
     * @param audioLength Length of the generated audio in bytes
     * @param duration Optional duration of the audio
     * @param processingTime Processing time in ms
     * @param generationEnd Generation end timestamp
     */
    static async publishVoiceAudioGenerated(source, audioLength, duration, processingTime, generationEnd) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.audio.generated',
            timestamp: Date.now(),
            source,
            payload: {
                audioLength,
                duration,
                processingTime,
                generationEnd
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice audio error event
     * @param source Source of the event
     * @param error Error message
     * @param audioLength Optional audio length
     * @param textLength Optional text length
     */
    static async publishVoiceAudioError(source, error, audioLength, textLength) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.audio.error',
            timestamp: Date.now(),
            source,
            payload: {
                error,
                audioLength,
                textLength
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice question asking event
     * @param source Source of the event
     * @param question Question being asked
     * @param context Optional context
     * @param processingStart Processing start timestamp
     */
    static async publishVoiceQuestionAsking(source, question, context, processingStart) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.question.asking',
            timestamp: Date.now(),
            source,
            payload: {
                question,
                context,
                processingStart
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice question answered event
     * @param source Source of the event
     * @param question Question that was asked
     * @param answer Answer to the question
     * @param processingTime Processing time in ms
     * @param processingEnd Processing end timestamp
     */
    static async publishVoiceQuestionAnswered(source, question, answer, processingTime, processingEnd) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.question.answered',
            timestamp: Date.now(),
            source,
            payload: {
                question,
                answer,
                processingTime,
                processingEnd
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice question error event
     * @param source Source of the event
     * @param error Error message
     * @param question Question that caused the error
     */
    static async publishVoiceQuestionError(source, error, question) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.question.error',
            timestamp: Date.now(),
            source,
            payload: {
                error,
                question
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice command executing event
     * @param source Source of the event
     * @param command Command being executed
     * @param intent Optional intent
     * @param entities Optional entities
     * @param confidence Optional confidence score
     * @param executionStart Execution start timestamp
     */
    static async publishVoiceCommandExecuting(source, command, intent, entities, confidence, executionStart) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.command.executing',
            timestamp: Date.now(),
            source,
            payload: {
                command,
                intent,
                entities,
                confidence,
                executionStart
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice command executed event
     * @param source Source of the event
     * @param command Command that was executed
     * @param intent Optional intent
     * @param entities Optional entities
     * @param result Result of the command execution
     * @param confidence Optional confidence score
     * @param processingTime Processing time in ms
     * @param executionEnd Execution end timestamp
     */
    static async publishVoiceCommandExecuted(source, command, intent, entities, result, confidence, processingTime, executionEnd) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.command.executed',
            timestamp: Date.now(),
            source,
            payload: {
                command,
                intent,
                entities,
                result,
                confidence,
                processingTime,
                executionEnd
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice command error event
     * @param source Source of the event
     * @param error Error message
     * @param command Command that caused the error
     */
    static async publishVoiceCommandError(source, error, command) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.command.error',
            timestamp: Date.now(),
            source,
            payload: {
                error,
                command
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice dictation started event
     * @param source Source of the event
     * @param startTime Start time timestamp
     */
    static async publishVoiceDictationStarted(source, startTime) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.dictation.started',
            timestamp: Date.now(),
            source,
            payload: {
                startTime
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice dictation completed event
     * @param source Source of the event
     * @param text Dictated text
     * @param duration Duration of dictation in ms
     * @param audioLength Length of the audio in bytes
     */
    static async publishVoiceDictationCompleted(source, text, duration, audioLength) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.dictation.completed',
            timestamp: Date.now(),
            source,
            payload: {
                text,
                duration,
                audioLength
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Publishes a voice dictation error event
     * @param source Source of the event
     * @param error Error message
     * @param duration Duration of dictation attempt in ms
     */
    static async publishVoiceDictationError(source, error, duration) {
        const event = {
            id: this.generateEventId(),
            type: 'voice.dictation.error',
            timestamp: Date.now(),
            source,
            payload: {
                error,
                duration
            }
        };
        await event_bus_js_1.eventBus.publish(event);
    }
    /**
     * Generates a unique event ID
     * @returns Unique event ID
     */
    static generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.MultimodalEventPublisher = MultimodalEventPublisher;
//# sourceMappingURL=event-publisher.js.map