/**
 * Command-R Model Integration (Cohere)
 * 
 * Integration with Cohere's Command-R model for long-context multilingual support.
 * Command-R is optimized for long-context understanding and codebase analysis.
 */

import { eventBus } from '../../core/event-bus.ts';

export interface CommandRConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface CommandRRequest {
  messages: Array<{ role: string; content: string }>;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  language?: string;
}

export interface CommandRResponse {
  text: string;
  language?: string;
  tokensUsed?: number;
  latency: number;
  citations?: string[];
}

/**
 * Command-R Model Client
 */
export class CommandRModel {
  private config: Required<CommandRConfig>;
  private cohereClient: any;

  constructor(config: CommandRConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.cohere.ai/v1',
      model: config.model || 'command-r',
      timeout: config.timeout || 60000 // Longer timeout for long-context
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
        id: `command-r-init-${Date.now()}`,
        type: 'model.initialized',
        timestamp: Date.now(),
        source: 'command-r-model',
        payload: {
          model: 'command-r'
        }
      } as any);

      console.log('[Command-R] Model initialized');
    } catch (error) {
      console.error('[Command-R] Initialization failed:', error);
      throw new Error(
        `Failed to initialize Command-R model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generates text using Command-R model with chat interface
   */
  async chat(request: CommandRRequest): Promise<CommandRResponse> {
    const startTime = Date.now();

    try {
      if (!this.cohereClient) {
        await this.initialize();
      }

      // Build chat messages
      const chatMessages = request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: msg.content
      }));

      // Add language context if provided
      if (request.language) {
        chatMessages.unshift({
          role: 'USER',
          message: `[Language: ${request.language}]`
        });
      }

      // Call Cohere Chat API
      const response = await this.cohereClient.chat({
        model: this.config.model,
        message: chatMessages[chatMessages.length - 1]?.message || '',
        chatHistory: chatMessages.slice(0, -1),
        context: request.context,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
        connectors: [], // For citation support
        stream: false
      });

      const latency = Date.now() - startTime;

      const result: CommandRResponse = {
        text: response.text || '',
        language: request.language,
        tokensUsed: response.meta?.tokens?.input_tokens && response.meta?.tokens?.output_tokens
          ? response.meta.tokens.input_tokens + response.meta.tokens.output_tokens
          : undefined,
        latency,
        citations: response.citations?.map((c: any) => c.text) || []
      };

      await eventBus.publish({
        id: `command-r-chat-${Date.now()}`,
        type: 'model.generated',
        timestamp: Date.now(),
        source: 'command-r-model',
        payload: {
          latency,
          tokensUsed: result.tokensUsed
        }
      } as any);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      await eventBus.publish({
        id: `command-r-error-${Date.now()}`,
        type: 'model.error',
        timestamp: Date.now(),
        source: 'command-r-model',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          latency
        }
      } as any);

      throw new Error(
        `Command-R generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyzes codebase with long-context support
   */
  async analyzeCodebase(
    codebaseContext: string,
    query: string,
    options?: {
      language?: string;
      maxTokens?: number;
    }
  ): Promise<CommandRResponse> {
    const messages = [
      {
        role: 'user',
        content: `Analyze the following codebase and answer: ${query}\n\nCodebase Context:\n${codebaseContext}`
      }
    ];

    return await this.chat({
      messages,
      context: codebaseContext,
      maxTokens: options?.maxTokens || 4096,
      language: options?.language
    });
  }
}

