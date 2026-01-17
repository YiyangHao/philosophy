import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Project Directory Structure', () => {
  const srcPath = join(__dirname, '..', 'src');

  it('should have components/layout directory', () => {
    const layoutPath = join(srcPath, 'components', 'layout');
    expect(existsSync(layoutPath)).toBe(true);
  });

  it('should have pages directory', () => {
    const pagesPath = join(srcPath, 'pages');
    expect(existsSync(pagesPath)).toBe(true);
  });

  it('should have services/ai/providers directory structure', () => {
    const servicesPath = join(srcPath, 'services');
    const aiPath = join(srcPath, 'services', 'ai');
    const providersPath = join(srcPath, 'services', 'ai', 'providers');
    
    expect(existsSync(servicesPath)).toBe(true);
    expect(existsSync(aiPath)).toBe(true);
    expect(existsSync(providersPath)).toBe(true);
  });

  it('should have hooks directory', () => {
    const hooksPath = join(srcPath, 'hooks');
    expect(existsSync(hooksPath)).toBe(true);
  });

  it('should have types directory', () => {
    const typesPath = join(srcPath, 'types');
    expect(existsSync(typesPath)).toBe(true);
  });

  it('should have utils directory', () => {
    const utilsPath = join(srcPath, 'utils');
    expect(existsSync(utilsPath)).toBe(true);
  });

  it('should have lib directory', () => {
    const libPath = join(srcPath, 'lib');
    expect(existsSync(libPath)).toBe(true);
  });

  it('should have all required directories', () => {
    const requiredDirectories = [
      'components/layout',
      'pages',
      'services/ai/providers',
      'hooks',
      'types',
      'utils',
      'lib'
    ];

    requiredDirectories.forEach(dir => {
      const dirPath = join(srcPath, dir);
      expect(existsSync(dirPath)).toBe(true);
    });
  });

  it('should have correct directory paths relative to src/', () => {
    // Verify paths are correctly structured
    const paths = [
      join(srcPath, 'components', 'layout'),
      join(srcPath, 'pages'),
      join(srcPath, 'services', 'ai', 'providers'),
      join(srcPath, 'hooks'),
      join(srcPath, 'types'),
      join(srcPath, 'utils'),
      join(srcPath, 'lib')
    ];

    paths.forEach(path => {
      expect(existsSync(path)).toBe(true);
    });
  });
});
