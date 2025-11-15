/**
 * MCP Security Module for LAPA v1.0.0
 * 
 * This module provides comprehensive security features for MCP (Model Context Protocol) operations:
 * - RBAC integration for tool access control
 * - Input validation and sanitization
 * - Rate limiting and request throttling
 * - Audit logging for all MCP operations
 * - Suspicious activity detection
 * - Tool usage analytics
 * 
 * Phase: Security Enhancement for MCP
 */

import { rbacSystem, Permission, ResourceType } from '../security/rbac.ts';
import { securityIntegration, SecurityValidationResult } from '../security/integration.ts';
import { auditLogger } from '../premium/audit.logger.ts';
import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';

// Rate limiting configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstSize?: number;
  enablePerTool?: boolean;
}

// Tool security metadata
export interface ToolSecurityMetadata {
  toolName: string;
  requiredPermission: Permission;
  resourceType: ResourceType;
  rateLimit?: RateLimitConfig;
  inputValidation?: z.ZodTypeAny;
  allowedAgents?: string[];
  blockedAgents?: string[];
  requiresAudit?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// Rate limiter state
interface RateLimitState {
  requests: number[];
  burstTokens: number;
  lastRefill: number;
}

// Security audit event
export interface MCPSecurityAuditEvent {
  id: string;
  timestamp: number;
  agentId: string;
  toolName: string;
  action: 'tool.call' | 'tool.discover' | 'resource.read' | 'prompt.get';
  result: 'allowed' | 'blocked' | 'rate_limited' | 'validation_failed';
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Tool usage statistics
export interface ToolUsageStats {
  toolName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
  lastCalled: number;
  agentsUsed: Set<string>;
  errors: Map<string, number>;
}

/**
 * MCP Security Manager
 * 
 * Provides comprehensive security features for MCP operations including RBAC,
 * rate limiting, input validation, and audit logging.
 */
export class MCPSecurityManager {
  private toolSecurityMetadata: Map<string, ToolSecurityMetadata> = new Map();
  private rateLimiters: Map<string, RateLimitState> = new Map();
  private toolUsageStats: Map<string, ToolUsageStats> = new Map();
  private blockedAgents: Set<string> = new Set();
  private suspiciousActivity: Map<string, number> = new Map();
  
  private defaultRateLimit: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    burstSize: 10,
    enablePerTool: true
  };

  constructor() {
    this.setupEventListeners();
    this.initializeDefaultSecurityMetadata();
  }

  /**
   * Sets up event listeners for security monitoring
   */
  private setupEventListeners(): void {
    // Listen for agent events
    eventBus.subscribe('agent.created' as any, (event: any) => {
      this.handleAgentCreated(event);
    });

    eventBus.subscribe('agent.deleted' as any, (event: any) => {
      this.handleAgentDeleted(event);
    });

    // Listen for security events
    eventBus.subscribe('security.threat.detected' as any, (event: any) => {
      this.handleThreatDetected(event);
    });
  }

  /**
   * Handles agent creation event
   */
  private handleAgentCreated(event: any): void {
    const agentId = event.payload?.agentId;
    if (agentId) {
      // Initialize rate limiter for new agent
      this.initializeRateLimiter(agentId);
    }
  }

  /**
   * Handles agent deletion event
   */
  private handleAgentDeleted(event: any): void {
    const agentId = event.payload?.agentId;
    if (agentId) {
      // Clean up rate limiter for deleted agent
      this.rateLimiters.delete(agentId);
      this.suspiciousActivity.delete(agentId);
    }
  }

  /**
   * Handles threat detection event
   */
  private handleThreatDetected(event: any): void {
    const agentId = event.payload?.agentId;
    const threatLevel = event.payload?.threatLevel || 'medium';
    
    if (agentId) {
      // Increment suspicious activity counter
      const currentCount = this.suspiciousActivity.get(agentId) || 0;
      this.suspiciousActivity.set(agentId, currentCount + 1);

      // Block agent if threat level is critical or suspicious activity is high
      if (threatLevel === 'critical' || currentCount >= 5) {
        this.blockAgent(agentId, 'Threat detected: ' + (event.payload?.reason || 'Unknown'));
      }
    }
  }

