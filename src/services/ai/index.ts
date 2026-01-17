import { AIService } from './AIService';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { env } from '../../utils/env';
import type { AIServiceConfig } from './types';

/**
 * Initialize and configure the AI service with providers
 */
function initializeAIService(): AIService {
  const config: AIServiceConfig = {
    defaultProvider: env.ai.defaultProvider,
    apiKeys: {
      openai: env.ai.openaiKey,
      anthropic: env.ai.anthropicKey,
    },
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  };

  const service = new AIService(config);

  // Register OpenAI provider if API key is available
  if (env.ai.openaiKey) {
    const openaiProvider = new OpenAIProvider(env.ai.openaiKey);
    service.registerProvider(openaiProvider);
  }

  // Register Anthropic provider if API key is available
  if (env.ai.anthropicKey) {
    const anthropicProvider = new AnthropicProvider(env.ai.anthropicKey);
    service.registerProvider(anthropicProvider);
  }

  return service;
}

/**
 * Configured AI service instance
 * Ready to use with registered providers
 */
export const aiService = initializeAIService();

// Re-export types for convenience
export type { AIProvider, GenerateOptions, AIServiceConfig } from './types';
export { AIError } from './types';
