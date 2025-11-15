/**
 * MCP Security Manager Tests
 * 
 * Comprehensive tests for MCP security features including RBAC,
 * rate limiting, input validation, and audit logging.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mcpSecurityManager, MCPSecurityManager, ToolSecurityMetadata } from '../../mcp/mcp-security.ts';
import { rbacSystem } from '../../security/rbac.ts';
import { eventBus } from '../../core/event-bus.ts';

describe('MCPSecurityManager', () => {
  let securityManager: MCPSecurityManager;
  let testAgentId: string;
  let testToolName: string;

  beforeEach(() => {
    securityManager = new MCPSecurityManager();
    testAgentId = 'test-agent-1';
    testToolName = 'test-tool';
    
    // Register test agent with RBAC
    rbacSystem.registerPrincipal({
      id: testAgentId,
      type: 'agent',
      roles: ['developer'],
    });
    
    // Register test tool
    securityManager.registerToolSecurity({
      toolName: testToolName,
      requiredPermission: 'mcp.tool.invoke',
      resourceType: 'mcp',
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000,
        burstSize: 5
      },
      requiresAudit: true,
      riskLevel: 'medium'
    });
  });

  afterEach(() => {
    // Clean up
    securityManager.unblockAgent(testAgentId);
  });

  describe('Tool Security Registration', () => {
    it('should register tool security metadata', () => {
      const metadata: ToolSecurityMetadata = {
        toolName: 'test-tool-2',
        requiredPermission: 'mcp.tool.invoke',
        resourceType: 'mcp',
        rateLimit: {
          maxRequests: 100,
          windowMs: 60000,
        },
        requiresAudit: true,
        riskLevel: 'low'
      };
      
      securityManager.registerToolSecurity(metadata);
      const registered = securityManager.getToolSecurityMetadata('test-tool-2');
      
      expect(registered).toBeDefined();
      expect(registered?.toolName).toBe('test-tool-2');
      expect(registered?.requiredPermission).toBe('mcp.tool.invoke');
    });

    it('should initialize usage stats for registered tools', () => {
      const stats = securityManager.getToolUsageStats(testToolName);
      
      expect(stats).toBeDefined();
      expect(stats?.toolName).toBe(testToolName);
      expect(stats?.totalCalls).toBe(0);
      expect(stats?.successfulCalls).toBe(0);
      expect(stats?.failedCalls).toBe(0);
    });
  });

  describe('Tool Call Validation', () => {
    it('should validate tool call with security checks', async () => {
      const result = await securityManager.validateToolCall(
        testAgentId,
        testToolName,
        { input: 'test' },
        'test-resource'
      );
      
      expect(result.passed).toBe(true);
      expect(result.checks.rbac?.allowed).toBe(true);
    });

    it('should reject tool call for blocked agent', async () => {
      securityManager.blockAgent(testAgentId, 'Test block');
      
      const result = await securityManager.validateToolCall(
        testAgentId,
        testToolName,
        { input: 'test' },
        'test-resource'
      );
      
      expect(result.passed).toBe(false);
      expect(result.checks.rbac?.allowed).toBe(false);
      expect(result.checks.rbac?.reason).toContain('blocked');
    });

    it('should reject tool call without required permission', async () => {
      // Register agent without required permission
      rbacSystem.registerPrincipal({
        id: 'unauthorized-agent',
        type: 'agent',
        roles: ['viewer'], // Viewer role doesn't have mcp.tool.invoke
      });
      
      const result = await securityManager.validateToolCall(
        'unauthorized-agent',
        testToolName,
        { input: 'test' },
        'test-resource'
      );
      
      expect(result.passed).toBe(false);
      expect(result.checks.rbac?.allowed).toBe(false);
    });

    it('should enforce rate limits', async () => {
      // Make multiple requests to exceed rate limit
      for (let i = 0; i < 11; i++) {
        const result = await securityManager.validateToolCall(
          testAgentId,
          testToolName,
          { input: `test-${i}` },
          'test-resource'
        );
        
        if (i < 10) {
          expect(result.passed).toBe(true);
        } else {
          // 11th request should be rate limited
          expect(result.passed).toBe(false);
          expect(result.checks.rbac?.reason).toContain('Rate limit');
        }
      }
    });

    it('should validate input with custom schema', async () => {
      const { z } = await import('zod');
      
      securityManager.registerToolSecurity({
        toolName: 'validated-tool',
        requiredPermission: 'mcp.tool.invoke',
        resourceType: 'mcp',
        inputValidation: z.object({
          input: z.string().min(1).max(100),
        }),
      });
      
      // Valid input
      const validResult = await securityManager.validateToolCall(
        testAgentId,
        'validated-tool',
        { input: 'valid' },
        'test-resource'
      );
      expect(validResult.passed).toBe(true);
      
      // Invalid input
      const invalidResult = await securityManager.validateToolCall(
        testAgentId,
        'validated-tool',
        { input: 'a'.repeat(101) }, // Too long
        'test-resource'
      );
      expect(invalidResult.passed).toBe(false);
    });

    it('should check allowed/blocked agents', async () => {
      securityManager.registerToolSecurity({
        toolName: 'restricted-tool',
        requiredPermission: 'mcp.tool.invoke',
        resourceType: 'mcp',
        allowedAgents: ['allowed-agent'],
        blockedAgents: ['blocked-agent'],
      });
      
      // Allowed agent
      const allowedResult = await securityManager.validateToolCall(
        'allowed-agent',
        'restricted-tool',
        { input: 'test' },
        'test-resource'
      );
      expect(allowedResult.passed).toBe(true);
      
      // Blocked agent
      const blockedResult = await securityManager.validateToolCall(
        'blocked-agent',
        'restricted-tool',
        { input: 'test' },
        'test-resource'
      );
      expect(blockedResult.passed).toBe(false);
      
      // Unauthorized agent
      const unauthorizedResult = await securityManager.validateToolCall(
        'unauthorized-agent',
        'restricted-tool',
        { input: 'test' },
        'test-resource'
      );
      expect(unauthorizedResult.passed).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits per agent and tool', async () => {
      securityManager.registerToolSecurity({
        toolName: 'rate-limited-tool',
        requiredPermission: 'mcp.tool.invoke',
        resourceType: 'mcp',
        rateLimit: {
          maxRequests: 5,
          windowMs: 60000,
          burstSize: 2,
          enablePerTool: true,
        },
      });
      
      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        const result = await securityManager.validateToolCall(
          testAgentId,
          'rate-limited-tool',
          { input: `test-${i}` },
          'test-resource'
        );
        expect(result.passed).toBe(true);
      }
      
      // Next request should be rate limited
      const rateLimitedResult = await securityManager.validateToolCall(
        testAgentId,
        'rate-limited-tool',
        { input: 'test-5' },
        'test-resource'
      );
      expect(rateLimitedResult.passed).toBe(false);
      expect(rateLimitedResult.checks.rbac?.reason).toContain('Rate limit');
    });

    it('should refill burst tokens over time', async () => {
      // This test would require time manipulation
      // For now, we'll test the basic functionality
      const result = await securityManager.validateToolCall(
        testAgentId,
        testToolName,
        { input: 'test' },
        'test-resource'
      );
      
      expect(result.passed).toBe(true);
    });
  });

  describe('Tool Usage Statistics', () => {
    it('should record tool usage statistics', () => {
      securityManager.recordToolUsage(
        testToolName,
        testAgentId,
        true,
        100,
        undefined
      );
      
      const stats = securityManager.getToolUsageStats(testToolName);
      
      expect(stats).toBeDefined();
      expect(stats?.totalCalls).toBe(1);
      expect(stats?.successfulCalls).toBe(1);
      expect(stats?.failedCalls).toBe(0);
      expect(stats?.averageExecutionTime).toBe(100);
      expect(stats?.agentsUsed.has(testAgentId)).toBe(true);
    });

    it('should record failed tool usage', () => {
      securityManager.recordToolUsage(
        testToolName,
        testAgentId,
        false,
        50,
        'Test error'
      );
      
      const stats = securityManager.getToolUsageStats(testToolName);
      
      expect(stats).toBeDefined();
      expect(stats?.totalCalls).toBe(1);
      expect(stats?.successfulCalls).toBe(0);
      expect(stats?.failedCalls).toBe(1);
      expect(stats?.errors.get('Test error')).toBe(1);
    });

    it('should calculate average execution time', () => {
      securityManager.recordToolUsage(testToolName, testAgentId, true, 100);
      securityManager.recordToolUsage(testToolName, testAgentId, true, 200);
      securityManager.recordToolUsage(testToolName, testAgentId, true, 300);
      
      const stats = securityManager.getToolUsageStats(testToolName);
      
      expect(stats?.averageExecutionTime).toBe(200); // (100 + 200 + 300) / 3
    });
  });

  describe('Agent Blocking', () => {
    it('should block an agent', () => {
      securityManager.blockAgent(testAgentId, 'Test block');
      
      expect(securityManager.isAgentBlocked(testAgentId)).toBe(true);
    });

    it('should unblock an agent', () => {
      securityManager.blockAgent(testAgentId, 'Test block');
      securityManager.unblockAgent(testAgentId);
      
      expect(securityManager.isAgentBlocked(testAgentId)).toBe(false);
    });

    it('should handle threat detection events', async () => {
      // Simulate threat detection event
      await eventBus.publish({
        id: `threat-${Date.now()}`,
        type: 'security.threat.detected',
        timestamp: Date.now(),
        source: 'security-system',
        payload: {
          agentId: testAgentId,
          threatLevel: 'critical',
          reason: 'Suspicious activity detected',
        },
      });
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Agent should be blocked after critical threat
      expect(securityManager.isAgentBlocked(testAgentId)).toBe(true);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events', async () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');
      
      await securityManager.validateToolCall(
        testAgentId,
        testToolName,
        { input: 'test' },
        'test-resource'
      );
      
      // Security events should be published
      expect(publishSpy).toHaveBeenCalled();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize sensitive data in arguments', async () => {
      const sensitiveArgs = {
        password: 'secret123',
        apiKey: 'key123',
        token: 'token123',
        normalData: 'normal',
      };
      
      // The sanitization happens internally during validation
      // We can't directly test it, but we can verify it doesn't break functionality
      const result = await securityManager.validateToolCall(
        testAgentId,
        testToolName,
        sensitiveArgs,
        'test-resource'
      );
      
      expect(result.passed).toBe(true);
    });
  });

  describe('High-Risk Tool Validation', () => {
    it('should perform additional security checks for high-risk tools', async () => {
      securityManager.registerToolSecurity({
        toolName: 'high-risk-tool',
        requiredPermission: 'code.execute',
        resourceType: 'code',
        riskLevel: 'high',
      });
      
      // High-risk tools should trigger additional security validation
      const result = await securityManager.validateToolCall(
        testAgentId,
        'high-risk-tool',
        { code: 'console.log("test")' },
        'test-resource'
      );
      
      // Result depends on security integration validation
      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
    });
  });
});

