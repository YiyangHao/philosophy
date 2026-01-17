import { Link, useLocation } from 'react-router-dom';
import { FileText, Tag, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const isNotesActive = location.pathname === '/notes' || location.pathname.startsWith('/notes');
  
  return (
    <aside className="w-64 bg-white min-h-[calc(100vh-73px)] p-4">
      <div className="space-y-2">
        {/* 用户信息区域 */}
        <div className="flex items-center gap-3 p-4 mb-2">
          <img 
            src="/avatar.jpg" 
            alt="用户头像" 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <span className="font-medium text-gray-900">郝伊阳</span>
        </div>
        
        <div className="pt-4 space-y-1">
          {/* 笔记按钮 - 可点击 */}
          <Link
            to="/notes"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isNotesActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>笔记</span>
          </Link>
          
          {/* 标签按钮 - 不可点击 */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary opacity-50 cursor-default">
            <Tag className="w-5 h-5" />
            <span>标签</span>
          </div>
          
          {/* 设置按钮 - 不可点击 */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary opacity-50 cursor-default">
            <Settings className="w-5 h-5" />
            <span>设置</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
