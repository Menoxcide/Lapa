"use strict";
/**
 * Agent Wrappers for LAPA Core
 *
 * This module exports specialized agent wrappers for the helix team patterns.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TesterAgentWrapper = exports.CoderAgentWrapper = exports.ResearcherAgentWrapper = exports.HelixTeamAgentWrapper = void 0;
var agent_tool_ts_1 = require("../agent-tool.ts");
Object.defineProperty(exports, "HelixTeamAgentWrapper", { enumerable: true, get: function () { return agent_tool_ts_1.HelixTeamAgentWrapper; } });
var researcher_wrapper_ts_1 = require("./researcher-wrapper.ts");
Object.defineProperty(exports, "ResearcherAgentWrapper", { enumerable: true, get: function () { return researcher_wrapper_ts_1.ResearcherAgentWrapper; } });
var coder_wrapper_ts_1 = require("./coder-wrapper.ts");
Object.defineProperty(exports, "CoderAgentWrapper", { enumerable: true, get: function () { return coder_wrapper_ts_1.CoderAgentWrapper; } });
var tester_wrapper_ts_1 = require("./tester-wrapper.ts");
Object.defineProperty(exports, "TesterAgentWrapper", { enumerable: true, get: function () { return tester_wrapper_ts_1.TesterAgentWrapper; } });
// Multimodal agent wrappers
__exportStar(require("./multimodal/index.ts"), exports);
//# sourceMappingURL=index.js.map