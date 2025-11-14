/**
 * Code Analysis MCP Server for LAPA v1.0.0
 * 
 * This MCP server provides tools for code analysis and quality checking:
 * - Analyze code quality using LLM-as-Judge
 * - Check for security vulnerabilities
 * - Detect code smells and anti-patterns
 * - Validate code against patterns
 * - Generate code quality reports
 * - Check for hallucinations in code
 * 
 * Phase: MCP Server Creation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LLMJudge } from '../../orchestrator/llm-judge.ts';
import { hallucinationCheckSystem } from '../../security/hallucination-check.ts';
import { securityIntegration } from '../../security/integration.ts';
import { mcpSecurityManager } from '../mcp-security.ts';
import { eventBus } from '../../core/event-bus.ts';

// Code Analysis MCP Server configuration
export interface CodeAnalysisMCPServerConfig {
  llmJudge?: LLMJudge;
  enableSecurity?: boolean;
  defaultAgentId?: string;
}

/**
 * Code Analysis MCP Server
 * 
 * Provides MCP tools for code analysis and quality checking.
 */
export class CodeAnalysisMCPServer {
  private server: Server;
  private config: CodeAnalysisMCPServerConfig;
  private transport: StdioServerTransport | null = null;
  private llmJudge: LLMJudge;

