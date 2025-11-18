/**
 * @fileoverview Environment Configuration
 *
 * Central configuration file for managing environment variables.
 * Uses Vite's import.meta.env for accessing environment variables.
 *
 * All environment variables must be prefixed with VITE_ to be
 * exposed to the client-side code.
 *
 * @module config/env
 */

/**
 * Application configuration from environment variables
 *
 * @constant
 * @type {Object}
 */
export const config = {
  /**
   * Google Drive API credentials
   */
  google: {
    /** OAuth 2.0 Client ID from Google Cloud Console */
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    /** API Key from Google Cloud Console */
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  },

  /**
   * AI API credentials
   */
  ai: {
    /** OpenAI API Key for ChatGPT models */
    openaiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    /** Anthropic API Key for Claude models */
    anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    /** Google Gemini API Key */
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    /** Enable web search feature */
    enableWebSearch: import.meta.env.VITE_ENABLE_WEB_SEARCH === 'true',
    /** Enable extended thinking mode */
    enableExtendedThinking: import.meta.env.VITE_ENABLE_EXTENDED_THINKING === 'true',
  },

  /**
   * Application settings
   */
  app: {
    /** Auto-sync delay in milliseconds (default: 30 seconds) */
    autoSyncDelay: Number(import.meta.env.VITE_AUTO_SYNC_DELAY) || 30000,
    /** Diagram render delay in milliseconds (default: 500ms) */
    diagramRenderDelay: Number(import.meta.env.VITE_DIAGRAM_RENDER_DELAY) || 500,
  },
};

/**
 * Validates that all required environment variables are present
 *
 * @returns {boolean} True if all required variables are set
 * @throws {Error} If required variables are missing
 */
export function validateConfig(): boolean {
  const missing: string[] = [];

  if (!config.google.clientId) {
    missing.push('VITE_GOOGLE_CLIENT_ID');
  }
  if (!config.google.apiKey) {
    missing.push('VITE_GOOGLE_API_KEY');
  }

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables: ${missing.join(', ')}\n` +
      'Google Drive sync will not be available.\n' +
      'Please create a .env file based on .env.example'
    );
    return false;
  }

  return true;
}

/**
 * Check if Google Drive integration is available
 *
 * @returns {boolean} True if Google Drive credentials are configured
 */
export function isGoogleDriveAvailable(): boolean {
  return !!(config.google.clientId && config.google.apiKey);
}

/**
 * Check if OpenAI integration is available
 *
 * @returns {boolean} True if OpenAI API key is configured
 */
export function isOpenAIAvailable(): boolean {
  return !!config.ai.openaiKey;
}

/**
 * Check if Anthropic integration is available
 *
 * @returns {boolean} True if Anthropic API key is configured
 */
export function isAnthropicAvailable(): boolean {
  return !!config.ai.anthropicKey;
}

/**
 * Check if Gemini integration is available
 *
 * @returns {boolean} True if Gemini API key is configured
 */
export function isGeminiAvailable(): boolean {
  return !!config.ai.geminiKey;
}

/**
 * Check if any AI provider is available
 *
 * @returns {boolean} True if at least one AI API key is configured
 */
export function isAIAvailable(): boolean {
  return isOpenAIAvailable() || isAnthropicAvailable() || isGeminiAvailable();
}

/**
 * Get list of available AI providers
 *
 * @returns {string[]} Array of available provider names
 */
export function getAvailableAIProviders(): string[] {
  const providers: string[] = [];
  if (isOpenAIAvailable()) providers.push('openai');
  if (isAnthropicAvailable()) providers.push('anthropic');
  if (isGeminiAvailable()) providers.push('gemini');
  return providers;
}
