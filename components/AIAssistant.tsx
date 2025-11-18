/**
 * @fileoverview AI Assistant Panel Component
 *
 * Interactive AI chat panel for the editor with multi-provider support.
 * Allows users to get AI assistance while writing notes.
 *
 * Features:
 * - Multi-provider support (OpenAI, Claude, Gemini)
 * - Model selection
 * - Chat interface with history
 * - Extended thinking display
 * - Insert AI responses into editor
 * - Web search toggle
 * - Streaming responses
 *
 * @module components/AIAssistant
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiService, AIProvider, ChatMessage, AIModel, AIResponse } from '../services/aiService';
import { config, getAvailableAIProviders } from '../config/env';
import { AIIcon, SpinnerIcon, CheckCircleIcon, SearchIcon } from '../constants';

/**
 * Props for AIAssistant component
 */
interface AIAssistantProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current note content for context */
  noteContent: string;
  /** Callback to insert AI response into editor */
  onInsert: (text: string) => void;
}

/**
 * AI Assistant Panel Component
 *
 * Provides an interactive chat interface with AI models.
 * Supports multiple providers and advanced features.
 *
 * @param {AIAssistantProps} props - Component props
 * @returns {JSX.Element | null} AI Assistant panel or null if closed
 */
export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  noteContent,
  onInsert,
}) => {
  // State
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [model, setModel] = useState<string>('claude-sonnet-4');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<string>('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Get available models for current provider
   */
  const availableModels = aiService.getProviderModels(provider);

  /**
   * Get available providers
   */
  const availableProviders = getAvailableAIProviders();

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Effect: Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Effect: Update model when provider changes
   */
  useEffect(() => {
    const models = aiService.getProviderModels(provider);
    if (models.length > 0) {
      setModel(models[0].id);
    }
  }, [provider]);

  /**
   * Handle provider change
   */
  const handleProviderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvider(e.target.value as AIProvider);
  }, []);

  /**
   * Handle model change
   */
  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  }, []);

  /**
   * Handle send message
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message to history
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);
    setCurrentThinking('');

    try {
      // Prepare conversation history
      const conversationMessages = [...messages, userMessage];

      // Add system message with note context if available
      if (noteContent) {
        conversationMessages.unshift({
          role: 'system',
          content: `You are a helpful AI assistant integrated into a note-taking app. The user is currently working on a note with the following content:\n\n${noteContent}\n\nProvide helpful, concise responses that can be inserted into the note.`,
        });
      }

      // Send request to AI
      const response: AIResponse = await aiService.chat(
        conversationMessages,
        provider,
        {
          model,
          useThinking,
          useWebSearch,
          maxTokens: 4096,
          temperature: 0.7,
        }
      );

      // Add assistant response to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        thinking: response.thinking,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show thinking if available
      if (response.thinking) {
        setCurrentThinking(response.thinking);
        setShowThinking(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Assistant Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, noteContent, provider, model, useThinking, useWebSearch]);

  /**
   * Handle insert response into editor
   */
  const handleInsertMessage = useCallback((content: string) => {
    onInsert(content);
  }, [onInsert]);

  /**
   * Handle clear conversation
   */
  const handleClear = useCallback(() => {
    setMessages([]);
    setCurrentThinking('');
    setShowThinking(false);
    setError(null);
  }, []);

  /**
   * Handle key press in input
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Don't render if not open
  if (!isOpen) return null;

  // Check if no providers available
  if (availableProviders.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">AI Not Configured</h2>
          <p className="text-zinc-300 mb-4">
            No AI providers are configured. Please add API keys to your .env file:
          </p>
          <ul className="text-sm text-zinc-400 mb-4 space-y-1">
            <li>• VITE_OPENAI_API_KEY</li>
            <li>• VITE_ANTHROPIC_API_KEY</li>
            <li>• VITE_GEMINI_API_KEY</li>
          </ul>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AIIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-zinc-100">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close AI Assistant"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Bar */}
        <div className="p-4 border-b border-zinc-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={handleProviderChange}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableProviders.includes('openai') && <option value="openai">OpenAI (ChatGPT)</option>}
                {availableProviders.includes('anthropic') && <option value="anthropic">Anthropic (Claude)</option>}
                {availableProviders.includes('gemini') && <option value="gemini">Google Gemini</option>}
              </select>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Model
              </label>
              <select
                value={model}
                onChange={handleModelChange}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="flex items-center gap-4">
            {/* Extended Thinking */}
            {availableModels.find(m => m.id === model)?.supportsThinking && (
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useThinking}
                  onChange={(e) => setUseThinking(e.target.checked)}
                  className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Extended Thinking</span>
              </label>
            )}

            {/* Web Search */}
            {config.ai.enableWebSearch && availableModels.find(m => m.id === model)?.supportsWebSearch && (
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <SearchIcon className="w-4 h-4" />
                <span>Web Search</span>
              </label>
            )}

            {/* Clear Button */}
            <button
              onClick={handleClear}
              disabled={messages.length === 0}
              className="ml-auto px-3 py-1 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
              <AIIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">AI Assistant Ready</p>
              <p className="text-sm">
                Ask questions about your note or request help with writing.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-100'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>

                {/* Insert Button for Assistant Messages */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleInsertMessage(message.content)}
                    className="mt-2 px-2 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 rounded transition-colors"
                  >
                    Insert into Note
                  </button>
                )}

                {/* Thinking Toggle for Assistant Messages */}
                {message.role === 'assistant' && message.thinking && (
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="mt-2 ml-2 px-2 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 rounded transition-colors"
                  >
                    {showThinking ? 'Hide' : 'Show'} Thinking
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Thinking Display */}
          {showThinking && currentThinking && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <SpinnerIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-zinc-300">Extended Thinking Process:</span>
              </div>
              <div className="text-sm text-zinc-400 whitespace-pre-wrap">
                {currentThinking}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-700 rounded-lg p-3 flex items-center gap-2">
                <SpinnerIcon className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-zinc-300">Thinking...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-700">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the AI assistant..."
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
            >
              {isLoading ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
