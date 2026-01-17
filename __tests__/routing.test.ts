import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Routing Configuration', () => {
  const appTsxPath = join(__dirname, '../src/App.tsx');
  const appTsxContent = readFileSync(appTsxPath, 'utf-8');

  it('should import BrowserRouter from react-router-dom', () => {
    expect(appTsxContent).toContain("import { BrowserRouter");
    expect(appTsxContent).toContain("from 'react-router-dom'");
  });

  it('should import Routes and Route from react-router-dom', () => {
    expect(appTsxContent).toContain('Routes');
    expect(appTsxContent).toContain('Route');
  });

  it('should import Layout component', () => {
    expect(appTsxContent).toContain("import Layout from './components/layout/Layout'");
  });

  it('should import all page components', () => {
    expect(appTsxContent).toContain("import Dashboard from './pages/Dashboard'");
    expect(appTsxContent).toContain("import NotesList from './pages/NotesList'");
    expect(appTsxContent).toContain("import NoteEditor from './pages/NoteEditor'");
    expect(appTsxContent).toContain("import Settings from './pages/Settings'");
  });

  it('should wrap routes in BrowserRouter', () => {
    expect(appTsxContent).toContain('<BrowserRouter>');
    expect(appTsxContent).toContain('</BrowserRouter>');
  });

  it('should define route for "/" rendering Dashboard', () => {
    // Check for index route with Dashboard
    expect(appTsxContent).toContain('<Route index element={<Dashboard />}');
  });

  it('should define route for "/notes" rendering NotesList', () => {
    expect(appTsxContent).toContain('path="notes"');
    expect(appTsxContent).toContain('element={<NotesList />}');
  });

  it('should define route for "/notes/:id" rendering NoteEditor', () => {
    expect(appTsxContent).toContain('path="notes/:id"');
    expect(appTsxContent).toContain('element={<NoteEditor />}');
  });

  it('should define route for "/settings" rendering Settings', () => {
    expect(appTsxContent).toContain('path="settings"');
    expect(appTsxContent).toContain('element={<Settings />}');
  });

  it('should wrap all routes in Layout component', () => {
    // Check that Layout is used as a parent route
    expect(appTsxContent).toContain('<Route path="/" element={<Layout />}>');
    
    // Verify the structure has nested routes
    const layoutRouteMatch = appTsxContent.match(/<Route path="\/" element={<Layout \/>}>([\s\S]*?)<\/Route>/);
    expect(layoutRouteMatch).toBeTruthy();
    
    if (layoutRouteMatch) {
      const nestedContent = layoutRouteMatch[1];
      // Verify nested routes exist within Layout
      expect(nestedContent).toContain('<Route index');
      expect(nestedContent).toContain('path="notes"');
      expect(nestedContent).toContain('path="settings"');
    }
  });

  it('should have proper route nesting structure', () => {
    // Verify the overall structure
    const routeStructure = appTsxContent.match(/<BrowserRouter>([\s\S]*?)<\/BrowserRouter>/);
    expect(routeStructure).toBeTruthy();
    
    if (routeStructure) {
      const routerContent = routeStructure[1];
      expect(routerContent).toContain('<Routes>');
      expect(routerContent).toContain('</Routes>');
      expect(routerContent).toContain('<Route path="/" element={<Layout />}>');
    }
  });
});
