import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env, validateEnv } from '../src/utils/env';

describe('Environment Configuration', () => {
  describe('env object', () => {
    it('should correctly read Supabase configuration from import.meta.env', () => {
      // The env object should access import.meta.env values
      expect(env.supabase.url).toBe(import.meta.env.VITE_SUPABASE_URL);
      expect(env.supabase.anonKey).toBe(import.meta.env.VITE_SUPABASE_ANON_KEY);
    });

    it('should correctly read AI provider keys from import.meta.env', () => {
      expect(env.ai.openaiKey).toBe(import.meta.env.VITE_OPENAI_API_KEY);
      expect(env.ai.anthropicKey).toBe(import.meta.env.VITE_ANTHROPIC_API_KEY);
    });

    it('should have default AI provider as "openai" when not set', () => {
      // If VITE_DEFAULT_AI_PROVIDER is not set, it should default to 'openai'
      const defaultProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'openai';
      expect(env.ai.defaultProvider).toBe(defaultProvider);
    });

    it('should use custom default provider when VITE_DEFAULT_AI_PROVIDER is set', () => {
      // This test verifies that if the env var is set, it's used
      if (import.meta.env.VITE_DEFAULT_AI_PROVIDER) {
        expect(env.ai.defaultProvider).toBe(import.meta.env.VITE_DEFAULT_AI_PROVIDER);
      } else {
        expect(env.ai.defaultProvider).toBe('openai');
      }
    });
  });

  describe('validateEnv()', () => {
    it('should throw error when VITE_SUPABASE_URL is missing', () => {
      // Set key but not URL
      vi.stubEnv('VITE_SUPABASE_URL', undefined);
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
      
      expect(() => validateEnv()).toThrow('Missing required environment variables: VITE_SUPABASE_URL');
    });

    it('should throw error when VITE_SUPABASE_ANON_KEY is missing', () => {
      // Set URL but not key
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
      
      expect(() => validateEnv()).toThrow('Missing required environment variables: VITE_SUPABASE_ANON_KEY');
    });

    it('should throw error listing all missing required variables', () => {
      // Mock both missing
      vi.stubEnv('VITE_SUPABASE_URL', undefined);
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
      
      expect(() => validateEnv()).toThrow('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    });

    it('should not throw error when all required variables are present', () => {
      // Set required variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
      
      expect(() => validateEnv()).not.toThrow();
    });

    it('should not require AI provider keys (they are optional)', () => {
      // Set only required variables
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
      vi.stubEnv('VITE_OPENAI_API_KEY', undefined);
      vi.stubEnv('VITE_ANTHROPIC_API_KEY', undefined);
      
      // Should not throw even without AI keys
      expect(() => validateEnv()).not.toThrow();
    });
  });
});
