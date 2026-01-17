/**
 * 笔记详情页（只读模式）
 * 使用 BlockNote 显示富文本内容
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import type { Note } from '../types/note';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#8E8E93]">加载中...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '笔记不存在'}</p>
          <Link to="/notes">
            <Button variant="outline">返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部工具栏 */}
      <div className="border-b border-[#E5E5E5] px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <Link to="/notes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/notes/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* 标题 */}
        <h1 className="text-4xl font-bold text-[#1C1C1E] mb-4">
          {note.title}
        </h1>

        {/* 作者 */}
        {note.author && (
          <p className="text-lg text-[#8E8E93] mb-4">{note.author}</p>
        )}

        {/* 出版信息 */}
        {(note.publication || note.year) && (
          <p className="text-sm text-[#8E8E93] mb-4">
            📚 {note.publication}
            {note.publication && note.year && ', '}
            {note.year}
          </p>
        )}

        {/* 关键词 */}
        {note.keywords && note.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-[#8E8E93]">🏷️</span>
            {note.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                #{keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* 分隔线 */}
        <hr className="border-[#E5E5E5] my-6" />

        {/* 笔记内容（BlockNote 只读模式） */}
        <div className="min-h-[400px] prose prose-lg max-w-none">
          <BlockNoteView
            editor={editor}
            editable={false}
            theme="light"
          />
        </div>

        {/* 底部元信息 */}
        <div className="mt-12 pt-6 border-t border-[#E5E5E5] text-sm text-[#8E8E93]">
          <p>创建时间：{formatDate(note.created_at)}</p>
          {note.updated_at !== note.created_at && (
            <p>更新时间：{formatDate(note.updated_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
