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
