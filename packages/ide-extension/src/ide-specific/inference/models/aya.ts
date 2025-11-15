/**
 * Aya Model Integration (Cohere)
 * 
 * Integration with Cohere's Aya model for multilingual codebase support.
 * Aya is optimized for multilingual understanding and code generation.
 */

import { eventBus } from '../../core/event-bus.ts';

export interface AyaConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface AyaRequest {
  prompt: string;
  language?: string; // Target language
  maxTokens?: number;
  temperature?: number;
  context?: string;
}

export interface AyaResponse {
  text: string;
  language?: string;
  tokensUsed?: number;
  latency: number;
}

/**
 * Aya Model Client
 */
export class AyaModel {
  private config: Required<AyaConfig>;
  private cohereClient: any;

  constructor(config: AyaConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.cohere.ai/v1',
      model: config.model || 'aya',
      timeout: config.timeout || 30000
    };
  }

  /**
   * Initializes the Cohere client
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import of Cohere SDK
      const { CohereClient } = await import('cohere-ai');
      this.cohereClient = new CohereClient({
        token: this.config.apiKey
      });

      await eventBus.publish({
        id: `aya-init-${Date.now()}`,
        type: 'model.initialized',
        timestamp: Date.now(),
        source: 'aya-model',
        payload: {
          model: 'aya'
        }
      } as any);

      console.log('[Aya] Model initialized');
    } catch (error) {
      console.error('[Aya] Initialization failed:', error);
      throw new Error(
        `Failed to initialize Aya model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generates text using Aya model
   */
  async generate(request: AyaRequest): Promise<AyaResponse> {
    const startTime = Date.now();

    try {
      if (!this.cohereClient) {
        await this.initialize();
      }

      // Build prompt with language context if provided
      let prompt = request.prompt;
      if (request.language) {
        prompt = `[Language: ${request.language}]\n\n${prompt}`;
      }
      if (request.context) {
        prompt = `Context: ${request.context}\n\n${prompt}`;
      }

      // Call Cohere API
      const response = await this.cohereClient.generate({
        model: this.config.model,
        prompt: prompt,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        stop_sequences: [],
        stream: false
      });

      const latency = Date.now() - startTime;

      const result: AyaResponse = {
        text: response.generations[0]?.text || '',
        language: request.language,
        tokensUsed: response.meta?.tokens?.input_tokens && response.meta?.tokens?.output_tokens
          ? response.meta.tokens.input_tokens + response.meta.tokens.output_tokens
          : undefined,
        latency
      };

      await eventBus.publish({
        id: `aya-generate-${Date.now()}`,
        type: 'model.generated',
        timestamp: Date.now(),
        source: 'aya-model',
        payload: {
          latency,
          tokensUsed: result.tokensUsed
        }
      } as any);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      await eventBus.publish({
        id: `aya-error-${Date.now()}`,
        type: 'model.error',
        timestamp: Date.now(),
        source: 'aya-model',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          latency
        }
      } as any);

      throw new Error(
        `Aya generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detects language of input text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      if (!this.cohereClient) {
        await this.initialize();
      }

      // Use language detection endpoint or heuristic
      // For now, use franc library as fallback
      try {
        const franc = await import('franc');
        const detected = franc.default(text);
        return detected || 'unknown';
      } catch {
        return 'unknown';
      }
    } catch (error) {
      console.error('[Aya] Language detection failed:', error);
      return 'unknown';
    }
  }

  /**
   * Translates code/text to target language
   */
  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    const prompt = sourceLanguage
      ? `Translate the following ${sourceLanguage} code/text to ${targetLanguage}:\n\n${text}`
      : `Translate the following code/text to ${targetLanguage}:\n\n${text}`;

    const response = await this.generate({
      prompt,
      language: targetLanguage,
      maxTokens: Math.ceil(text.length * 2)
    });

    return response.text;
  }
}

