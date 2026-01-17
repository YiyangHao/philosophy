import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../AIService';
import { AIError } from '../types';
import type { AIProvider, AIServiceConfig } from '../types';

describe('AIService', () => {
  let config: AIServiceConfig;
  let mockProvider: AIProvider;
  let service: AIService;

  beforeEach(() => {
    config = {
      defaultProvider: 'test-provider',
      apiKeys: {
        openai: 'test-key',
      },
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 1000,
      },
    };

    mockProvider = {
      name: 'test-provider',
      generateText: vi.fn().mockResolvedValue('Generated text'),
      generateStream: vi.fn().mockImplementation(async function* () {
        yield 'chunk1';
        yield 'chunk2';
      }),
    };

    service = new AIService(config);
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      service.registerProvider(mockProvider);
      expect(service.getAvailableProviders()).toContain('test-provider');
    });

    it('should allow registering multiple providers', () => {
      const provider2: AIProvider = {
        name: 'provider2',
        generateText: vi.fn().mockResolvedValue('text'),
        generateStream: vi.fn(),
      };

      service.registerProvider(mockProvider);
      service.registerProvider(provider2);

      expect(service.getAvailableProviders()).toContain('test-provider');
      expect(service.getAvailableProviders()).toContain('provider2');
      expect(service.getAvailableProviders()).toHaveLength(2);
    });
  });

  describe('setProvider', () => {
    it('should switch to a registered provider', () => {
      service.registerProvider(mockProvider);
      service.setProvider('test-provider');
      expect(service.getCurrentProvider()).toBe('test-provider');
    });

    it('should throw AIError when switching to unregistered provider', () => {
      expect(() => service.setProvider('non-existent')).toThrow(AIError);
      expect(() => service.setProvider('non-existent')).toThrow(
        'Provider "non-existent" not registered'
      );
    });

    it('should allow switching between registered providers', () => {
      const provider2: AIProvider = {
        name: 'provider2',
        generateText: vi.fn().mockResolvedValue('text'),
        generateStream: vi.fn(),
      };

      service.registerProvider(mockProvider);
      service.registerProvider(provider2);

      service.setProvider('test-provider');
      expect(service.getCurrentProvider()).toBe('test-provider');

      service.setProvider('provider2');
      expect(service.getCurrentProvider()).toBe('provider2');
    });
  });

  describe('getCurrentProvider', () => {
    it('should return the default provider initially', () => {
      expect(service.getCurrentProvider()).toBe('test-provider');
    });

    it('should return the current provider after switching', () => {
      service.registerProvider(mockProvider);
      service.setProvider('test-provider');
      expect(service.getCurrentProvider()).toBe('test-provider');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(service.getAvailableProviders()).toEqual([]);
    });

    it('should return all registered provider names', () => {
      const provider2: AIProvider = {
        name: 'provider2',
        generateText: vi.fn(),
        generateStream: vi.fn(),
      };

      service.registerProvider(mockProvider);
      service.registerProvider(provider2);

      const providers = service.getAvailableProviders();
      expect(providers).toContain('test-provider');
      expect(providers).toContain('provider2');
      expect(providers).toHaveLength(2);
    });
  });

  describe('generateText', () => {
    it('should throw AIError when current provider is not registered', async () => {
      await expect(service.generateText('test prompt')).rejects.toThrow(AIError);
      await expect(service.generateText('test prompt')).rejects.toThrow(
        'Current provider "test-provider" not found'
      );
    });

    it('should call the current provider generateText method', async () => {
      service.registerProvider(mockProvider);
      const result = await service.generateText('test prompt');

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        'test prompt',
        config.defaultOptions
      );
      expect(result).toBe('Generated text');
    });

    it('should merge default options with provided options', async () => {
      service.registerProvider(mockProvider);
      await service.generateText('test prompt', { temperature: 0.9 });

      expect(mockProvider.generateText).toHaveBeenCalledWith('test prompt', {
        temperature: 0.9,
        maxTokens: 1000,
      });
    });

    it('should wrap provider errors in AIError', async () => {
      const errorProvider: AIProvider = {
        name: 'error-provider',
        generateText: vi.fn().mockRejectedValue(new Error('Provider error')),
        generateStream: vi.fn(),
      };

      service.registerProvider(errorProvider);
      service.setProvider('error-provider');

      await expect(service.generateText('test')).rejects.toThrow(AIError);
      await expect(service.generateText('test')).rejects.toThrow(
        'Failed to generate text: Provider error'
      );
    }, 10000); // Increase timeout to account for retry logic
  });

  describe('generateStream', () => {
    it('should throw AIError when current provider is not registered', async () => {
      const generator = service.generateStream('test prompt');
      await expect(generator.next()).rejects.toThrow(AIError);
    });

    it('should yield chunks from the current provider', async () => {
      service.registerProvider(mockProvider);
      const chunks: string[] = [];

      for await (const chunk of service.generateStream('test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['chunk1', 'chunk2']);
    });

    it('should pass merged options to provider', async () => {
      service.registerProvider(mockProvider);
      const generator = service.generateStream('test prompt', { temperature: 0.5 });

      // Consume the generator
      for await (const _ of generator) {
        // Just consume
      }

      expect(mockProvider.generateStream).toHaveBeenCalledWith('test prompt', {
        temperature: 0.5,
        maxTokens: 1000,
      });
    });
  });

  describe('private getProvider method', () => {
    it('should throw AIError when provider not found', async () => {
      // Try to use a service with unregistered provider
      await expect(service.generateText('test')).rejects.toThrow(AIError);
      await expect(service.generateText('test')).rejects.toThrow(
        'Current provider "test-provider" not found'
      );
    });

    it('should return the correct provider after switching', async () => {
      const provider2: AIProvider = {
        name: 'provider2',
        generateText: vi.fn().mockResolvedValue('text from provider2'),
        generateStream: vi.fn(),
      };

      service.registerProvider(mockProvider);
      service.registerProvider(provider2);

      service.setProvider('provider2');
      const result = await service.generateText('test');

      expect(provider2.generateText).toHaveBeenCalled();
      expect(mockProvider.generateText).not.toHaveBeenCalled();
      expect(result).toBe('text from provider2');
    });
  });
});
