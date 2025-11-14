"use strict";
/**
 * Security Module Index for LAPA v1.2.2
 *
 * Phase 16: Security + RBAC + Red Teaming
 *
 * This module exports all security-related components including RBAC,
 * red teaming, and hallucination detection systems.
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
exports.securityIntegration = exports.hallucinationCheckSystem = exports.redTeamSystem = exports.rbacSystem = void 0;
__exportStar(require("./rbac.ts"), exports);
__exportStar(require("./red-team.ts"), exports);
__exportStar(require("./hallucination-check.ts"), exports);
__exportStar(require("./integration.ts"), exports);
// Re-export singleton instances for convenience
var rbac_ts_1 = require("./rbac.ts");
Object.defineProperty(exports, "rbacSystem", { enumerable: true, get: function () { return rbac_ts_1.rbacSystem; } });
var red_team_ts_1 = require("./red-team.ts");
Object.defineProperty(exports, "redTeamSystem", { enumerable: true, get: function () { return red_team_ts_1.redTeamSystem; } });
var hallucination_check_ts_1 = require("./hallucination-check.ts");
Object.defineProperty(exports, "hallucinationCheckSystem", { enumerable: true, get: function () { return hallucination_check_ts_1.hallucinationCheckSystem; } });
var integration_ts_1 = require("./integration.ts");
Object.defineProperty(exports, "securityIntegration", { enumerable: true, get: function () { return integration_ts_1.securityIntegration; } });
//# sourceMappingURL=index.js.map