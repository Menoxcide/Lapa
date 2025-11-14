"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgent = void 0;
// Voice agent implementation
const tts_stt_js_1 = require("./tts-stt.js");
const event_publisher_ts_1 = require("./utils/event-publisher.ts");
const event_bus_js_1 = require("../core/event-bus.js");
class VoiceAgent {
    audioPipeline;
    eventBus;
    ragPipeline;
    config;
    constructor(config, ragPipeline) {
        this.config = config || {};
        this.audioPipeline = new tts_stt_js_1.TTSSTTPipeline(this.config.ttsConfig);
        this.eventBus = event_bus_js_1.eventBus;
        this.ragPipeline = ragPipeline;
    }
    async processAudio(audio) {
        const processingStart = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioProcessing('voice-agent', audio.length, undefined, // format
                processingStart);
            }
            // Process audio using the audio pipeline
            const result = await this.audioPipeline.speechToText(audio);
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                const processingEnd = Date.now();
                const processingTime = processingEnd - processingStart;
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioProcessed('voice-agent', result.length, processingTime, processingEnd);
            }
            return result;
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioError('voice-agent', error instanceof Error ? error.message : String(error), audio.length);
            }
            throw error;
        }
    }
    async generateAudio(text) {
        const generationStart = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioGenerating('voice-agent', text.length, generationStart);
            }
            // Generate audio using the audio pipeline
            const result = await this.audioPipeline.textToSpeech(text);
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                const generationEnd = Date.now();
                const processingTime = generationEnd - generationStart;
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioGenerated('voice-agent', result.length, undefined, // duration
                processingTime, generationEnd);
            }
            return result;
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceAudioError('voice-agent', error instanceof Error ? error.message : String(error), undefined, // audioLength
                text.length);
            }
            throw error;
        }
    }
    async askQuestion(question) {
        const processingStart = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceQuestionAsking('voice-agent', question, undefined, // context
                processingStart);
            }
            let answer;
            // If RAG integration is enabled and we have a RAG pipeline, use it
            if (this.config.enableRAGIntegration && this.ragPipeline) {
                try {
                    // Search for similar content using RAG
                    const similarContent = await this.ragPipeline.searchSimilar(question, 3);
                    if (similarContent.length > 0) {
                        // Create context from similar content
                        const context = similarContent.map((item) => item.content).join('\n\n');
                        // Formulate a response based on the context
                        answer = `Based on the available information:\n\n${context}\n\nRegarding your question: ${question}`;
                    }
                    else {
                        answer = `I couldn't find specific information related to your question: ${question}`;
                    }
                }
                catch (ragError) {
                    console.error('RAG processing error:', ragError);
                    answer = `I encountered an issue accessing the knowledge base. Direct response to your question: ${question}`;
                }
            }
            else {
                // Simple echo response if RAG is not enabled
                answer = `You asked: ${question}. This is a placeholder response as RAG integration is not enabled.`;
            }
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                const processingEnd = Date.now();
                const processingTime = processingEnd - processingStart;
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceQuestionAnswered('voice-agent', question, answer, processingTime, processingEnd);
            }
            return answer;
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceQuestionError('voice-agent', error instanceof Error ? error.message : String(error), question);
            }
            throw error;
        }
    }
    async executeVoiceCommand(command) {
        const executionStart = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceCommandExecuting('voice-agent', command, undefined, // intent
                undefined, // entities
                undefined, // confidence
                executionStart);
            }
            // Parse and execute voice command
            let result;
            // Simple command parsing
            const lowerCommand = command.toLowerCase();
            if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
                result = { response: 'Hello! How can I assist you today?' };
            }
            else if (lowerCommand.includes('help')) {
                result = {
                    response: 'I can help you with voice commands, answering questions, and processing audio. Try saying "hello" or asking a question.'
                };
            }
            else if (lowerCommand.includes('time')) {
                result = {
                    response: `The current time is ${new Date().toLocaleTimeString()}`
                };
            }
            else if (lowerCommand.includes('date')) {
                result = {
                    response: `Today's date is ${new Date().toLocaleDateString()}`
                };
            }
            else {
                // Default response for unrecognized commands
                result = {
                    response: `I received your command: "${command}". I'm still learning to understand more commands.`
                };
            }
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                const executionEnd = Date.now();
                const processingTime = executionEnd - executionStart;
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceCommandExecuted('voice-agent', command, undefined, // intent
                undefined, // entities
                result, undefined, // confidence
                processingTime, executionEnd);
            }
            return result;
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await event_publisher_ts_1.MultimodalEventPublisher.publishVoiceCommandError('voice-agent', error instanceof Error ? error.message : String(error), command);
            }
            throw error;
        }
    }
}
exports.VoiceAgent = VoiceAgent;
//# sourceMappingURL=voice-agent.js.map