  constructor(config: CodeAnalysisMCPServerConfig = {}) {
    this.config = {
      enableSecurity: true,
      ...config
    };

    // Initialize LLM Judge if not provided
    if (!this.config.llmJudge) {
      this.llmJudge = new LLMJudge({
        model: 'llama3.1',
        enableFuzzyRules: true,
        enableSoC: true,
        temperature: 0.3,
        maxTokens: 2000,
        judgmentThreshold: 0.7,
      });
    } else {
      this.llmJudge = this.config.llmJudge;
    }

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'lapa-code-analysis-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  /**
   * Sets up MCP tools
   */
  private setupTools(): void {
    // Tool: Analyze code quality
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'analyze_code_quality') {
        return this.handleAnalyzeCodeQuality(request.params.arguments as any);
      }
      if (request.params.name === 'check_security_vulnerabilities') {
        return this.handleCheckSecurityVulnerabilities(request.params.arguments as any);
      }
      if (request.params.name === 'detect_code_smells') {
        return this.handleDetectCodeSmells(request.params.arguments as any);
      }
      if (request.params.name === 'validate_code_patterns') {
        return this.handleValidateCodePatterns(request.params.arguments as any);
      }
      if (request.params.name === 'check_hallucinations') {
        return this.handleCheckHallucinations(request.params.arguments as any);
      }
      if (request.params.name === 'generate_quality_report') {
        return this.handleGenerateQualityReport(request.params.arguments as any);
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Tool: List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'analyze_code_quality',
            description: 'Analyze code quality using LLM-as-Judge',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to analyze'),
              language: z.string().optional().describe('Programming language'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
          {
            name: 'check_security_vulnerabilities',
            description: 'Check code for security vulnerabilities',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to check'),
              language: z.string().optional().describe('Programming language'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
          {
            name: 'detect_code_smells',
            description: 'Detect code smells and anti-patterns',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to analyze'),
              language: z.string().optional().describe('Programming language'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
          {
            name: 'validate_code_patterns',
            description: 'Validate code against patterns and best practices',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to validate'),
              patterns: z.array(z.string()).optional().describe('Patterns to validate against'),
              language: z.string().optional().describe('Programming language'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
          {
            name: 'check_hallucinations',
            description: 'Check code for hallucinations (fabricated references, etc.)',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to check'),
              context: z.string().optional().describe('Context for checking'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
          {
            name: 'generate_quality_report',
            description: 'Generate comprehensive code quality report',
            inputSchema: zodToJsonSchema(z.object({
              code: z.string().describe('Code to analyze'),
              language: z.string().optional().describe('Programming language'),
              agentId: z.string().optional().describe('Agent ID (required for security)'),
            })),
          },
        ],
      };
    });
  }

  /**
   * Handles analyze_code_quality tool call
   */
  private async handleAnalyzeCodeQuality(args: {
    code: string;
    language?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'code-analysis'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Analyze code quality using LLM Judge
      const judgment = await this.llmJudge.judge({
        type: 'code.quality',
        content: args.code,
        context: {
          language: args.language || 'typescript',
          agentId: agentId,
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: judgment.score,
              confidence: judgment.confidence,
              issues: judgment.issues,
              passed: judgment.score >= this.llmJudge['config'].judgmentThreshold * 100,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze code quality: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles check_security_vulnerabilities tool call
   */
  private async handleCheckSecurityVulnerabilities(args: {
    code: string;
    language?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'security-check'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Check for security vulnerabilities using security integration
      const securityValidation = await securityIntegration.validateCodeExecution(
        agentId || 'system',
        args.code,
        'security-check'
      );
      
      // Also use LLM Judge for security analysis
      const judgment = await this.llmJudge.judge({
        type: 'security',
        content: args.code,
        context: {
          language: args.language || 'typescript',
          agentId: agentId,
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              passed: securityValidation.passed,
              checks: securityValidation.checks,
              recommendations: securityValidation.recommendations,
              qualityScore: judgment.score,
              issues: judgment.issues.filter(issue => issue.severity === 'high'),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check security vulnerabilities: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles detect_code_smells tool call
   */
  private async handleDetectCodeSmells(args: {
    code: string;
    language?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'code-smells'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Detect code smells using LLM Judge
      const judgment = await this.llmJudge.judge({
        type: 'code.smells',
        content: args.code,
        context: {
          language: args.language || 'typescript',
          agentId: agentId,
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: judgment.score,
              confidence: judgment.confidence,
              issues: judgment.issues,
              codeSmells: judgment.issues.filter(issue => 
                issue.category.includes('smell') || 
                issue.category.includes('anti-pattern')
              ),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to detect code smells: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles validate_code_patterns tool call
   */
  private async handleValidateCodePatterns(args: {
    code: string;
    patterns?: string[];
    language?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'pattern-validation'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Validate code patterns using LLM Judge
      const judgment = await this.llmJudge.judge({
        type: 'code.patterns',
        content: args.code,
        context: {
          language: args.language || 'typescript',
          patterns: args.patterns || [],
          agentId: agentId,
        },
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: judgment.score,
              confidence: judgment.confidence,
              issues: judgment.issues,
              patterns: args.patterns || [],
              validated: judgment.score >= this.llmJudge['config'].judgmentThreshold * 100,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to validate code patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles check_hallucinations tool call
   */
  private async handleCheckHallucinations(args: {
    code: string;
    context?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'hallucination-check'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Check for hallucinations using hallucination check system
      const claim = {
        id: `code-hallucination-${Date.now()}`,
        text: args.code,
        context: args.context || 'code-analysis',
        sourceAgentId: agentId || 'system',
        timestamp: new Date(),
        metadata: {
          language: 'typescript',
        },
      };
      
      const hallucinationCheck = await hallucinationCheckSystem.checkClaim(claim);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isHallucination: hallucinationCheck.isHallucination,
              confidence: hallucinationCheck.confidence,
              evidence: hallucinationCheck.evidence,
              sources: hallucinationCheck.sources,
              vetoRecommended: hallucinationCheck.vetoRecommended,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check hallucinations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles generate_quality_report tool call
   */
  private async handleGenerateQualityReport(args: {
    code: string;
    language?: string;
    agentId?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const agentId = args.agentId || this.config.defaultAgentId;
    
    // Security check
    if (this.config.enableSecurity && agentId) {
      const securityCheck = await mcpSecurityManager.validateToolCall(
        agentId!,
        'code.read',
        args,
        'quality-report'
      );
      
      if (!securityCheck.passed) {
        throw new Error(`Security validation failed: ${securityCheck.checks.rbac?.reason}`);
      }
    }

    try {
      // Generate comprehensive quality report
      const [qualityJudgment, securityValidation, hallucinationCheck] = await Promise.all([
        this.llmJudge.judge({
          type: 'code.quality',
          content: args.code,
          context: {
            language: args.language || 'typescript',
            agentId: agentId,
          },
        }),
        securityIntegration.validateCodeExecution(
          agentId || 'system',
          args.code,
          'quality-report'
        ),
        hallucinationCheckSystem.checkClaim({
          id: `quality-report-${Date.now()}`,
          text: args.code,
          context: 'quality-report',
          sourceAgentId: agentId || 'system',
          timestamp: new Date(),
        }),
      ]);
      
      const report = {
        timestamp: Date.now(),
        agentId: agentId,
        language: args.language || 'typescript',
        quality: {
          score: qualityJudgment.score,
          confidence: qualityJudgment.confidence,
          issues: qualityJudgment.issues,
          passed: qualityJudgment.score >= this.llmJudge['config'].judgmentThreshold * 100,
        },
        security: {
          passed: securityValidation.passed,
          checks: securityValidation.checks,
          recommendations: securityValidation.recommendations,
        },
        hallucinations: {
          detected: hallucinationCheck.isHallucination,
          confidence: hallucinationCheck.confidence,
          evidence: hallucinationCheck.evidence,
          vetoRecommended: hallucinationCheck.vetoRecommended,
        },
        overall: {
          passed: qualityJudgment.score >= this.llmJudge['config'].judgmentThreshold * 100 &&
                  securityValidation.passed &&
                  !hallucinationCheck.isHallucination,
          score: (qualityJudgment.score + (securityValidation.passed ? 100 : 0) + 
                  (hallucinationCheck.isHallucination ? 0 : 100)) / 3,
        },
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate quality report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sets up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('Code Analysis MCP Server error:', error);
      eventBus.publish({
        id: `mcp-code-analysis-error-${Date.now()}`,
        type: 'mcp.server.error',
        timestamp: Date.now(),
        source: 'code-analysis-mcp-server',
        payload: {
          error: error.message,
          stack: error.stack,
        },
      }).catch(console.error);
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * Starts the MCP server
   */
  async start(): Promise<void> {
    try {
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      console.log('Code Analysis MCP Server started');
      
      eventBus.publish({
        id: `mcp-code-analysis-started-${Date.now()}`,
        type: 'mcp.server.started',
        timestamp: Date.now(),
        source: 'code-analysis-mcp-server',
        payload: {
          serverName: 'lapa-code-analysis-mcp-server',
          version: '1.0.0',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to start Code Analysis MCP Server:', error);
      throw error;
    }
  }

  /**
   * Stops the MCP server
   */
  async stop(): Promise<void> {
    try {
      if (this.transport) {
        await this.server.close();
        this.transport = null;
      }
      console.log('Code Analysis MCP Server stopped');
      
      eventBus.publish({
        id: `mcp-code-analysis-stopped-${Date.now()}`,
        type: 'mcp.server.stopped',
        timestamp: Date.now(),
        source: 'code-analysis-mcp-server',
        payload: {
          serverName: 'lapa-code-analysis-mcp-server',
        },
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to stop Code Analysis MCP Server:', error);
      throw error;
    }
  }
}

// Export factory function
export function createCodeAnalysisMCPServer(config?: CodeAnalysisMCPServerConfig): CodeAnalysisMCPServer {
  return new CodeAnalysisMCPServer(config);
}

