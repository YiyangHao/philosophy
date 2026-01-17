/**
 * 笔记列表页
 * 显示所有笔记的卡片列表
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/layout/Sidebar';
import NoteCard from '../components/NoteCard';
import type { Note } from '../types/note';

export default function NotesListPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载笔记列表
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data || []);
    } catch (err) {
      console.error('加载笔记失败:', err);
      setError('加载笔记失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 pl-8 pr-8 py-6">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-8">
          {/* 左侧：搜索框 + 搜索按钮 */}
          <form onSubmit={handleSearch} className="flex gap-4 max-w-xl">
            {/* 搜索框 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索关键词"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* 搜索按钮 */}
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="h-10 px-4 flex items-center gap-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              <span>搜索</span>
            </button>
          </form>

          {/* 右侧：新建笔记按钮 */}
          <button
            type="button"
            onClick={() => navigate('/notes/new')}
            className="h-10 px-4 flex items-center gap-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建笔记</span>
          </button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadNotes}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && notes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">还没有笔记，创建第一篇吧！</p>
            <button
              onClick={() => navigate('/notes/new')}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              新建笔记
            </button>
          </div>
        )}

        {/* 笔记网格 */}
        {!loading && !error && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
