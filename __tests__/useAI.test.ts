import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAI } from '../src/hooks/useAI';

/**
 * Tests for useAI custom hook
 * Task 15.1: Write integration tests for AI service initialization
 * Requirements: 7.1, 7.2, 7.4
 */

describe('useAI Hook', () => {
  it('should provide access to generateText method', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.generateText).toBeDefined();
    expect(typeof result.current.generateText).toBe('function');
  });

  it('should provide access to generateStream method', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.generateStream).toBeDefined();
    expect(typeof result.current.generateStream).toBe('function');
  });

  it('should provide access to setProvider method', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.setProvider).toBeDefined();
    expect(typeof result.current.setProvider).toBe('function');
  });

  it('should provide access to getAvailableProviders method', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.getAvailableProviders).toBeDefined();
    expect(typeof result.current.getAvailableProviders).toBe('function');
  });

  it('should provide access to getCurrentProvider method', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.getCurrentProvider).toBeDefined();
    expect(typeof result.current.getCurrentProvider).toBe('function');
  });

  it('should track isGenerating state', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.isGenerating).toBe(false);
  });

  it('should track error state', () => {
    const { result } = renderHook(() => useAI());

    expect(result.current.error).toBeNull();
  });

  it('should return all expected properties', () => {
    const { result } = renderHook(() => useAI());

    // Verify all expected properties are present
    expect(result.current).toHaveProperty('generateText');
    expect(result.current).toHaveProperty('generateStream');
    expect(result.current).toHaveProperty('setProvider');
    expect(result.current).toHaveProperty('getAvailableProviders');
    expect(result.current).toHaveProperty('getCurrentProvider');
    expect(result.current).toHaveProperty('isGenerating');
    expect(result.current).toHaveProperty('error');
  });
});
