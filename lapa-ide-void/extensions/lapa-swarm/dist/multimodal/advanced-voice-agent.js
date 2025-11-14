"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedVoiceAgent = void 0;
// Advanced Voice Agent with RAG integration and enhanced capabilities
const tts_stt_ts_1 = require("./tts-stt.ts");
const event_bus_ts_1 = require("../core/event-bus.ts");
const voice_utils_ts_1 = require("./utils/voice-utils.ts");
const voice_command_parser_ts_1 = require("./voice-command-parser.ts");
class AdvancedVoiceAgent {
    audioPipeline;
    eventBus;
    ragPipeline;
    config;
    isDictating;
    dictationBuffer;
    dictationStartTime;
    constructor(config, ragPipeline) {
        this.config = {
            ttsProvider: 'system',
            sttProvider: 'system',
            enableRAGIntegration: false,
            enableEventPublishing: false,
            ...config
        };
        this.audioPipeline = new tts_stt_ts_1.TTSSTTPipeline({ provider: this.config.ttsProvider, modelPath: this.config.voiceModel }, { provider: this.config.sttProvider, model: this.config.voiceModel, language: this.config.language });
        this.eventBus = event_bus_ts_1.eventBus;
        this.ragPipeline = ragPipeline;
        this.isDictating = false;
        this.dictationBuffer = [];
        this.dictationStartTime = 0;
    }
    async processAudio(audio, format = 'wav') {
        const startTime = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.processing.${Date.now()}`,
                    type: 'voice.audio.processing',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        audioLength: audio.length,
                        format: format,
                        processingStart: startTime
                    }
                });
            }
            // Preprocess audio
            let processedAudio = audio;
            // Validate audio buffer
            if (!await voice_utils_ts_1.VoiceUtils.validateAudioBuffer(processedAudio)) {
                throw new Error('Invalid audio buffer');
            }
            // Convert to WAV if needed
            if (format.toLowerCase() !== 'wav') {
                processedAudio = await voice_utils_ts_1.VoiceUtils.convertToWav(processedAudio, format);
            }
            // Remove silence
            processedAudio = await voice_utils_ts_1.VoiceUtils.removeSilence(processedAudio);
            // Process audio using the audio pipeline
            const text = await this.audioPipeline.speechToText(processedAudio);
            const processingTime = Date.now() - startTime;
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.processed.${Date.now()}`,
                    type: 'voice.audio.processed',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        textLength: text.length,
                        processingTime: processingTime,
                        processingEnd: Date.now()
                    }
                });
            }
            return {
                text: text,
                confidence: 0.9, // Placeholder confidence
                language: this.config.language || 'en',
                processingTime: processingTime
            };
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.error.${Date.now()}`,
                    type: 'voice.audio.error',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        audioLength: audio.length
                    }
                });
            }
            throw error;
        }
    }
    async generateAudio(text) {
        const startTime = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.generating.${Date.now()}`,
                    type: 'voice.audio.generating',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        textLength: text.length,
                        generationStart: startTime
                    }
                });
            }
            // Generate audio using the audio pipeline
            const audioBuffer = await this.audioPipeline.textToSpeech(text);
            const processingTime = Date.now() - startTime;
            const duration = voice_utils_ts_1.VoiceUtils.estimateDuration(audioBuffer);
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.generated.${Date.now()}`,
                    type: 'voice.audio.generated',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        audioLength: audioBuffer.length,
                        duration: duration,
                        processingTime: processingTime,
                        generationEnd: Date.now()
                    }
                });
            }
            return {
                audioBuffer: audioBuffer,
                duration: duration,
                format: 'wav',
                processingTime: processingTime
            };
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.audio.error.${Date.now()}`,
                    type: 'voice.audio.error',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        textLength: text.length
                    }
                });
            }
            throw error;
        }
    }
    async askQuestion(question) {
        const startTime = Date.now();
        try {
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.question.asking.${Date.now()}`,
                    type: 'voice.question.asking',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        question: question.question,
                        context: question.context,
                        processingStart: startTime
                    }
                });
            }
            let answer;
            let sources = [];
            let confidence = 0.0;
            // If RAG integration is enabled and we have a RAG pipeline, use it
            if (this.config.enableRAGIntegration && this.ragPipeline) {
                try {
                    // Search for similar content using RAG
                    const similarContent = await this.ragPipeline.searchSimilar(question.question, 5);
                    if (similarContent.length > 0) {
                        // Create context from similar content
                        const context = similarContent.map(item => item.content).join('\n\n');
                        sources = similarContent.map(item => item.filePath);
                        confidence = Math.max(...similarContent.map(item => item.similarity));
                        // Formulate a response based on the context
                        answer = `Based on the available information:\n\n${context}\n\nRegarding your question: ${question.question}`;
                    }
                    else {
                        answer = `I couldn't find specific information related to your question: ${question.question}`;
                        confidence = 0.1;
                    }
                }
                catch (ragError) {
                    console.error('RAG processing error:', ragError);
                    answer = `I encountered an issue accessing the knowledge base. Direct response to your question: ${question.question}`;
                    confidence = 0.0;
                }
            }
            else {
                // Simple echo response if RAG is not enabled
                answer = `You asked: ${question.question}. This is a placeholder response as RAG integration is not enabled.`;
                confidence = 0.5;
            }
            const processingTime = Date.now() - startTime;
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.question.answered.${Date.now()}`,
                    type: 'voice.question.answered',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        question: question.question,
                        answer: answer,
                        processingTime: processingTime,
                        processingEnd: Date.now()
                    }
                });
            }
            return {
                answer: answer,
                sources: sources,
                confidence: confidence,
                processingTime: processingTime
            };
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.question.error.${Date.now()}`,
                    type: 'voice.question.error',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        question: question.question
                    }
                });
            }
            throw error;
        }
    }
    async executeVoiceCommand(command) {
        const startTime = Date.now();
        try {
            // Parse the command using the voice command parser
            const parsedCommand = command.intent && command.entities
                ? {
                    intent: command.intent,
                    entities: command.entities,
                    confidence: command.confidence || 0.8,
                    rawCommand: command.command
                }
                : voice_command_parser_ts_1.VoiceCommandParser.parseCommand(command.command);
            // Extract additional entities
            const additionalEntities = voice_command_parser_ts_1.VoiceCommandParser.extractEntities(command.command);
            const allEntities = { ...parsedCommand.entities, ...additionalEntities };
            // Publish event before processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.command.executing.${Date.now()}`,
                    type: 'voice.command.executing',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        command: command.command,
                        intent: parsedCommand.intent,
                        entities: allEntities,
                        confidence: parsedCommand.confidence,
                        executionStart: startTime
                    }
                });
            }
            // Execute command based on parsed intent
            let result;
            switch (parsedCommand.intent) {
                case 'greeting':
                    result = {
                        response: 'Hello! How can I assist you today?',
                        action: 'greeting'
                    };
                    break;
                case 'help':
                    result = {
                        response: 'I can help you with voice commands, answering questions, and processing audio. Try saying "hello" or asking a question.',
                        action: 'help'
                    };
                    break;
                case 'get_time':
                    result = {
                        response: `The current time is ${new Date().toLocaleTimeString()}`,
                        action: 'time'
                    };
                    break;
                case 'get_date':
                    result = {
                        response: `Today's date is ${new Date().toLocaleDateString()}`,
                        action: 'date'
                    };
                    break;
                case 'start_dictation':
                    await this.startDictation();
                    result = {
                        response: 'Dictation started. Speak now.',
                        action: 'dictation_start'
                    };
                    break;
                case 'stop_dictation':
                    await this.stopDictation();
                    result = {
                        response: 'Dictation stopped.',
                        action: 'dictation_stop'
                    };
                    break;
                case 'create_file':
                    const fileName = allEntities.fileName;
                    result = {
                        response: fileName
                            ? `I've created a file named ${fileName} for you.`
                            : "I'm ready to create a file. What would you like to name it?",
                        action: 'create_file',
                        fileName: fileName
                    };
                    break;
                case 'open_application':
                    const application = allEntities.application;
                    result = {
                        response: application
                            ? `I'm opening ${application} for you.`
                            : "I'm ready to open an application. Which one would you like to open?",
                        action: 'open_application',
                        application: application
                    };
                    break;
                case 'search':
                    const query = allEntities.query;
                    result = {
                        response: query
                            ? `I'm searching for information about ${query}.`
                            : "What would you like me to search for?",
                        action: 'search',
                        query: query
                    };
                    break;
                case 'send_message':
                    const recipient = allEntities.recipient;
                    const subject = allEntities.subject;
                    result = {
                        response: recipient
                            ? `I'm preparing to send a message to ${recipient}${subject ? ` about ${subject}` : ''}.`
                            : "Who would you like to send a message to?",
                        action: 'send_message',
                        recipient: recipient,
                        subject: subject
                    };
                    break;
                case 'unknown':
                default:
                    // Default response for unrecognized commands
                    result = {
                        response: `I received your command: "${command.command}". I'm still learning to understand more commands. Try asking for help to see what I can do.`,
                        action: 'unknown',
                        confidence: parsedCommand.confidence
                    };
                    break;
            }
            const processingTime = Date.now() - startTime;
            // Publish event after processing
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.command.executed.${Date.now()}`,
                    type: 'voice.command.executed',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        command: command.command,
                        intent: parsedCommand.intent,
                        entities: allEntities,
                        result: result,
                        confidence: parsedCommand.confidence,
                        processingTime: processingTime,
                        executionEnd: Date.now()
                    }
                });
            }
            return result;
        }
        catch (error) {
            // Publish error event
            if (this.config.enableEventPublishing) {
                await this.eventBus.publish({
                    id: `voice.command.error.${Date.now()}`,
                    type: 'voice.command.error',
                    timestamp: Date.now(),
                    source: 'advanced-voice-agent',
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        command: command.command
                    }
                });
            }
            throw error;
        }
    }
    async startDictation() {
        this.isDictating = true;
        this.dictationBuffer = [];
        this.dictationStartTime = Date.now();
        // Publish dictation start event
        if (this.config.enableEventPublishing) {
            await this.eventBus.publish({
                id: `voice.dictation.started.${Date.now()}`,
                type: 'voice.dictation.started',
                timestamp: Date.now(),
                source: 'advanced-voice-agent',
                payload: {
                    startTime: this.dictationStartTime
                }
            });
        }
    }
    async stopDictation() {
        if (!this.isDictating) {
            return;
        }
        this.isDictating = false;
        const dictationDuration = Date.now() - this.dictationStartTime;
        // Combine all buffered audio
        if (this.dictationBuffer.length > 0) {
            const combinedBuffer = Buffer.concat(this.dictationBuffer);
            // Process the combined audio
            try {
                const result = await this.processAudio(combinedBuffer);
                // Publish dictation result event
                if (this.config.enableEventPublishing) {
                    await this.eventBus.publish({
                        id: `voice.dictation.completed.${Date.now()}`,
                        type: 'voice.dictation.completed',
                        timestamp: Date.now(),
                        source: 'advanced-voice-agent',
                        payload: {
                            text: result.text,
                            duration: dictationDuration,
                            audioLength: combinedBuffer.length
                        }
                    });
                }
            }
            catch (error) {
                // Publish dictation error event
                if (this.config.enableEventPublishing) {
                    await this.eventBus.publish({
                        id: `voice.dictation.error.${Date.now()}`,
                        type: 'voice.dictation.error',
                        timestamp: Date.now(),
                        source: 'advanced-voice-agent',
                        payload: {
                            error: error instanceof Error ? error.message : String(error),
                            duration: dictationDuration
                        }
                    });
                }
            }
        }
        // Reset buffer
        this.dictationBuffer = [];
    }
    /**
     * Adds audio data to the dictation buffer
     * @param audio Audio buffer to add
     */
    async addToDictationBuffer(audio) {
        if (this.isDictating) {
            this.dictationBuffer.push(audio);
        }
    }
}
exports.AdvancedVoiceAgent = AdvancedVoiceAgent;
//# sourceMappingURL=advanced-voice-agent.js.map