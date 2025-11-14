"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionAgentWrapper = void 0;
// Vision Agent Wrapper for integration with the LAPA Helix team agent pattern
const agent_tool_js_1 = require("../core/agent-tool.js");
const vision_agent_tool_js_1 = require("./vision-agent-tool.js");
class VisionAgentWrapper extends agent_tool_js_1.HelixTeamAgentWrapper {
    constructor(id, name, registry, config) {
        // Initialize with vision agent-specific capabilities
        super(id, 'vision', name, ['vision-processing', 'image-analysis', 'ui-recognition', 'code-generation-from-design', 'screenshot-analysis'], 0, // Initial workload
        5, // Capacity
        registry);
        // Register vision agent tools
        this.registerVisionTools(registry, config);
    }
    /**
     * Register vision agent tools
     * @param registry Tool registry
     * @param config Vision agent configuration
     */
    registerVisionTools(registry, config) {
        const visionTool = new vision_agent_tool_js_1.VisionAgentTool(config);
        registry.registerTool(visionTool);
        this.addTool(visionTool);
    }
}
exports.VisionAgentWrapper = VisionAgentWrapper;
//# sourceMappingURL=vision-agent-wrapper.js.map