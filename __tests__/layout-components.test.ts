import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Layout components', () => {
  const layoutDir = join(process.cwd(), 'src', 'components', 'layout');
  const requiredComponents = [
    'Header.tsx',
    'Sidebar.tsx',
    'Layout.tsx',
  ];

  it('should have all required layout component files', () => {
    // Verify the layout directory exists
    expect(existsSync(layoutDir)).toBe(true);

    // Verify each required component file exists
    requiredComponents.forEach((component) => {
      const componentPath = join(layoutDir, component);
      expect(existsSync(componentPath)).toBe(true);
    });
  });

  it('should be able to import Header component', async () => {
    // Dynamic import to test that the component can be imported
    const module = await import('../src/components/layout/Header');
    
    // Verify the Header component is defined
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('should be able to import Sidebar component', async () => {
    // Dynamic import to test that the component can be imported
    const module = await import('../src/components/layout/Sidebar');
    
    // Verify the Sidebar component is defined
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('should be able to import Layout component', async () => {
    // Dynamic import to test that the component can be imported
    const module = await import('../src/components/layout/Layout');
    
    // Verify the Layout component is defined
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });
});
