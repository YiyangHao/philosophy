import { describe, it, expect } from 'vitest';
import packageJson from '../package.json';

describe('Package.json Structure', () => {
  it('should have the correct project name', () => {
    expect(packageJson.name).toBe('philonote');
  });

  it('should include react-router-dom version 6 or higher', () => {
    const routerVersion = packageJson.dependencies['react-router-dom'];
    expect(routerVersion).toBeDefined();
    
    // Extract major version number (e.g., "^7.12.0" -> 7)
    const majorVersion = parseInt(routerVersion.replace(/^\^|~/, '').split('.')[0]);
    expect(majorVersion).toBeGreaterThanOrEqual(6);
  });

  it('should include @supabase/supabase-js', () => {
    expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined();
  });

  it('should include lucide-react', () => {
    expect(packageJson.dependencies['lucide-react']).toBeDefined();
  });

  it('should include react-markdown', () => {
    expect(packageJson.dependencies['react-markdown']).toBeDefined();
  });

  it('should include novel', () => {
    expect(packageJson.dependencies['novel']).toBeDefined();
  });

  it('should have all required dependencies', () => {
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'react-markdown',
      'novel'
    ];

    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies[dep]).toBeDefined();
    });
  });
});
