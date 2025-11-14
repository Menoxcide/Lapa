/**
 * Security Integration Helper for LAPA v1.2.2
 * 
 * This module provides integration helpers for connecting security systems
 * (RBAC, Red Team, Hallucination Check) with the orchestrator, handoffs,
 * and other core systems.
 * 
 * Phase 16: Security + RBAC + Red Teaming
 */

import { rbacSystem, Permission, ResourceType } from './rbac.ts';
import { redTeamSystem } from './red-team.ts';
import { hallucinationCheckSystem, Claim } from './hallucination-check.ts';
import { auditLogger } from '../premium/audit.logger.ts';
import { eventBus } from '../core/event-bus.ts';

// Security validation result
export interface SecurityValidationResult {
  passed: boolean;
  checks: {
    rbac?: { allowed: boolean; reason?: string };
    hallucination?: { isHallucination: boolean; confidence: number };
    redTeam?: { detected: boolean; blocked: boolean };
  };
  recommendations?: string[];
}

// Security integration configuration
export interface SecurityIntegrationConfig {
  enableRBAC: boolean;
  enableHallucinationCheck: boolean;
  enableRedTeamMonitoring: boolean;
  strictMode: boolean;
}

/**
 * Security Integration Helper
 */
export class SecurityIntegration {
  private config: SecurityIntegrationConfig;

  constructor(config: Partial<SecurityIntegrationConfig> = {}) {
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
  private setupEventListeners(): void {
    // Listen for handoff events
    eventBus.subscribe('handoff.initiated' as any, async (event: any) => {
      if (this.config.enableRBAC) {
        await this.validateHandoffAccess(event);
      }
    });

    // Listen for agent outputs
    eventBus.subscribe('agent.output' as any, async (event: any) => {
      if (this.config.enableHallucinationCheck) {
        await this.checkAgentOutput(event);
      }
    });

    // Listen for critical operations
    eventBus.subscribe('rbac.critical.access' as any, async (event: any) => {
      if (this.config.enableRedTeamMonitoring) {
        await this.monitorCriticalAccess(event);
      }
    });
  }

  /**
   * Validates a handoff operation
   */
  async validateHandoff(
    sourceAgentId: string,
    targetAgentId: string,
    taskId: string,
    context?: Record<string, unknown>
  ): Promise<SecurityValidationResult> {
    const checks: SecurityValidationResult['checks'] = {};
    const recommendations: string[] = [];

    // RBAC check
    if (this.config.enableRBAC) {
      const rbacCheck = await rbacSystem.checkAccess(
        sourceAgentId,
        taskId,
        'task',
        'handoff.initiate'
      );
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
      const claim: Claim = {
        id: `handoff_${taskId}_${Date.now()}`,
        text: contextText,
        context: 'handoff',
        sourceAgentId,
        timestamp: new Date(),
        metadata: { taskId, targetAgentId }
      };

      const hallucinationCheck = await hallucinationCheckSystem.checkClaim(claim);
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
  private async validateHandoffAccess(data: {
    sourceAgentId: string;
    targetAgentId: string;
    taskId: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    const result = await this.validateHandoff(
      data.sourceAgentId,
      data.targetAgentId,
      data.taskId,
      data.context
    );

    if (!result.passed) {
      auditLogger.logSecurityEvent('security.handoff.blocked', {
        sourceAgentId: data.sourceAgentId,
        targetAgentId: data.targetAgentId,
        taskId: data.taskId,
        checks: result.checks
      });

      eventBus.emit('security.handoff.blocked', {
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
  private async checkAgentOutput(data: {
    agentId: string;
    output: string;
    context?: string;
  }): Promise<void> {
    const claim: Claim = {
      id: `output_${data.agentId}_${Date.now()}`,
      text: data.output,
      context: data.context,
      sourceAgentId: data.agentId,
      timestamp: new Date()
    };

    const result = await hallucinationCheckSystem.checkClaim(claim);

    if (result.isHallucination) {
      eventBus.emit('security.hallucination.detected', {
        agentId: data.agentId,
        claimId: claim.id,
        result
      });
    }
  }

  /**
   * Monitors critical access for red team analysis
   */
  private async monitorCriticalAccess(data: {
    principalId: string;
    resourceId: string;
    resourceType: string;
    permission: Permission;
  }): Promise<void> {
    // This could trigger red team scenarios for privilege escalation detection
    auditLogger.logSecurityEvent('security.critical.access.monitored', {
      principalId: data.principalId,
      resourceId: data.resourceId,
      resourceType: data.resourceType,
      permission: data.permission
    });
  }

  /**
   * Validates code execution permission
   */
  async validateCodeExecution(
    agentId: string,
    code: string,
    resourceId: string
  ): Promise<SecurityValidationResult> {
    const checks: SecurityValidationResult['checks'] = {};
    const recommendations: string[] = [];

    // RBAC check for code execution
    if (this.config.enableRBAC) {
      const rbacCheck = await rbacSystem.checkAccess(
        agentId,
        resourceId,
        'code',
        'code.execute'
      );
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
  async validateTaskCreation(
    agentId: string,
    taskDescription: string,
    taskType: string
  ): Promise<SecurityValidationResult> {
    const checks: SecurityValidationResult['checks'] = {};

    // RBAC check
    if (this.config.enableRBAC) {
      const rbacCheck = await rbacSystem.checkAccess(
        agentId,
        'task',
        'task',
        'task.create'
      );
      checks.rbac = {
        allowed: rbacCheck.allowed,
        reason: rbacCheck.reason
      };
    }

    // Hallucination check on task description
    if (this.config.enableHallucinationCheck) {
      const claim: Claim = {
        id: `task_${Date.now()}`,
        text: taskDescription,
        context: 'task-creation',
        sourceAgentId: agentId,
        timestamp: new Date(),
        metadata: { taskType }
      };

      const hallucinationCheck = await hallucinationCheckSystem.checkClaim(claim);
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

// Export singleton instance
export const securityIntegration = new SecurityIntegration();