  /**
   * Initializes default security metadata for common tools
   */
  private initializeDefaultSecurityMetadata(): void {
    // Code execution tools - high risk
    this.registerToolSecurity({
      toolName: 'executeCode',
      requiredPermission: 'code.execute',
      resourceType: 'code',
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000,
        burstSize: 5
      },
      requiresAudit: true,
      riskLevel: 'high'
    });

    // File operations - medium risk
    this.registerToolSecurity({
      toolName: 'readFile',
      requiredPermission: 'code.read',
      resourceType: 'code',
      rateLimit: {
        maxRequests: 200,
        windowMs: 60000,
        burstSize: 20
      },
      requiresAudit: true,
      riskLevel: 'medium'
    });

    this.registerToolSecurity({
      toolName: 'writeFile',
      requiredPermission: 'code.write',
      resourceType: 'code',
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
        burstSize: 10
      },
      requiresAudit: true,
      riskLevel: 'high'
    });

    // Memory operations - low risk
    this.registerToolSecurity({
      toolName: 'readMemory',
      requiredPermission: 'memory.read',
      resourceType: 'memory',
      rateLimit: {
        maxRequests: 500,
        windowMs: 60000,
        burstSize: 50
      },
      requiresAudit: false,
      riskLevel: 'low'
    });

