/**
 * LLM-as-Judge System for LAPA v1.2.2 — Phase 14
 * 
 * This module implements LLM-as-Judge for code quality assessment, validation,
 * and decision-making. It uses fuzzy rules and system prompt SoC (Separation of Concerns)
 * enforcement for reliable judgment.
 * 
 * Features:
 * - Code quality assessment
 * - Fuzzy rule-based evaluation
 * - System prompt SoC enforcement
 * - Hallucination detection
 * - Integration with event bus for judgment events
 */

import { eventBus } from '../core/event-bus.ts';
import { z } from 'zod';
import { ollama } from 'ollama';

// LLM Judge configuration
export interface LLMJudgeConfig {
  model: string; // Ollama model name
  enableFuzzyRules: boolean;
  enableSoC: boolean; // Enforce Separation of Concerns
  temperature: number;
  maxTokens: number;
  judgmentThreshold: number; // Confidence threshold (0-1)
}

// Judgment request
export interface JudgmentRequest {
  type: 'code-quality' | 'hallucination' | 'soc-violation' | 'test-validity' | 'other';
  content: string;
  context?: Record<string, unknown>;
  criteria?: string[]; // Specific criteria to evaluate
  reference?: string; // Reference content for comparison
}

// Judgment result
export interface JudgmentResult {
  success: boolean;
  verdict: 'pass' | 'fail' | 'partial' | 'uncertain';
  confidence: number; // 0-1
  score?: number; // 0-100
  reasoning: string;
  issues?: Array<{
    severity: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    suggestion?: string;
  }>;
  error?: string;
}

// Fuzzy rule definition
export interface FuzzyRule {
  id: string;
  name: string;
  description: string;
  category: 'code-quality' | 'security' | 'performance' | 'maintainability' | 'soc';
  weight: number; // 0-1, importance weight
  check: (content: string, context?: Record<string, unknown>) => Promise<{
    matches: boolean;
    confidence: number;
    details?: string;
  }>;
}

// Zod schema for judgment request
const judgmentRequestSchema = z.object({
  type: z.enum(['code-quality', 'hallucination', 'soc-violation', 'test-validity', 'other']),
  content: z.string().min(1),
  context: z.record(z.unknown()).optional(),
  criteria: z.array(z.string()).optional(),
  reference: z.string().optional()
});

/**
 * LLM-as-Judge System
 * 
 * Provides AI-powered judgment for code quality, hallucination detection,
 * and SoC enforcement using fuzzy rules and LLM evaluation.
 */
export class LLMJudge {
  private config: LLMJudgeConfig;
  private fuzzyRules: Map<string, FuzzyRule> = new Map();
  private judgmentHistory: Array<{ request: JudgmentRequest; result: JudgmentResult; timestamp: Date }> = [];

  constructor(config?: Partial<LLMJudgeConfig>) {
    this.config = {
      model: config?.model || 'llama3.1',
      enableFuzzyRules: config?.enableFuzzyRules ?? true,
      enableSoC: config?.enableSoC ?? true,
      temperature: config?.temperature ?? 0.3, // Lower temperature for more consistent judgments
      maxTokens: config?.maxTokens || 1000,
      judgmentThreshold: config?.judgmentThreshold ?? 0.7
    };

    // Initialize fuzzy rules
    this.initializeFuzzyRules();
  }

