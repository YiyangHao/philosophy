/**
 * Environment configuration helper
 * Provides typed access to environment variables and validation
 */

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  ai: {
    openaiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    defaultProvider: import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'openai',
  },
} as const;

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnv(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
