import { useState, useCallback } from 'react';
import { aiService } from '../services/ai';
import type { GenerateOptions } from '../services/ai';

/**
 * Custom hook for AI operations
 * Provides a React-friendly interface to the AI service
 */
export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate text using the current AI provider
   */
  const generateText = useCallback(
    async (prompt: string, options?: GenerateOptions): Promise<string> => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = await aiService.generateText(prompt, options);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Generate streaming text using the current AI provider
   */
  const generateStream = useCallback(
    async function* (
      prompt: string,
      options?: GenerateOptions
    ): AsyncGenerator<string, void, unknown> {
      setIsGenerating(true);
      setError(null);

      try {
        yield* aiService.generateStream(prompt, options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Switch to a different AI provider
   */
  const setProvider = useCallback((providerName: string): void => {
    try {
      aiService.setProvider(providerName);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Get list of available providers
   */
  const getAvailableProviders = useCallback((): string[] => {
    return aiService.getAvailableProviders();
  }, []);

  /**
   * Get current provider name
   */
  const getCurrentProvider = useCallback((): string => {
    return aiService.getCurrentProvider();
  }, []);

  return {
    generateText,
    generateStream,
    setProvider,
    getAvailableProviders,
    getCurrentProvider,
    isGenerating,
    error,
  };
}
