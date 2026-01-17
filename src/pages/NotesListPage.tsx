/**
 * 笔记列表页
 * 显示所有笔记的卡片列表
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import NoteCard from '../components/NoteCard';
import type { Note } from '../types/note';

export default function NotesListPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[#1C1C1E]">我的笔记</h1>
          <Link to="/notes/new">
            <Button className="bg-[#007AFF] hover:bg-[#0051D5] text-white">
              <Plus className="w-5 h-5 mr-2" />
              新建笔记
            </Button>
          </Link>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-[#8E8E93]">加载中...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button
              onClick={loadNotes}
              variant="outline"
              className="mt-4"
            >
              重试
            </Button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && notes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8E8E93] mb-4">还没有笔记，创建第一篇吧！</p>
            <Link to="/notes/new">
              <Button className="bg-[#007AFF] hover:bg-[#0051D5] text-white">
                <Plus className="w-5 h-5 mr-2" />
                新建笔记
              </Button>
            </Link>
          </div>
        )}

        {/* 笔记列表 */}
        {!loading && !error && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
