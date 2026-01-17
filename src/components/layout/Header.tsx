import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-bg-main border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-text-primary">PhiloNote</h1>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/notes" 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Notes
          </Link>
          <Link 
            to="/settings" 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
