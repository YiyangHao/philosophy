import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('shadcn/ui component installation', () => {
  const componentsDir = join(process.cwd(), 'src', 'components', 'ui');
  const requiredComponents = [
    'button.tsx',
    'card.tsx',
    'input.tsx',
    'textarea.tsx',
    'dialog.tsx',
    'dropdown-menu.tsx',
    'select.tsx',
    'tabs.tsx',
    'badge.tsx',
    'separator.tsx',
  ];

  it('should have all required component files in src/components/ui/', () => {
    // Verify the ui directory exists
    expect(existsSync(componentsDir)).toBe(true);

    // Verify each required component file exists
    requiredComponents.forEach((component) => {
      const componentPath = join(componentsDir, component);
      expect(existsSync(componentPath)).toBe(true);
    });
  });

  it('should have components.json configuration file', () => {
    const configPath = join(process.cwd(), 'components.json');
    expect(existsSync(configPath)).toBe(true);
  });

  it('should have proper configuration in components.json', () => {
    const configPath = join(process.cwd(), 'components.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Verify essential configuration properties
    expect(config).toHaveProperty('style');
    expect(config).toHaveProperty('tailwind');
    expect(config).toHaveProperty('aliases');

    // Verify tailwind configuration
    expect(config.tailwind).toHaveProperty('config');
    expect(config.tailwind).toHaveProperty('css');
    expect(config.tailwind.config).toBe('tailwind.config.js');
    expect(config.tailwind.css).toBe('src/index.css');

    // Verify aliases
    expect(config.aliases).toHaveProperty('components');
    expect(config.aliases).toHaveProperty('utils');
    expect(config.aliases.components).toBe('@/components');
    expect(config.aliases.utils).toBe('@/lib/utils');
  });

  it('should be able to import Button component', async () => {
    // Dynamic import to test that the component can be imported
    const { Button } = await import('../src/components/ui/button');
    
    // Verify the Button component is defined
    expect(Button).toBeDefined();
    // Button is a React component (forwardRef returns an object)
    expect(typeof Button).toBe('object');
  });

  it('should have cn utility function available', async () => {
    // Verify the cn utility function exists (required by shadcn components)
    const { cn } = await import('../src/lib/utils');
    
    expect(cn).toBeDefined();
    expect(typeof cn).toBe('function');
    
    // Test basic functionality
    const result = cn('class1', 'class2');
    expect(typeof result).toBe('string');
  });
});
