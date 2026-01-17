import { describe, it, expect } from 'vitest';
import tailwindConfig from '../tailwind.config';

describe('Tailwind Configuration', () => {
  it('should contain all custom color tokens', () => {
    const colors = tailwindConfig.theme.extend.colors;
    
    // Primary colors
    expect(colors.primary).toBeDefined();
    expect(colors.primary.DEFAULT).toBe('#007AFF');
    expect(colors.primary.light).toBeDefined();
    expect(colors.primary.dark).toBeDefined();
    
    // Status colors
    expect(colors.success).toBeDefined();
    expect(colors.success.DEFAULT).toBe('#34C759');
    expect(colors.warning).toBeDefined();
    expect(colors.warning.DEFAULT).toBe('#FF9500');
    expect(colors.danger).toBeDefined();
    expect(colors.danger.DEFAULT).toBe('#FF3B30');
    
    // Background colors
    expect(colors['bg-main']).toBeDefined();
    expect(colors['bg-main'].DEFAULT).toBe('#FFFFFF');
    expect(colors['card-bg']).toBeDefined();
    
    // Border colors
    expect(colors.border).toBeDefined();
    
    // Text colors
    expect(colors['text-primary']).toBeDefined();
    expect(colors['text-secondary']).toBeDefined();
    
    // Tag colors
    expect(colors.tag).toBeDefined();
    expect(colors.tag.blue).toBeDefined();
    expect(colors.tag.green).toBeDefined();
    expect(colors.tag.yellow).toBeDefined();
    expect(colors.tag.orange).toBeDefined();
    expect(colors.tag.red).toBeDefined();
    expect(colors.tag.purple).toBeDefined();
    expect(colors.tag.pink).toBeDefined();
    expect(colors.tag.gray).toBeDefined();
  });

  it('should contain custom font families with Apple system fonts', () => {
    const fontFamily = tailwindConfig.theme.extend.fontFamily;
    
    expect(fontFamily.sans).toBeDefined();
    expect(fontFamily.sans).toContain('-apple-system');
    expect(fontFamily.sans).toContain('BlinkMacSystemFont');
    expect(fontFamily.sans).toContain('SF Pro Display');
    expect(fontFamily.sans).toContain('SF Pro Text');
    
    expect(fontFamily.mono).toBeDefined();
    expect(fontFamily.mono).toContain('SF Mono');
    expect(fontFamily.mono).toContain('Monaco');
    expect(fontFamily.mono).toContain('Menlo');
  });

  it('should have all required color categories', () => {
    const colors = tailwindConfig.theme.extend.colors;
    
    const requiredCategories = [
      'primary',
      'success',
      'warning',
      'danger',
      'bg-main',
      'card-bg',
      'border',
      'text-primary',
      'text-secondary',
      'tag'
    ];

    requiredCategories.forEach(category => {
      expect(colors[category]).toBeDefined();
    });
  });

  it('should have content paths configured for Vite', () => {
    expect(tailwindConfig.content).toBeDefined();
    expect(tailwindConfig.content).toContain('./index.html');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,ts,jsx,tsx}');
  });
});