    // MCP tool invocation - medium risk
    this.registerToolSecurity({
      toolName: 'mcp.tool.invoke',
      requiredPermission: 'mcp.tool.invoke',
      resourceType: 'mcp',
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
        burstSize: 10
      },
      requiresAudit: true,
      riskLevel: 'medium'
    });
  }

  /**
   * Registers security metadata for a tool
   */
  registerToolSecurity(metadata: ToolSecurityMetadata): void {
    this.toolSecurityMetadata.set(metadata.toolName, metadata);
    
    // Initialize usage stats
    if (!this.toolUsageStats.has(metadata.toolName)) {
      this.toolUsageStats.set(metadata.toolName, {
        toolName: metadata.toolName,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageExecutionTime: 0,
        lastCalled: 0,
        agentsUsed: new Set(),
        errors: new Map()
      });
    }

    // Log security metadata registration
    auditLogger.logSecurityEvent('mcp.security.tool.registered', {
      toolName: metadata.toolName,
      requiredPermission: metadata.requiredPermission,
      riskLevel: metadata.riskLevel
    });
  }

  /**
   * Validates tool call with security checks
   */
  async validateToolCall(
    agentId: string,
    toolName: string,
    arguments_: Record<string, unknown>,
    resourceId?: string
  ): Promise<SecurityValidationResult> {
    const startTime = Date.now();
    const metadata = this.toolSecurityMetadata.get(toolName);
    
    // Check if agent is blocked
    if (this.blockedAgents.has(agentId)) {
      await this.logSecurityEvent({
        id: `mcp-security-${Date.now()}`,
        timestamp: Date.now(),
        agentId,
        toolName,
        action: 'tool.call',
        result: 'blocked',
        reason: 'Agent is blocked'
      });
      
      return {
        passed: false,
        checks: {
          rbac: {
            allowed: false,
            reason: 'Agent is blocked'
          }
        },
        recommendations: ['Agent has been blocked due to security violations']
      };
    }

    // Check rate limiting
    const rateLimitResult = await this.checkRateLimit(agentId, toolName);
    if (!rateLimitResult.allowed) {
      await this.logSecurityEvent({
        id: `mcp-security-${Date.now()}`,
        timestamp: Date.now(),
        agentId,
        toolName,
        action: 'tool.call',
        result: 'rate_limited',
        reason: rateLimitResult.reason
      });
      
      return {
        passed: false,
        checks: {
          rbac: {
            allowed: false,
            reason: rateLimitResult.reason
          }
        },
        recommendations: ['Rate limit exceeded. Please wait before retrying.']
      };
    }

    // Check tool-specific security metadata
    if (metadata) {
      // Check RBAC permission
      if (metadata.requiredPermission) {
        const rbacCheck = await rbacSystem.checkAccess(
          agentId,
          resourceId || toolName,
          metadata.resourceType,
          metadata.requiredPermission
        );

        if (!rbacCheck.allowed) {
          await this.logSecurityEvent({
            id: `mcp-security-${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            toolName,
            action: 'tool.call',
            result: 'blocked',
            reason: rbacCheck.reason || 'Insufficient permissions'
          });
          
          return {
            passed: false,
            checks: {
              rbac: {
                allowed: false,
                reason: rbacCheck.reason
              }
            },
            recommendations: [`Agent does not have ${metadata.requiredPermission} permission`]
          };
        }
      }

      // Check allowed/blocked agents
      if (metadata.allowedAgents && !metadata.allowedAgents.includes(agentId)) {
        await this.logSecurityEvent({
          id: `mcp-security-${Date.now()}`,
          timestamp: Date.now(),
          agentId,
          toolName,
          action: 'tool.call',
          result: 'blocked',
          reason: 'Agent not in allowed list'
        });
        
        return {
          passed: false,
          checks: {
            rbac: {
              allowed: false,
              reason: 'Agent not in allowed list'
            }
          },
          recommendations: ['Agent is not authorized to use this tool']
        };
      }

      if (metadata.blockedAgents && metadata.blockedAgents.includes(agentId)) {
        await this.logSecurityEvent({
          id: `mcp-security-${Date.now()}`,
          timestamp: Date.now(),
          agentId,
          toolName,
          action: 'tool.call',
          result: 'blocked',
          reason: 'Agent is in blocked list'
        });
        
        return {
          passed: false,
          checks: {
            rbac: {
              allowed: false,
              reason: 'Agent is in blocked list'
            }
          },
          recommendations: ['Agent is blocked from using this tool']
        };
      }

      // Validate input with custom schema if provided
      if (metadata.inputValidation) {
        try {
          metadata.inputValidation.parse(arguments_);
        } catch (error) {
          await this.logSecurityEvent({
            id: `mcp-security-${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            toolName,
            action: 'tool.call',
            result: 'validation_failed',
            reason: error instanceof Error ? error.message : 'Invalid input'
          });
          
          return {
            passed: false,
            checks: {
              rbac: {
                allowed: false,
                reason: 'Input validation failed'
              }
            },
            recommendations: ['Tool arguments failed validation']
          };
        }
      }

      // Additional security validation for high-risk tools
      if (metadata.riskLevel === 'high' || metadata.riskLevel === 'critical') {
        const securityCheck = await securityIntegration.validateCodeExecution(
          agentId,
          JSON.stringify(arguments_),
          resourceId || toolName
        );

        if (!securityCheck.passed) {
          await this.logSecurityEvent({
            id: `mcp-security-${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            toolName,
            action: 'tool.call',
            result: 'blocked',
            reason: 'Security validation failed',
            metadata: securityCheck.checks
          });
          
          return securityCheck;
        }
      }
    }

    // Log successful validation
    if (metadata?.requiresAudit) {
      await this.logSecurityEvent({
        id: `mcp-security-${Date.now()}`,
        timestamp: Date.now(),
        agentId,
        toolName,
        action: 'tool.call',
        result: 'allowed',
        metadata: {
          executionTime: Date.now() - startTime,
          arguments: this.sanitizeArguments(arguments_)
        }
      });
    }

    return {
      passed: true,
      checks: {
        rbac: {
          allowed: true
        }
      }
    };
  }

  /**
   * Checks rate limit for agent and tool
   */
  private async checkRateLimit(agentId: string, toolName: string): Promise<{ allowed: boolean; reason?: string }> {
    const metadata = this.toolSecurityMetadata.get(toolName);
    const rateLimit = metadata?.rateLimit || this.defaultRateLimit;
    const key = rateLimit.enablePerTool ? `${agentId}:${toolName}` : agentId;
    
    let limiter = this.rateLimiters.get(key);
    if (!limiter) {
      limiter = this.initializeRateLimiter(key);
    }

    const now = Date.now();
    
    // Refill burst tokens
    const timeSinceRefill = now - limiter.lastRefill;
    const refillInterval = rateLimit.windowMs / rateLimit.maxRequests;
    const tokensToAdd = Math.floor(timeSinceRefill / refillInterval);
    
    if (tokensToAdd > 0) {
      limiter.burstTokens = Math.min(
        rateLimit.burstSize || rateLimit.maxRequests,
        limiter.burstTokens + tokensToAdd
      );
      limiter.lastRefill = now;
    }

    // Clean old requests outside the window
    limiter.requests = limiter.requests.filter(
      timestamp => now - timestamp < rateLimit.windowMs
    );

    // Check if we can make a request
    if (limiter.requests.length >= rateLimit.maxRequests) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${rateLimit.maxRequests} requests per ${rateLimit.windowMs}ms`
      };
    }

    // Check burst limit
    if (limiter.burstTokens <= 0) {
      return {
        allowed: false,
        reason: `Burst limit exceeded: ${rateLimit.burstSize} requests`
      };
    }

    // Allow request
    limiter.requests.push(now);
    limiter.burstTokens--;
    this.rateLimiters.set(key, limiter);

    return { allowed: true };
  }

  /**
   * Initializes rate limiter for agent/tool
   */
  private initializeRateLimiter(key: string): RateLimitState {
    const metadata = this.toolSecurityMetadata.get(key.split(':')[1] || key);
    const rateLimit = metadata?.rateLimit || this.defaultRateLimit;
    
    const limiter: RateLimitState = {
      requests: [],
      burstTokens: rateLimit.burstSize || rateLimit.maxRequests,
      lastRefill: Date.now()
    };
    
    this.rateLimiters.set(key, limiter);
    return limiter;
  }

  /**
   * Sanitizes tool arguments for logging
   */
  private sanitizeArguments(arguments_: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'apiKey', 'auth'];
    
    for (const [key, value] of Object.entries(arguments_)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... (truncated)';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Records tool usage statistics
   */
  recordToolUsage(
    toolName: string,
    agentId: string,
    success: boolean,
    executionTime: number,
    error?: string
  ): void {
    let stats = this.toolUsageStats.get(toolName);
    if (!stats) {
      stats = {
        toolName,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageExecutionTime: 0,
        lastCalled: 0,
        agentsUsed: new Set(),
        errors: new Map()
      };
      this.toolUsageStats.set(toolName, stats);
    }

    stats.totalCalls++;
    stats.lastCalled = Date.now();
    stats.agentsUsed.add(agentId);

    if (success) {
      stats.successfulCalls++;
      // Update average execution time
      stats.averageExecutionTime = 
        (stats.averageExecutionTime * (stats.successfulCalls - 1) + executionTime) / 
        stats.successfulCalls;
    } else {
      stats.failedCalls++;
      if (error) {
        const errorCount = stats.errors.get(error) || 0;
        stats.errors.set(error, errorCount + 1);
      }
    }
  }

  /**
   * Logs security event
   */
  private async logSecurityEvent(event: MCPSecurityAuditEvent): Promise<void> {
    // Log to audit logger
    auditLogger.logSecurityEvent('mcp.security.event', {
      ...event,
      severity: event.result === 'allowed' ? 'info' : 'warning'
    });

    // Publish event to event bus
    await eventBus.publish({
      id: event.id,
      type: 'mcp.security.event',
      timestamp: event.timestamp,
      source: 'mcp-security',
      payload: event
    });
  }

  /**
   * Blocks an agent from using MCP tools
   */
  blockAgent(agentId: string, reason: string): void {
    this.blockedAgents.add(agentId);
    
    auditLogger.logSecurityEvent('mcp.security.agent.blocked', {
      agentId,
      reason,
      timestamp: Date.now()
    });

    eventBus.publish({
      id: `mcp-security-block-${Date.now()}`,
      type: 'mcp.security.agent.blocked',
      timestamp: Date.now(),
      source: 'mcp-security',
      payload: {
        agentId,
        reason
      }
    });
  }

  /**
   * Unblocks an agent
   */
  unblockAgent(agentId: string): void {
    this.blockedAgents.delete(agentId);
    this.suspiciousActivity.delete(agentId);
    
    auditLogger.logSecurityEvent('mcp.security.agent.unblocked', {
      agentId,
      timestamp: Date.now()
    });
  }

  /**
   * Gets tool usage statistics
   */
  getToolUsageStats(toolName: string): ToolUsageStats | undefined {
    return this.toolUsageStats.get(toolName);
  }

  /**
   * Gets all tool usage statistics
   */
  getAllToolUsageStats(): Map<string, ToolUsageStats> {
    return new Map(this.toolUsageStats);
  }

  /**
   * Gets security metadata for a tool
   */
  getToolSecurityMetadata(toolName: string): ToolSecurityMetadata | undefined {
    return this.toolSecurityMetadata.get(toolName);
  }

  /**
   * Checks if an agent is blocked
   */
  isAgentBlocked(agentId: string): boolean {
    return this.blockedAgents.has(agentId);
  }
}

// Export singleton instance
export const mcpSecurityManager = new MCPSecurityManager();

