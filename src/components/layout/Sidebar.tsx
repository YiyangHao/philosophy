import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Settings, PlusCircle } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/notes', label: 'Notes', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <aside className="w-64 bg-white min-h-[calc(100vh-73px)] p-4">
      <div className="space-y-2">
        <Link
          to="/notes/new"
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="font-medium">New Note</span>
        </Link>
        
        <div className="pt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
