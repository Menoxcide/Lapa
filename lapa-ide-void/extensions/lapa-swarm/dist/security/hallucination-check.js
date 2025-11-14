"use strict";
/**
 * Hallucination Detection and Veto System for LAPA v1.2.2
 *
 * This module implements comprehensive hallucination detection and veto mechanisms
 * for agent outputs. It validates claims against known facts, code context, and
 * consensus mechanisms to prevent false or misleading information.
 *
 * Phase 16: Security + RBAC + Red Teaming
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hallucinationCheckSystem = exports.HallucinationCheckSystem = void 0;
const audit_logger_js_1 = require("../premium/audit.logger.js");
const event_bus_js_1 = require("../core/event-bus.js");
const consensus_voting_js_1 = require("../swarm/consensus.voting.js");
const rbac_js_1 = require("./rbac.js");
/**
 * LAPA Hallucination Detection and Veto System
 */
class HallucinationCheckSystem {
    validationRules = new Map();
    claimHistory = new Map();
    vetoThreshold = 0.833; // 5/6 consensus
    enabled = true;
    autoVeto = true; // Automatically veto high-confidence hallucinations
    constructor() {
        this.initializeValidationRules();
        // Listen for agent outputs
        event_bus_js_1.eventBus.subscribe('agent.output', (e) => this.handleAgentOutput(e));
        event_bus_js_1.eventBus.subscribe('consensus.result', (e) => this.handleConsensusResult(e));
    }
    /**
     * Initializes default validation rules
     */
    initializeValidationRules() {
        // Factual error patterns
        this.addValidationRule({
            id: 'factual.error',
            name: 'Factual Error Detection',
            description: 'Detects claims that contradict known facts',
            pattern: (text) => {
                // Check for common factual errors
                const errorPatterns = [
                    /version \d+\.\d+\.\d+ (does not exist|is deprecated)/i,
                    /API endpoint (does not exist|has been removed)/i,
                    /(always|never) (true|false)/i
                ];
                return errorPatterns.some(pattern => pattern.test(text));
            },
            type: 'factual.error',
            severity: 'medium',
            enabled: true
        });
        // Code reference patterns
        this.addValidationRule({
            id: 'code.reference',
            name: 'Code Reference Validation',
            description: 'Validates references to code files, functions, or classes',
            pattern: /(file|function|class|method):\s*['"]([^'"]+)['"]/i,
            type: 'code.reference',
            severity: 'high',
            enabled: true
        });
        // API claim patterns
        this.addValidationRule({
            id: 'api.claim',
            name: 'API Claim Validation',
            description: 'Validates claims about API capabilities or endpoints',
            pattern: /(API|endpoint|method)\s+(supports|provides|returns|accepts)/i,
            type: 'api.claim',
            severity: 'high',
            enabled: true
        });
        // Capability claim patterns
        this.addValidationRule({
            id: 'capability.claim',
            name: 'Capability Claim Validation',
            description: 'Validates claims about system capabilities',
            pattern: /(can|supports|enables|provides)\s+[A-Z][a-z]+/i,
            type: 'capability.claim',
            severity: 'medium',
            enabled: true
        });
        // Context mismatch patterns
        this.addValidationRule({
            id: 'context.mismatch',
            name: 'Context Mismatch Detection',
            description: 'Detects claims that don\'t match the current context',
            pattern: /(current|now|this)\s+(version|file|system)/i,
            type: 'context.mismatch',
            severity: 'medium',
            enabled: true
        });
        // Source attribution patterns
        this.addValidationRule({
            id: 'source.attribution',
            name: 'Source Attribution Validation',
            description: 'Validates source citations and attributions',
            pattern: /(according to|source:|reference:)\s*['"]([^'"]+)['"]/i,
            type: 'source.attribution',
            severity: 'low',
            enabled: true
        });
        // Temporal inconsistency patterns
        this.addValidationRule({
            id: 'temporal.inconsistency',
            name: 'Temporal Inconsistency Detection',
            description: 'Detects claims with temporal inconsistencies',
            pattern: /(will be|was|is)\s+(released|deprecated|removed)\s+(in|on|at)\s+/i,
            type: 'temporal.inconsistency',
            severity: 'low',
            enabled: true
        });
    }
    /**
     * Adds a validation rule
     */
    addValidationRule(rule) {
        this.validationRules.set(rule.id, rule);
        audit_logger_js_1.auditLogger.logSecurityEvent('hallucination.rule.added', {
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type
        });
    }
    /**
     * Checks a claim for hallucinations
     */
    async checkClaim(claim) {
        if (!this.enabled) {
            return {
                isHallucination: false,
                confidence: 0,
                evidence: [],
                sources: [],
                vetoRecommended: false
            };
        }
        const evidence = [];
        const sources = [];
        let maxConfidence = 0;
        let detectedType;
        let detectedSeverity;
        // Check against validation rules
        for (const rule of this.validationRules.values()) {
            if (!rule.enabled) {
                continue;
            }
            const matches = typeof rule.pattern === 'function'
                ? rule.pattern(claim.text)
                : rule.pattern.test(claim.text);
            if (matches) {
                evidence.push(`Rule "${rule.name}": ${rule.description}`);
                sources.push('pattern.match');
                detectedType = rule.type;
                detectedSeverity = rule.severity;
                // Calculate confidence based on severity
                const severityConfidence = {
                    low: 0.3,
                    medium: 0.6,
                    high: 0.8,
                    critical: 0.95
                };
                maxConfidence = Math.max(maxConfidence, severityConfidence[rule.severity]);
            }
        }
        // Check against codebase (if code reference)
        if (claim.text.match(/file:|function:|class:/i)) {
            const codebaseCheck = await this.validateCodebaseReference(claim.text);
            if (!codebaseCheck.valid) {
                evidence.push(`Codebase validation failed: ${codebaseCheck.reason}`);
                sources.push('codebase');
                maxConfidence = Math.max(maxConfidence, 0.7);
                detectedType = 'code.reference';
                detectedSeverity = 'high';
            }
        }
        // Check against memory/episodic store
        const memoryCheck = await this.validateAgainstMemory(claim);
        if (!memoryCheck.valid) {
            evidence.push(`Memory validation failed: ${memoryCheck.reason}`);
            sources.push('memory');
            maxConfidence = Math.max(maxConfidence, 0.6);
            if (!detectedType) {
                detectedType = 'factual.error';
                detectedSeverity = 'medium';
            }
        }
        // Check consensus if available
        if (claim.metadata?.consensusId) {
            const consensusCheck = await this.validateAgainstConsensus(claim);
            if (!consensusCheck.valid) {
                evidence.push(`Consensus validation failed: ${consensusCheck.reason}`);
                sources.push('consensus');
                maxConfidence = Math.max(maxConfidence, 0.8);
                detectedType = 'consensus.violation';
                detectedSeverity = 'high';
            }
        }
        // Store claim for history
        this.claimHistory.set(claim.id, claim);
        const isHallucination = maxConfidence > 0.5;
        const vetoRecommended = isHallucination && maxConfidence >= 0.7 && this.autoVeto;
        // Generate recommendations
        const recommendations = this.generateRecommendations(detectedType, detectedSeverity, isHallucination);
        // Log the check
        audit_logger_js_1.auditLogger.logSecurityEvent('hallucination.check.performed', {
            claimId: claim.id,
            sourceAgentId: claim.sourceAgentId,
            isHallucination,
            confidence: maxConfidence,
            type: detectedType,
            severity: detectedSeverity,
            vetoRecommended
        });
        return {
            isHallucination,
            confidence: maxConfidence,
            type: detectedType,
            severity: detectedSeverity,
            evidence,
            sources,
            recommendations,
            vetoRecommended
        };
    }
    /**
     * Validates a codebase reference
     */
    async validateCodebaseReference(text) {
        // Extract file/function/class references
        const fileMatch = text.match(/file:\s*['"]([^'"]+)['"]/i);
        const functionMatch = text.match(/function:\s*['"]([^'"]+)['"]/i);
        const classMatch = text.match(/class:\s*['"]([^'"]+)['"]/i);
        // In a real implementation, this would check the actual codebase
        // For now, we'll use pattern-based validation
        if (fileMatch) {
            const filePath = fileMatch[1];
            // Check for suspicious patterns
            if (filePath.includes('..') || filePath.includes('~')) {
                return { valid: false, reason: 'Suspicious file path detected' };
            }
        }
        // Publish event for actual codebase validation (could be handled by another service)
        await event_bus_js_1.eventBus.publish({
            id: `hallucination.codebase.validate.${Date.now()}`,
            type: 'hallucination.codebase.validate',
            timestamp: Date.now(),
            source: 'hallucination-check',
            payload: {
                text,
                fileMatch: fileMatch?.[1],
                functionMatch: functionMatch?.[1],
                classMatch: classMatch?.[1]
            }
        });
        return { valid: true };
    }
    /**
     * Validates a claim against memory/episodic store
     */
    async validateAgainstMemory(claim) {
        // Check for contradictions with previous claims
        for (const [claimId, previousClaim] of this.claimHistory.entries()) {
            if (previousClaim.sourceAgentId === claim.sourceAgentId) {
                // Simple contradiction detection (could be enhanced with semantic similarity)
                if (this.detectContradiction(claim.text, previousClaim.text)) {
                    return {
                        valid: false,
                        reason: `Contradicts previous claim ${claimId}`
                    };
                }
            }
        }
        // Publish event for memory validation (could be handled by Memori engine)
        await event_bus_js_1.eventBus.publish({
            id: `hallucination.memory.validate.${Date.now()}`,
            type: 'hallucination.memory.validate',
            timestamp: Date.now(),
            source: 'hallucination-check',
            payload: {
                claimId: claim.id,
                text: claim.text,
                context: claim.context
            }
        });
        return { valid: true };
    }
    /**
     * Validates a claim against consensus
     */
    async validateAgainstConsensus(claim) {
        const consensusId = claim.metadata?.consensusId;
        if (!consensusId) {
            return { valid: true };
        }
        const session = consensus_voting_js_1.consensusVotingSystem.getVotingSession(consensusId);
        if (!session) {
            return { valid: false, reason: 'Consensus session not found' };
        }
        // Check if claim aligns with consensus result
        // This is a simplified check - in practice, would need semantic comparison
        return { valid: true };
    }
    /**
     * Detects contradictions between two texts
     */
    detectContradiction(text1, text2) {
        // Simple contradiction patterns
        const contradictionPatterns = [
            { pattern1: /is\s+(true|enabled|active)/i, pattern2: /is\s+(false|disabled|inactive)/i },
            { pattern1: /supports/i, pattern2: /does not support/i },
            { pattern1: /can/i, pattern2: /cannot/i },
            { pattern1: /exists/i, pattern2: /does not exist/i }
        ];
        for (const { pattern1, pattern2 } of contradictionPatterns) {
            if (pattern1.test(text1) && pattern2.test(text2)) {
                return true;
            }
            if (pattern2.test(text1) && pattern1.test(text2)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Generates recommendations based on hallucination detection
     */
    generateRecommendations(type, severity, isHallucination = false) {
        const recommendations = [];
        if (!isHallucination) {
            return recommendations;
        }
        recommendations.push('Verify claim against source documentation');
        recommendations.push('Cross-reference with codebase or memory');
        if (type === 'code.reference') {
            recommendations.push('Check if referenced file/function/class actually exists');
            recommendations.push('Validate file paths and imports');
        }
        if (type === 'api.claim') {
            recommendations.push('Verify API documentation');
            recommendations.push('Test API endpoint if possible');
        }
        if (type === 'factual.error') {
            recommendations.push('Fact-check against authoritative sources');
            recommendations.push('Consider using LLM-as-Judge for validation');
        }
        if (severity === 'critical' || severity === 'high') {
            recommendations.push('Consider vetoing this output');
            recommendations.push('Request human review');
        }
        return recommendations;
    }
    /**
     * Initiates a veto process for a claim
     */
    async initiateVeto(claimId, reason, agentIds) {
        const claim = this.claimHistory.get(claimId);
        if (!claim) {
            throw new Error(`Claim ${claimId} not found`);
        }
        // Create a voting session for veto
        const sessionId = consensus_voting_js_1.consensusVotingSystem.createVotingSession(`Veto claim: ${claimId}`, [
            { id: 'veto', label: 'Veto', value: true },
            { id: 'approve', label: 'Approve', value: false }
        ], agentIds.length // Quorum = all agents
        );
        // Each agent votes (in practice, this would be async)
        let votesFor = 0;
        let votesAgainst = 0;
        for (const agentId of agentIds) {
            // Check if agent has veto permission
            const hasPermission = await rbac_js_1.rbacSystem.checkAccess(agentId, 'consensus', 'consensus', 'consensus.veto');
            if (hasPermission.allowed) {
                // In practice, agents would vote based on their analysis
                // For now, we'll simulate based on the reason
                const shouldVeto = reason.toLowerCase().includes('hallucination') ||
                    reason.toLowerCase().includes('error') ||
                    reason.toLowerCase().includes('invalid');
                consensus_voting_js_1.consensusVotingSystem.castVote(sessionId, agentId, shouldVeto ? 'veto' : 'approve', reason);
                if (shouldVeto) {
                    votesFor++;
                }
                else {
                    votesAgainst++;
                }
            }
        }
        // Close session and get result
        const result = consensus_voting_js_1.consensusVotingSystem.closeVotingSession(sessionId, 'supermajority', this.vetoThreshold);
        const totalVotes = votesFor + votesAgainst;
        const vetoed = result.consensusReached && result.winningOption?.id === 'veto';
        const vetoDecision = {
            vetoed,
            reason: vetoed ? 'Veto threshold reached' : 'Veto threshold not reached',
            confidence: result.confidence,
            votes: {
                for: votesFor,
                against: votesAgainst,
                total: totalVotes
            },
            threshold: this.vetoThreshold
        };
        // Log veto decision
        audit_logger_js_1.auditLogger.logSecurityEvent('hallucination.veto.decided', {
            claimId,
            vetoed,
            reason,
            confidence: result.confidence,
            votesFor,
            votesAgainst
        });
        // Publish event
        await event_bus_js_1.eventBus.publish({
            id: `hallucination.veto.completed.${Date.now()}`,
            type: 'hallucination.veto.completed',
            timestamp: Date.now(),
            source: 'hallucination-check',
            payload: {
                claimId,
                decision: vetoDecision
            }
        });
        return vetoDecision;
    }
    /**
     * Handles agent output events
     */
    async handleAgentOutput(data) {
        const claim = {
            id: this.generateClaimId(),
            text: data.output,
            context: data.context,
            sourceAgentId: data.agentId,
            timestamp: new Date()
        };
        const result = await this.checkClaim(claim);
        if (result.isHallucination && result.vetoRecommended) {
            // Automatically initiate veto for high-confidence hallucinations
            await event_bus_js_1.eventBus.publish({
                id: `hallucination.detected.${Date.now()}`,
                type: 'hallucination.detected',
                timestamp: Date.now(),
                source: 'hallucination-check',
                payload: {
                    claimId: claim.id,
                    result,
                    autoVeto: true
                }
            });
        }
    }
    /**
     * Handles consensus results for validation
     */
    handleConsensusResult(data) {
        // Validate consensus results for potential hallucinations
        // This could trigger additional checks
    }
    /**
     * Gets a claim by ID
     */
    getClaim(claimId) {
        return this.claimHistory.get(claimId);
    }
    /**
     * Gets claim history
     */
    getClaimHistory(limit = 100) {
        return Array.from(this.claimHistory.values()).slice(-limit);
    }
    /**
     * Generates a unique claim ID
     */
    generateClaimId() {
        return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.HallucinationCheckSystem = HallucinationCheckSystem;
// Export singleton instance
exports.hallucinationCheckSystem = new HallucinationCheckSystem();
//# sourceMappingURL=hallucination-check.js.map