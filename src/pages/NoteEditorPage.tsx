/**
 * Notion 风格笔记编辑页
 * 支持新建和编辑笔记
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import NoteMetadataPanel from '../components/NoteMetadataPanel';
import type { NoteFormData } from '../types/note';

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // 创建 BlockNote 编辑器
  const editor = useCreateBlockNote();

  // 加载笔记数据（编辑模式）
  useEffect(() => {
    if (isEditMode && id) {
      loadNote(id);
    }
  }, [id, isEditMode]);

  const loadNote = async (noteId: string) => {
    try {
      setInitialLoading(true);

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title || '');
        setAuthor(data.author || '');
        setPublication(data.publication || '');
        setYear(data.year);
        setKeywords(data.keywords || []);

        // 加载内容到编辑器
        if (data.content && editor) {
          try {
            const blocks = await editor.tryParseMarkdownToBlocks(data.content);
            editor.replaceBlocks(editor.document, blocks);
          } catch (err) {
            console.error('解析 Markdown 失败:', err);
          }
        }
      }
    } catch (err) {
      console.error('加载笔记失败:', err);
      alert('加载笔记失败');
    } finally {
      setInitialLoading(false);
    }
  };

  // 保存笔记
  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }

    try {
      setLoading(true);

      // 获取编辑器内容（Markdown 格式）
      const markdown = await editor.blocksToMarkdownLossy(editor.document);

      const noteData: Partial<NoteFormData> = {
        title: title.trim(),
        author: author.trim() || '',
        publication: publication.trim() || '',
        year,
        keywords,
        content: markdown,
      };

      if (isEditMode && id) {
        // 更新现有笔记
        const { error } = await supabase
          .from('notes')
          .update({
            ...noteData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;

        alert('保存成功！');
        navigate(`/notes/${id}`);
      } else {
        // 创建新笔记
        const { data, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select()
          .single();

        if (error) throw error;

        alert('创建成功！');
        navigate(`/notes/${data.id}`);
      }
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除笔记
  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    if (!confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
      return;
    }

    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#8E8E93]">加载中...</p>
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
          {isEditMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#007AFF] hover:bg-[#0051D5]"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* 标题输入框 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="在这里输入标题..."
          className="w-full text-4xl font-bold text-[#1C1C1E] border-none outline-none bg-transparent mb-6"
          style={{ caretColor: '#007AFF' }}
        />

        {/* 元数据面板 */}
        <NoteMetadataPanel
          author={author}
          publication={publication}
          year={year}
          keywords={keywords}
          onAuthorChange={setAuthor}
          onPublicationChange={setPublication}
          onYearChange={setYear}
          onKeywordsChange={setKeywords}
        />

        {/* BlockNote 编辑器 */}
        <div className="min-h-[400px] prose prose-lg max-w-none">
          <BlockNoteView
            editor={editor}
            theme="light"
          />
        </div>
      </div>
    </div>
  );
}
