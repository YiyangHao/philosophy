/**
 * Options for text generation
 */
export interface GenerateOptions {
  /** Temperature controls randomness (0.0 - 2.0) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Specific model to use (provider-dependent) */
  model?: string;
  /** System prompt for context */
  systemPrompt?: string;
}

/**
 * AI Provider interface - all providers must implement this
 */
export interface AIProvider {
  /** Provider name (e.g., "openai", "anthropic") */
  readonly name: string;
  
  /**
   * Generate text from a prompt
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns Generated text
   */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  
  /**
   * Generate streaming text from a prompt
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns Async generator yielding text chunks
   */
  generateStream(
    prompt: string, 
    options?: GenerateOptions
  ): AsyncGenerator<string, void, unknown>;
}

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  /** Default provider to use */
  defaultProvider: string;
  /** API keys for each provider */
  apiKeys: {
    openai?: string;
    anthropic?: string;
  };
  /** Default generation options */
  defaultOptions?: GenerateOptions;
}

/**
 * Error types for AI operations
 */
export class AIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }
}
