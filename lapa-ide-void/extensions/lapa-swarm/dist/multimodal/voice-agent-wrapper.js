"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentWrapper = void 0;
// Voice Agent Wrapper for integration with the LAPA Helix team agent pattern
const agent_tool_js_1 = require("../core/agent-tool.js");
const voice_agent_tool_js_1 = require("./voice-agent-tool.js");
class VoiceAgentWrapper extends agent_tool_js_1.HelixTeamAgentWrapper {
    constructor(id, name, registry, config, ragPipeline) {
        // Initialize with voice agent-specific capabilities
        super(id, 'voice', name, ['voice-processing', 'speech-to-text', 'text-to-speech', 'voice-commands', 'voice-qa'], 0, // Initial workload
        5, // Capacity
        registry);
        // Register voice agent tools
        this.registerVoiceTools(registry, config, ragPipeline);
    }
    /**
     * Register voice agent tools
     * @param registry Tool registry
     * @param config Voice agent configuration
     * @param ragPipeline RAG pipeline for Q&A integration
     */
    registerVoiceTools(registry, config, ragPipeline) {
        const voiceTool = new voice_agent_tool_js_1.VoiceAgentTool(config || { ttsProvider: 'system', sttProvider: 'system', language: 'en' }, ragPipeline);
        registry.registerTool(voiceTool);
        this.addTool(voiceTool);
    }
    addTool(tool) {
        // Add tool to the wrapper's internal registry
        // Assuming parent has a similar method or implement here
        super.addTool(tool);
    }
}
exports.VoiceAgentWrapper = VoiceAgentWrapper;
//# sourceMappingURL=voice-agent-wrapper.js.map