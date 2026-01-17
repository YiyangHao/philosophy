import { describe, it, expect } from 'vitest';
import { AIError } from '../src/services/ai/types';

describe('AI Type Definitions', () => {
  it('should instantiate AIError with provider name and message', () => {
    const error = new AIError('Test error message', 'openai');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
    expect(error.provider).toBe('openai');
    expect(error.name).toBe('AIError');
  });

  it('should include originalError when provided', () => {
    const originalError = new Error('Original error');
    const error = new AIError('Wrapped error', 'anthropic', originalError);
    
    expect(error.originalError).toBe(originalError);
    expect(error.provider).toBe('anthropic');
  });

  it('should have correct name property', () => {
    const error = new AIError('Test error', 'test-provider');
    
    expect(error.name).toBe('AIError');
  });

  it('should handle undefined originalError', () => {
    const error = new AIError('Test error', 'openai', undefined);
    
    expect(error.originalError).toBeUndefined();
    expect(error.provider).toBe('openai');
    expect(error.message).toBe('Test error');
  });

  it('should handle various types of originalError', () => {
    // Test with string
    const error1 = new AIError('Error 1', 'provider1', 'string error');
    expect(error1.originalError).toBe('string error');

    // Test with object
    const error2 = new AIError('Error 2', 'provider2', { code: 500 });
    expect(error2.originalError).toEqual({ code: 500 });

    // Test with Error instance
    const originalError = new Error('Original');
    const error3 = new AIError('Error 3', 'provider3', originalError);
    expect(error3.originalError).toBe(originalError);
  });

  it('should preserve error stack trace', () => {
    const error = new AIError('Test error', 'openai');
    
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});
