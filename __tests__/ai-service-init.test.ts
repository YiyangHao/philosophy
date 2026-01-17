import { describe, it, expect } from 'vitest';
import { AIService } from '../src/services/ai/AIService';
import { OpenAIProvider } from '../src/services/ai/providers/OpenAIProvider';
import { AnthropicProvider } from '../src/services/ai/providers/AnthropicProvider';
import type { AIServiceConfig } from '../src/services/ai/types';

/**
 * Integration tests for AI service initialization
 * Task 15.1: Write integration tests for AI service initialization
 * Requirements: 7.1, 7.2, 7.4
 */

describe('AI Service Initialization', () => {
  it('should initialize aiService with correct default provider from config', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'openai',
      apiKeys: {
        openai: 'test-openai-key',
        anthropic: 'test-anthropic-key',
      },
    };

    const service = new AIService(config);
    expect(service.getCurrentProvider()).toBe('openai');
  });

  it('should register OpenAI provider when API key is available', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'openai',
      apiKeys: {
        openai: 'test-openai-key',
      },
    };

    const service = new AIService(config);
    const provider = new OpenAIProvider('test-openai-key');
    service.registerProvider(provider);

    const providers = service.getAvailableProviders();
    expect(providers).toContain('openai');
  });

  it('should register Anthropic provider when API key is available', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'anthropic',
      apiKeys: {
        anthropic: 'test-anthropic-key',
      },
    };

    const service = new AIService(config);
    const provider = new AnthropicProvider('test-anthropic-key');
    service.registerProvider(provider);

    const providers = service.getAvailableProviders();
    expect(providers).toContain('anthropic');
  });

  it('should register both providers when both API keys are available', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'openai',
      apiKeys: {
        openai: 'test-openai-key',
        anthropic: 'test-anthropic-key',
      },
    };

    const service = new AIService(config);
    const openaiProvider = new OpenAIProvider('test-openai-key');
    const anthropicProvider = new AnthropicProvider('test-anthropic-key');
    
    service.registerProvider(openaiProvider);
    service.registerProvider(anthropicProvider);

    const providers = service.getAvailableProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers.length).toBe(2);
  });

  it('should use default provider from config', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'anthropic',
      apiKeys: {
        openai: 'test-openai-key',
        anthropic: 'test-anthropic-key',
      },
    };

    const service = new AIService(config);
    expect(service.getCurrentProvider()).toBe('anthropic');
  });

  it('should allow switching between registered providers', () => {
    const config: AIServiceConfig = {
      defaultProvider: 'openai',
      apiKeys: {
        openai: 'test-openai-key',
        anthropic: 'test-anthropic-key',
      },
    };

    const service = new AIService(config);
    const openaiProvider = new OpenAIProvider('test-openai-key');
    const anthropicProvider = new AnthropicProvider('test-anthropic-key');
    
    service.registerProvider(openaiProvider);
    service.registerProvider(anthropicProvider);

    expect(service.getCurrentProvider()).toBe('openai');
    
    service.setProvider('anthropic');
    expect(service.getCurrentProvider()).toBe('anthropic');
    
    service.setProvider('openai');
    expect(service.getCurrentProvider()).toBe('openai');
  });
});