  /**
   * Initializes fuzzy rules for judgment
   */
  private initializeFuzzyRules(): void {
    // Code quality rules
    this.registerFuzzyRule({
      id: 'code-complexity',
      name: 'Code Complexity Check',
      description: 'Checks for excessive cyclomatic complexity',
      category: 'code-quality',
      weight: 0.8,
      check: async (content) => {
        // Heuristic: count nested structures
        const nestedCount = (content.match(/\{[^}]*\{/g) || []).length;
        const complexity = nestedCount / 10; // Normalize
        return {
          matches: complexity > 0.5,
          confidence: Math.min(complexity, 1.0),
          details: `Nested complexity: ${nestedCount} levels`
        };
      }
    });

    // SoC enforcement rules
    if (this.config.enableSoC) {
      this.registerFuzzyRule({
        id: 'soc-frontend-backend',
        name: 'Frontend-Backend Separation',
        description: 'Checks if frontend code directly accesses backend services',
        category: 'soc',
        weight: 1.0,
        check: async (content, context) => {
          const hasFrontend = /(react|vue|angular|component|jsx|tsx)/i.test(content);
          const hasBackendAccess = /(fetch|axios|http\.get|api\.call)/i.test(content);
          const hasServiceImport = /from\s+['"]\.\.\/services|from\s+['"]@\/services/i.test(content);
          
          if (hasFrontend && (hasBackendAccess || hasServiceImport)) {
            return {
              matches: true,
              confidence: 0.9,
              details: 'Frontend code directly accessing backend services violates SoC'
            };
          }
          
          return { matches: false, confidence: 0.1 };
        }
      });

      this.registerFuzzyRule({
        id: 'soc-layer-interdeps',
        name: 'Layer Interdependencies',
        description: 'Checks for proper layer separation (components/services/models)',
        category: 'soc',
        weight: 0.9,
        check: async (content, context) => {
          // Check for cross-layer imports
          const hasComponentImport = /from\s+['"]\.\.\/components|from\s+['"]@\/components/i.test(content);
          const hasServiceImport = /from\s+['"]\.\.\/services|from\s+['"]@\/services/i.test(content);
          const hasModelImport = /from\s+['"]\.\.\/models|from\s+['"]@\/models/i.test(content);
          
          // Services should not import components
          if (content.includes('/services/') && hasComponentImport) {
            return {
              matches: true,
              confidence: 0.95,
              details: 'Services should not import components - violates layer separation'
            };
          }
          
          // Components should not directly import models
          if (content.includes('/components/') && hasModelImport && !hasServiceImport) {
            return {
              matches: true,
              confidence: 0.85,
              details: 'Components should access models through services, not directly'
            };
          }
          
          return { matches: false, confidence: 0.1 };
        }
      });
    }

    // Security rules
    this.registerFuzzyRule({
      id: 'security-sensitive-data',
      name: 'Sensitive Data Exposure',
      description: 'Checks for potential sensitive data exposure',
      category: 'security',
      weight: 1.0,
      check: async (content) => {
        const sensitivePatterns = [
          /password\s*[:=]\s*['"][^'"]+['"]/i,
          /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
          /secret\s*[:=]\s*['"][^'"]+['"]/i,
          /token\s*[:=]\s*['"][^'"]+['"]/i
        ];

        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            return {
              matches: true,
              confidence: 0.95,
              details: 'Potential sensitive data exposure detected'
            };
          }
        }

        return { matches: false, confidence: 0.1 };
      }
    });

    // Performance rules
    this.registerFuzzyRule({
      id: 'performance-n-plus-one',
      name: 'N+1 Query Pattern',
      description: 'Detects potential N+1 query patterns',
      category: 'performance',
      weight: 0.7,
      check: async (content) => {
        // Heuristic: loops with database queries
        const hasLoop = /(for|while|forEach|map)\s*\(/.test(content);
        const hasQuery = /(query|select|find|get)\s*\(/i.test(content);
        
        if (hasLoop && hasQuery) {
          return {
            matches: true,
            confidence: 0.6,
            details: 'Potential N+1 query pattern detected in loop'
          };
        }
        
        return { matches: false, confidence: 0.1 };
      }
    });
  }

  /**
   * Registers a fuzzy rule
   */
  registerFuzzyRule(rule: FuzzyRule): void {
    this.fuzzyRules.set(rule.id, rule);
    console.log(`[LLMJudge] Registered fuzzy rule: ${rule.name} (${rule.id})`);
  }

  /**
   * Makes a judgment on content
   */
  async judge(request: JudgmentRequest): Promise<JudgmentResult> {
    const validated = judgmentRequestSchema.parse(request);

    try {
      // Apply fuzzy rules first
      const ruleResults: Array<{
        rule: FuzzyRule;
        result: { matches: boolean; confidence: number; details?: string };
      }> = [];

      if (this.config.enableFuzzyRules) {
        for (const rule of this.fuzzyRules.values()) {
          // Only check rules relevant to the judgment type
          if (rule.category === validated.type || validated.type === 'other') {
            const result = await rule.check(validated.content, validated.context);
            ruleResults.push({ rule, result });
          }
        }
      }

      // Calculate weighted score from fuzzy rules
      let weightedScore = 0;
      let totalWeight = 0;
      const issues: Array<{
        severity: 'low' | 'medium' | 'high';
        category: string;
        description: string;
        suggestion?: string;
      }> = [];

      for (const { rule, result } of ruleResults) {
        if (result.matches) {
          const ruleScore = result.confidence * rule.weight;
          weightedScore += ruleScore;
          totalWeight += rule.weight;

          // Determine severity based on rule weight and confidence
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (rule.weight >= 0.9 && result.confidence >= 0.8) {
            severity = 'high';
          } else if (rule.weight >= 0.7 || result.confidence >= 0.6) {
            severity = 'medium';
          }

          issues.push({
            severity,
            category: rule.category,
            description: result.details || rule.description,
            suggestion: this.generateSuggestion(rule, result)
          });
        }
      }

      // Normalize score (0-100)
      const normalizedScore = totalWeight > 0
        ? 100 * (1 - weightedScore / totalWeight)
        : 100;

      // Get LLM judgment for complex cases
      let llmReasoning = '';
      let llmConfidence = 0.5;

      if (validated.type === 'hallucination' || validated.type === 'code-quality' || issues.length > 0) {
        const llmResult = await this.getLLMJudgment(validated);
        llmReasoning = llmResult.reasoning;
        llmConfidence = llmResult.confidence;
      } else {
        llmReasoning = 'No issues detected by fuzzy rules.';
        llmConfidence = 0.9;
      }

      // Combine fuzzy rule results with LLM judgment
      const finalConfidence = (weightedScore + llmConfidence) / 2;
      const finalScore = normalizedScore * (1 - weightedScore / totalWeight) + (100 * (1 - llmConfidence));

      // Determine verdict
      let verdict: 'pass' | 'fail' | 'partial' | 'uncertain' = 'pass';
      if (finalScore < 50 || finalConfidence < this.config.judgmentThreshold) {
        verdict = 'fail';
      } else if (finalScore < 70 || issues.length > 0) {
        verdict = 'partial';
      } else if (finalConfidence < 0.8) {
        verdict = 'uncertain';
      }

      const result: JudgmentResult = {
        success: true,
        verdict,
        confidence: finalConfidence,
        score: finalScore,
        reasoning: llmReasoning + (issues.length > 0 ? `\n\nIssues detected: ${issues.length}` : ''),
        issues: issues.length > 0 ? issues : undefined
      };

      // Store in history
      this.judgmentHistory.push({
        request: validated,
        result,
        timestamp: new Date()
      });

      // Emit event
      eventBus.emit('llm-judge.judgment-made', {
        timestamp: Date.now(),
        source: 'llm-judge',
        payload: {
          type: validated.type,
          verdict: result.verdict,
          confidence: result.confidence,
          score: result.score
        }
      });

      return result;
    } catch (error) {
      console.error('[LLMJudge] Judgment failed:', error);
      
      return {
        success: false,
        verdict: 'uncertain',
        confidence: 0,
        reasoning: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets LLM judgment for complex cases
   */
  private async getLLMJudgment(request: JudgmentRequest): Promise<{
    reasoning: string;
    confidence: number;
  }> {
    try {
      const prompt = this.buildJudgmentPrompt(request);

      // Use Ollama for local LLM judgment
      const response = await ollama.generate({
        model: this.config.model,
        prompt,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      });

      // Parse LLM response
      const reasoning = response.response || 'No reasoning provided';
      const confidence = this.extractConfidence(reasoning);

      return { reasoning, confidence };
    } catch (error) {
      console.error('[LLMJudge] LLM judgment failed:', error);
      return {
        reasoning: 'LLM judgment unavailable',
        confidence: 0.5
      };
    }
  }

  /**
   * Builds judgment prompt for LLM
   */
  private buildJudgmentPrompt(request: JudgmentRequest): string {
    let prompt = `You are an expert code reviewer and quality judge. Evaluate the following content:\n\n`;
    
    prompt += `Type: ${request.type}\n\n`;
    prompt += `Content:\n${request.content}\n\n`;

    if (request.context) {
      prompt += `Context:\n${JSON.stringify(request.context, null, 2)}\n\n`;
    }

    if (request.criteria && request.criteria.length > 0) {
      prompt += `Criteria:\n${request.criteria.map(c => `- ${c}`).join('\n')}\n\n`;
    }

    if (request.reference) {
      prompt += `Reference:\n${request.reference}\n\n`;
    }

    if (this.config.enableSoC && request.type === 'soc-violation') {
      prompt += `\nSystem Prompt SoC Requirements:\n`;
      prompt += `- Frontend components should not directly access backend services\n`;
      prompt += `- Services should not directly access models (use APIs)\n`;
      prompt += `- Maintain strict layer separation: components → services → models\n`;
      prompt += `- Check for proper directory structure: /src/{components|services|models}\n\n`;
    }

    prompt += `Provide:\n`;
    prompt += `1. A clear verdict (pass/fail/partial)\n`;
    prompt += `2. Your confidence level (0-1)\n`;
    prompt += `3. Detailed reasoning\n`;
    prompt += `4. Any issues found with severity levels\n`;

    return prompt;
  }

  /**
   * Extracts confidence from LLM response
   */
  private extractConfidence(reasoning: string): number {
    // Try to extract confidence from reasoning
    const confidenceMatch = reasoning.match(/confidence[:\s]+([0-9.]+)/i);
    if (confidenceMatch) {
      return parseFloat(confidenceMatch[1]);
    }

    // Default confidence based on keywords
    if (reasoning.toLowerCase().includes('high confidence') || reasoning.toLowerCase().includes('certain')) {
      return 0.9;
    } else if (reasoning.toLowerCase().includes('medium confidence') || reasoning.toLowerCase().includes('likely')) {
      return 0.7;
    } else if (reasoning.toLowerCase().includes('low confidence') || reasoning.toLowerCase().includes('uncertain')) {
      return 0.5;
    }

    return 0.6; // Default
  }

  /**
   * Generates suggestion for a rule violation
   */
  private generateSuggestion(rule: FuzzyRule, result: { matches: boolean; confidence: number; details?: string }): string {
    if (rule.category === 'soc') {
      if (rule.id === 'soc-frontend-backend') {
        return 'Use API endpoints or service layer instead of direct backend access';
      } else if (rule.id === 'soc-layer-interdeps') {
        return 'Refactor to maintain proper layer separation (components → services → models)';
      }
    } else if (rule.category === 'security') {
      return 'Move sensitive data to environment variables or secure configuration';
    } else if (rule.category === 'performance') {
      return 'Consider batch operations or eager loading to avoid N+1 queries';
    } else if (rule.category === 'code-quality') {
      return 'Refactor to reduce complexity and improve maintainability';
    }

    return 'Review and refactor based on best practices';
  }

  /**
   * Gets judgment history
   */
  getJudgmentHistory(limit?: number): Array<{ request: JudgmentRequest; result: JudgmentResult; timestamp: Date }> {
    const history = [...this.judgmentHistory];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * Clears judgment history
   */
  clearHistory(): void {
    this.judgmentHistory = [];
    console.log('[LLMJudge] Judgment history cleared');
  }
}

// Export singleton instance
export const llmJudge = new LLMJudge();

