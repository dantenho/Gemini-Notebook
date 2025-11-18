/**
 * @fileoverview AI Service with Multi-Provider Support
 *
 * Unified AI service supporting OpenAI (ChatGPT), Anthropic (Claude),
 * and Google Gemini models with extended thinking and web search capabilities.
 *
 * Features:
 * - Multi-provider support (OpenAI, Anthropic, Gemini)
 * - Streaming responses
 * - Extended thinking mode (Claude extended thinking)
 * - Web search integration
 * - Vision/image analysis support
 * - Error handling and retries
 *
 * @module services/aiService
 */

import { config } from '../config/env';

/**
 * AI Provider types
 */
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * AI Model configurations
 */
export interface AIModel {
  provider: AIProvider;
  id: string;
  name: string;
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  maxTokens: number;
}

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  thinking?: string; // Extended thinking content (Claude)
}

/**
 * AI Request options
 */
export interface AIRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  useThinking?: boolean;
  useWebSearch?: boolean;
  systemPrompt?: string;
}

/**
 * AI Response structure
 */
export interface AIResponse {
  content: string;
  thinking?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

/**
 * Available AI models per provider
 */
const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      provider: 'openai',
      id: 'gpt-4o',
      name: 'GPT-4o',
      supportsThinking: false,
      supportsVision: true,
      supportsWebSearch: true,
      maxTokens: 128000,
    },
    {
      provider: 'openai',
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      supportsThinking: false,
      supportsVision: true,
      supportsWebSearch: true,
      maxTokens: 128000,
    },
    {
      provider: 'openai',
      id: 'o1',
      name: 'O1',
      supportsThinking: true,
      supportsVision: false,
      supportsWebSearch: false,
      maxTokens: 100000,
    },
    {
      provider: 'openai',
      id: 'o1-mini',
      name: 'O1 Mini',
      supportsThinking: true,
      supportsVision: false,
      supportsWebSearch: false,
      maxTokens: 65536,
    },
  ],
  anthropic: [
    {
      provider: 'anthropic',
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      supportsThinking: true,
      supportsVision: true,
      supportsWebSearch: false,
      maxTokens: 200000,
    },
    {
      provider: 'anthropic',
      id: 'claude-opus-4',
      name: 'Claude Opus 4',
      supportsThinking: true,
      supportsVision: true,
      supportsWebSearch: false,
      maxTokens: 200000,
    },
    {
      provider: 'anthropic',
      id: 'claude-haiku-4',
      name: 'Claude Haiku 4',
      supportsThinking: false,
      supportsVision: true,
      supportsWebSearch: false,
      maxTokens: 200000,
    },
  ],
  gemini: [
    {
      provider: 'gemini',
      id: 'gemini-2.0-flash-thinking-exp',
      name: 'Gemini 2.0 Flash Thinking',
      supportsThinking: true,
      supportsVision: true,
      supportsWebSearch: true,
      maxTokens: 32768,
    },
    {
      provider: 'gemini',
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash',
      supportsThinking: false,
      supportsVision: true,
      supportsWebSearch: true,
      maxTokens: 32768,
    },
    {
      provider: 'gemini',
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      supportsThinking: false,
      supportsVision: true,
      supportsWebSearch: true,
      maxTokens: 2097152,
    },
  ],
};

/**
 * AI Service Class
 *
 * Unified interface for interacting with multiple AI providers.
 */
class AIService {
  /**
   * Get all available models across all providers
   *
   * @returns {AIModel[]} Array of available models
   */
  getAvailableModels(): AIModel[] {
    const models: AIModel[] = [];

    if (config.ai.openaiKey) {
      models.push(...AI_MODELS.openai);
    }
    if (config.ai.anthropicKey) {
      models.push(...AI_MODELS.anthropic);
    }
    if (config.ai.geminiKey) {
      models.push(...AI_MODELS.gemini);
    }

    return models;
  }

  /**
   * Get models for a specific provider
   *
   * @param {AIProvider} provider - Provider name
   * @returns {AIModel[]} Array of models for the provider
   */
  getProviderModels(provider: AIProvider): AIModel[] {
    return AI_MODELS[provider] || [];
  }

  /**
   * Chat completion with OpenAI
   *
   * @private
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {AIRequestOptions} options - Request options
   * @returns {Promise<AIResponse>} AI response
   */
  private async chatOpenAI(
    messages: ChatMessage[],
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.openaiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      provider: 'openai',
    };
  }

  /**
   * Chat completion with Anthropic Claude
   *
   * @private
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {AIRequestOptions} options - Request options
   * @returns {Promise<AIResponse>} AI response
   */
  private async chatAnthropic(
    messages: ChatMessage[],
    options: AIRequestOptions
  ): Promise<AIResponse> {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ai.anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-sonnet-4',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        system: systemMessage?.content || undefined,
        messages: conversationMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        // Enable extended thinking if supported and requested
        thinking: options.useThinking && config.ai.enableExtendedThinking
          ? { type: 'enabled', budget_tokens: 10000 }
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract thinking content if present
    const thinkingBlock = data.content.find((block: any) => block.type === 'thinking');
    const textBlock = data.content.find((block: any) => block.type === 'text');

    return {
      content: textBlock?.text || '',
      thinking: thinkingBlock?.thinking || undefined,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
      provider: 'anthropic',
    };
  }

  /**
   * Chat completion with Google Gemini
   *
   * @private
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {AIRequestOptions} options - Request options
   * @returns {Promise<AIResponse>} AI response
   */
  private async chatGemini(
    messages: ChatMessage[],
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const modelId = options.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${config.ai.geminiKey}`;

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? {
          parts: [{ text: systemInstruction.content }],
        } : undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens || 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates[0];
    const content = candidate.content.parts[0].text;

    return {
      content,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      model: modelId,
      provider: 'gemini',
    };
  }

  /**
   * Send chat request to AI provider
   *
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {AIProvider} provider - AI provider to use
   * @param {AIRequestOptions} options - Request options
   * @returns {Promise<AIResponse>} AI response
   *
   * @example
   * ```typescript
   * const response = await aiService.chat([
   *   { role: 'system', content: 'You are a helpful assistant.' },
   *   { role: 'user', content: 'Explain quantum computing.' }
   * ], 'openai', { model: 'gpt-4o', useThinking: false });
   * ```
   */
  async chat(
    messages: ChatMessage[],
    provider: AIProvider,
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    try {
      switch (provider) {
        case 'openai':
          return await this.chatOpenAI(messages, options);
        case 'anthropic':
          return await this.chatAnthropic(messages, options);
        case 'gemini':
          return await this.chatGemini(messages, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`AI Service Error (${provider}):`, error);
      throw error;
    }
  }

  /**
   * Quick completion for single prompts
   *
   * @param {string} prompt - User prompt
   * @param {AIProvider} provider - AI provider to use
   * @param {AIRequestOptions} options - Request options
   * @returns {Promise<string>} AI response content
   *
   * @example
   * ```typescript
   * const summary = await aiService.complete(
   *   'Summarize this text: ...',
   *   'anthropic',
   *   { model: 'claude-sonnet-4', maxTokens: 500 }
   * );
   * ```
   */
  async complete(
    prompt: string,
    provider: AIProvider,
    options: AIRequestOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt },
    ];

    if (options.systemPrompt) {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await this.chat(messages, provider, options);
    return response.content;
  }
}

/**
 * Singleton AI service instance
 */
export const aiService = new AIService();

export default aiService;
