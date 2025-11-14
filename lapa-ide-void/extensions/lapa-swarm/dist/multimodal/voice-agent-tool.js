"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentTool = void 0;
// Voice Agent Tool for integration with the LAPA agent system
const agent_tool_js_1 = require("../core/agent-tool.js");
const advanced_voice_agent_js_1 = require("./advanced-voice-agent.js");
const event_publisher_js_1 = require("./utils/event-publisher.js");
class VoiceAgentTool extends agent_tool_js_1.BaseAgentTool {
    voiceAgent;
    constructor(config, ragPipeline) {
        super('voice-agent', 'code-generation', 'Advanced voice agent with TTS/STT capabilities and RAG integration', '1.0.0');
        // Create the voice agent with the provided configuration
        this.voiceAgent = new advanced_voice_agent_js_1.AdvancedVoiceAgent(config, ragPipeline);
    }
    /**
     * Execute the voice agent tool
     * @param context Execution context
     * @returns Promise resolving to execution result
     */
    async execute(context) {
        try {
            // Extract parameters
            const { action, ...params } = context.parameters;
            // Validate parameters
            if (!this.validateParameters(context.parameters)) {
                return {
                    success: false,
                    error: 'Invalid parameters: action is required',
                    executionTime: 0
                };
            }
            let result;
            const startTime = Date.now();
            // Execute the requested action
            switch (action) {
                case 'transcribe':
                    result = await this.handleTranscribe(params);
                    break;
                case 'synthesize':
                    result = await this.handleSynthesize(params);
                    break;
                case 'ask':
                    result = await this.handleAsk(params);
                    break;
                case 'executeCommand':
                    result = await this.handleExecuteCommand(params);
                    break;
                case 'startDictation':
                    await this.voiceAgent.startDictation();
                    result = { message: 'Dictation started' };
                    break;
                case 'stopDictation':
                    await this.voiceAgent.stopDictation();
                    result = { message: 'Dictation stopped' };
                    break;
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                        executionTime: 0
                    };
            }
            const executionTime = Date.now() - startTime;
            // Publish voice tool executed event using the event publisher
            await event_publisher_js_1.MultimodalEventPublisher.publishVoiceCommandExecuted('voice-agent-tool', action, undefined, // intent
            undefined, // entities
            result, undefined, // confidence
            executionTime, Date.now()).catch(console.error);
            return {
                success: true,
                output: result,
                executionTime
            };
        }
        catch (error) {
            // Publish voice tool failed event using the event publisher
            await event_publisher_js_1.MultimodalEventPublisher.publishVoiceCommandError('voice-agent-tool', error instanceof Error ? error.message : String(error), 'unknown' // command
            ).catch(console.error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: 0
            };
        }
    }
    /**
     * Validate tool parameters
     * @param params Parameters to validate
     * @returns Boolean indicating if parameters are valid
     */
    validateParameters(params) {
        return !!params.action && typeof params.action === 'string';
    }
    /**
     * Handle speech-to-text transcription
     * @param params Parameters for transcription
     * @returns Transcription result
     */
    async handleTranscribe(params) {
        if (!params.audioData) {
            throw new Error('Audio data is required for transcription');
        }
        // Convert base64 audio data to buffer if needed
        let audioBuffer;
        if (typeof params.audioData === 'string') {
            audioBuffer = Buffer.from(params.audioData, 'base64');
        }
        else if (params.audioData instanceof Buffer) {
            audioBuffer = params.audioData;
        }
        else {
            throw new Error('Invalid audio data format');
        }
        const format = params.format || 'wav';
        return await this.voiceAgent.processAudio(audioBuffer, format);
    }
    /**
     * Handle text-to-speech synthesis
     * @param params Parameters for synthesis
     * @returns Synthesis result
     */
    async handleSynthesize(params) {
        if (!params.text) {
            throw new Error('Text is required for synthesis');
        }
        return await this.voiceAgent.generateAudio(params.text);
    }
    /**
     * Handle question answering
     * @param params Parameters for question answering
     * @returns Answer result
     */
    async handleAsk(params) {
        if (!params.question) {
            throw new Error('Question is required for Q&A');
        }
        return await this.voiceAgent.askQuestion({
            question: params.question,
            context: params.context,
            sessionId: params.sessionId
        });
    }
    /**
     * Handle voice command execution
     * @param params Parameters for command execution
     * @returns Command execution result
     */
    async handleExecuteCommand(params) {
        if (!params.command) {
            throw new Error('Command is required for execution');
        }
        return await this.voiceAgent.executeVoiceCommand({
            command: params.command,
            intent: params.intent,
            entities: params.entities,
            confidence: params.confidence
        });
    }
}
exports.VoiceAgentTool = VoiceAgentTool;
//# sourceMappingURL=voice-agent-tool.js.map