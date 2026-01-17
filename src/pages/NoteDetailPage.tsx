/**
 * 笔记详情页（只读模式）
 * 使用 BlockNote 显示富文本内容
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Edit, Trash2 } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/layout/Sidebar';
import type { Note } from '../types/note';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 创建 BlockNote 编辑器（只读模式）
  const editor = useCreateBlockNote();

  // 加载笔记
  useEffect(() => {
    if (id) {
      loadNote(id);
    }
  }, [id]);

  const loadNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw fetchError;

      setNote(data);

      // 加载内容到 BlockNote 编辑器
      if (data && data.content && editor) {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(data.content);
          editor.replaceBlocks(editor.document, blocks);
        } catch (err) {
          console.error('解析 Markdown 失败:', err);
        }
      }
    } catch (err) {
      console.error('加载笔记失败:', err);
      setError('加载笔记失败');
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

  // 删除笔记
  const handleDelete = async () => {
    if (!id) return;

    if (!confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('删除成功！');
      navigate('/notes');
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请稍后重试');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 pl-8 pr-8 py-6 flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </main>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 pl-8 pr-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || '笔记不存在'}</p>
            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              返回列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 pl-8 pr-8 py-6">
        {/* 居中容器 */}
        <div className="max-w-5xl mx-auto px-12">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-12">
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

          {/* 右侧：操作按钮组（查看模式） */}
          <div className="flex items-center gap-3">
            {/* 编辑按钮 - 次级按钮样式 */}
            <button
              onClick={() => navigate(`/notes/${id}/edit`)}
              className="h-10 px-4 flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>编辑</span>
            </button>

            {/* 删除按钮 - 危险按钮样式 */}
            <button
              onClick={handleDelete}
              className="h-10 px-4 flex items-center gap-2 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          </div>
        </div>

          {/* 标题 */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {note.title}
          </h1>

          {/* 元信息区域 - 左右布局 */}
          <div className="space-y-3 mb-6">
            {/* 作者 */}
            {note.authors && note.authors.length > 0 && (
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600 font-medium w-16 flex-shrink-0">
                  作者
                </span>
                <div className="flex flex-wrap gap-2">
                  {note.authors.map((author, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded"
                    >
                      👤 {author}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 出版信息 */}
            {(note.publication || note.year) && (
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600 font-medium w-16 flex-shrink-0">
                  出版物
                </span>
                <span className="inline-block px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded">
                  📚 {note.publication}
                  {note.publication && note.year && ', '}
                  {note.year}
                </span>
              </div>
            )}

            {/* 关键词 */}
            {note.keywords && note.keywords.length > 0 && (
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600 font-medium w-16 flex-shrink-0">
                  关键词
                </span>
                <div className="flex flex-wrap gap-2">
                  {note.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded"
                    >
                      🏷️ {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 分隔线 */}
          <hr className="border-gray-200 my-6" />

          {/* 笔记内容（BlockNote 只读模式） */}
          <div className="min-h-[400px] prose prose-lg max-w-none leading-loose">
            <BlockNoteView
              editor={editor}
              editable={false}
              theme="light"
            />
          </div>

          {/* 底部元信息 */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>创建时间：{formatDate(note.created_at)}</p>
            {note.updated_at !== note.created_at && (
              <p>更新时间：{formatDate(note.updated_at)}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
