import type { AIProvider, AIServiceConfig, GenerateOptions } from './types';
import { AIError } from './types';

/**
 * Main AI service that manages multiple providers
 */
export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.currentProvider = config.defaultProvider;
  }

  /**
   * Register an AI provider
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Switch to a different provider
   */
  setProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new AIError(
        `Provider "${providerName}" not registered`,
        providerName
      );
    }
    this.currentProvider = providerName;
  }

  /**
   * Get the current provider instance
   */
  private getProvider(): AIProvider {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new AIError(
        `Current provider "${this.currentProvider}" not found`,
        this.currentProvider
      );
    }
    return provider;
  }

  /**
   * Generate text using the current provider
   */
  async generateText(
    prompt: string, 
    options?: GenerateOptions
  ): Promise<string> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    const provider = this.getProvider();
    
    try {
      return await this.retryWithBackoff(
        () => provider.generateText(prompt, mergedOptions),
        3
      );
    } catch (error) {
      throw new AIError(
        `Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider.name,
        error
      );
    }
  }

  /**
   * Generate streaming text using the current provider
   */
  async *generateStream(
    prompt: string,
    options?: GenerateOptions
  ): AsyncGenerator<string, void, unknown> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    const provider = this.getProvider();
    
    try {
      yield* provider.generateStream(prompt, mergedOptions);
    } catch (error) {
      throw new AIError(
        `Failed to generate stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider.name,
        error
      );
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && /\b4\d{2}\b/.test(error.message)) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get list of registered providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get current provider name
   */
  getCurrentProvider(): string {
    return this.currentProvider;
  }
}
