"use strict";
/**
 * Security Integration Helper for LAPA v1.2.2
 *
 * This module provides integration helpers for connecting security systems
 * (RBAC, Red Team, Hallucination Check) with the orchestrator, handoffs,
 * and other core systems.
 *
 * Phase 16: Security + RBAC + Red Teaming
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityIntegration = exports.SecurityIntegration = void 0;
const rbac_ts_1 = require("./rbac.ts");
const hallucination_check_ts_1 = require("./hallucination-check.ts");
const audit_logger_js_1 = require("../premium/audit.logger.js");
const event_bus_js_1 = require("../core/event-bus.js");
/**
 * Security Integration Helper
 */
class SecurityIntegration {
    config;
    constructor(config = {}) {
        this.config = {
            enableRBAC: true,
            enableHallucinationCheck: true,
            enableRedTeamMonitoring: true,
            strictMode: true,
            ...config
        };
        this.setupEventListeners();
    }
    /**
     * Sets up event listeners for security monitoring
     */
    setupEventListeners() {
        // Listen for handoff events
        event_bus_js_1.eventBus.subscribe('handoff.initiated', async (event) => {
            if (this.config.enableRBAC) {
                await this.validateHandoffAccess(event);
            }
        });
        // Listen for agent outputs
        event_bus_js_1.eventBus.subscribe('agent.output', async (event) => {
            if (this.config.enableHallucinationCheck) {
                await this.checkAgentOutput(event);
            }
        });
        // Listen for critical operations
        event_bus_js_1.eventBus.subscribe('rbac.critical.access', async (event) => {
            if (this.config.enableRedTeamMonitoring) {
                await this.monitorCriticalAccess(event);
            }
        });
    }
    /**
     * Validates a handoff operation
     */
    async validateHandoff(sourceAgentId, targetAgentId, taskId, context) {
        const checks = {};
        const recommendations = [];
        // RBAC check
        if (this.config.enableRBAC) {
            const rbacCheck = await rbac_ts_1.rbacSystem.checkAccess(sourceAgentId, taskId, 'task', 'handoff.initiate');
            checks.rbac = {
                allowed: rbacCheck.allowed,
                reason: rbacCheck.reason
            };
            if (!rbacCheck.allowed) {
                recommendations.push('Ensure source agent has handoff.initiate permission');
            }
        }
        // Hallucination check on context
        if (this.config.enableHallucinationCheck && context) {
            const contextText = JSON.stringify(context);
            const claim = {
                id: `handoff_${taskId}_${Date.now()}`,
                text: contextText,
                context: 'handoff',
                sourceAgentId,
                timestamp: new Date(),
                metadata: { taskId, targetAgentId }
            };
            const hallucinationCheck = await hallucination_check_ts_1.hallucinationCheckSystem.checkClaim(claim);
            checks.hallucination = {
                isHallucination: hallucinationCheck.isHallucination,
                confidence: hallucinationCheck.confidence
            };
            if (hallucinationCheck.isHallucination) {
                recommendations.push('Review context for potential hallucinations');
                if (hallucinationCheck.vetoRecommended) {
                    recommendations.push('Consider vetoing this handoff');
                }
            }
        }
        const passed = Object.values(checks).every(check => {
            if (check && 'allowed' in check) {
                return check.allowed;
            }
            if (check && 'isHallucination' in check) {
                return !check.isHallucination;
            }
            return true;
        });
        return {
            passed: this.config.strictMode ? passed : true,
            checks,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }
    /**
     * Validates handoff access from event
     */
    async validateHandoffAccess(data) {
        const result = await this.validateHandoff(data.sourceAgentId, data.targetAgentId, data.taskId, data.context);
        if (!result.passed) {
            audit_logger_js_1.auditLogger.logSecurityEvent('security.handoff.blocked', {
                sourceAgentId: data.sourceAgentId,
                targetAgentId: data.targetAgentId,
                taskId: data.taskId,
                checks: result.checks
            });
            event_bus_js_1.eventBus.emit('security.handoff.blocked', {
                sourceAgentId: data.sourceAgentId,
                targetAgentId: data.targetAgentId,
                taskId: data.taskId,
                reason: 'Security validation failed'
            });
        }
    }
    /**
     * Checks agent output for hallucinations
     */
    async checkAgentOutput(data) {
        const claim = {
            id: `output_${data.agentId}_${Date.now()}`,
            text: data.output,
            context: data.context,
            sourceAgentId: data.agentId,
            timestamp: new Date()
        };
        const result = await hallucination_check_ts_1.hallucinationCheckSystem.checkClaim(claim);
        if (result.isHallucination) {
            event_bus_js_1.eventBus.emit('security.hallucination.detected', {
                agentId: data.agentId,
                claimId: claim.id,
                result
            });
        }
    }
    /**
     * Monitors critical access for red team analysis
     */
    async monitorCriticalAccess(data) {
        // This could trigger red team scenarios for privilege escalation detection
        audit_logger_js_1.auditLogger.logSecurityEvent('security.critical.access.monitored', {
            principalId: data.principalId,
            resourceId: data.resourceId,
            resourceType: data.resourceType,
            permission: data.permission
        });
    }
    /**
     * Validates code execution permission
     */
    async validateCodeExecution(agentId, code, resourceId) {
        const checks = {};
        const recommendations = [];
        // RBAC check for code execution
        if (this.config.enableRBAC) {
            const rbacCheck = await rbac_ts_1.rbacSystem.checkAccess(agentId, resourceId, 'code', 'code.execute');
            checks.rbac = {
                allowed: rbacCheck.allowed,
                reason: rbacCheck.reason
            };
            if (!rbacCheck.allowed) {
                recommendations.push('Agent does not have code.execute permission');
            }
        }
        // Red team check for code injection
        if (this.config.enableRedTeamMonitoring) {
            // Check for suspicious code patterns
            const suspiciousPatterns = [
                /eval\s*\(/i,
                /exec\s*\(/i,
                /process\.exit/i,
                /rm\s+-rf/i,
                /child_process/i
            ];
            const detected = suspiciousPatterns.some(pattern => pattern.test(code));
            checks.redTeam = {
                detected,
                blocked: detected && this.config.strictMode
            };
            if (detected) {
                recommendations.push('Suspicious code pattern detected - review required');
            }
        }
        const passed = Object.values(checks).every(check => {
            if (check && 'allowed' in check) {
                return check.allowed;
            }
            if (check && 'blocked' in check) {
                return !check.blocked;
            }
            return true;
        });
        return {
            passed: this.config.strictMode ? passed : true,
            checks,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }
    /**
     * Validates task creation
     */
    async validateTaskCreation(agentId, taskDescription, taskType) {
        const checks = {};
        // RBAC check
        if (this.config.enableRBAC) {
            const rbacCheck = await rbac_ts_1.rbacSystem.checkAccess(agentId, 'task', 'task', 'task.create');
            checks.rbac = {
                allowed: rbacCheck.allowed,
                reason: rbacCheck.reason
            };
        }
        // Hallucination check on task description
        if (this.config.enableHallucinationCheck) {
            const claim = {
                id: `task_${Date.now()}`,
                text: taskDescription,
                context: 'task-creation',
                sourceAgentId: agentId,
                timestamp: new Date(),
                metadata: { taskType }
            };
            const hallucinationCheck = await hallucination_check_ts_1.hallucinationCheckSystem.checkClaim(claim);
            checks.hallucination = {
                isHallucination: hallucinationCheck.isHallucination,
                confidence: hallucinationCheck.confidence
            };
        }
        const passed = Object.values(checks).every(check => {
            if (check && 'allowed' in check) {
                return check.allowed;
            }
            if (check && 'isHallucination' in check) {
                return !check.isHallucination;
            }
            return true;
        });
        return {
            passed: this.config.strictMode ? passed : true,
            checks
        };
    }
}
exports.SecurityIntegration = SecurityIntegration;
// Export singleton instance
exports.securityIntegration = new SecurityIntegration();
//# sourceMappingURL=integration.js.map