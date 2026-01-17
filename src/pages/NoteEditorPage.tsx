/**
 * Notion 风格笔记编辑页
 * 支持新建和编辑笔记
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { supabase } from '../lib/supabase';
import { generateEmbedding, chunkText } from '../services/aiService';
import Sidebar from '../components/layout/Sidebar';
import NoteMetadataPanel from '../components/NoteMetadataPanel';
import type { NoteFormData } from '../types/note';

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>([]);  // 改为 authors 数组
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
        setAuthors(data.authors || []);  // 读取 authors 数组
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
        authors: authors,  // 保存 authors 数组
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

        console.log('✅ 笔记更新成功，ID:', id);

        // 删除旧向量
        await supabase
          .from('note_embeddings')
          .delete()
          .eq('note_id', id);

        console.log('🗑️ 旧向量已删除');

        // 生成新向量（分块处理）
        if (markdown && markdown.trim()) {
          try {
            console.log('🔄 开始生成向量（编辑模式）...');
            console.log('📝 笔记总长度:', markdown.length, '字符');

            // 将文本分块
            const chunks = chunkText(markdown, 2000, 200);
            console.log('📊 分块数量:', chunks.length);

            // 为每个块生成向量并保存
            for (let i = 0; i < chunks.length; i++) {
              console.log(`🔄 处理第 ${i + 1}/${chunks.length} 块...`);

              const embedding = await generateEmbedding(chunks[i]);

              const { error: embeddingError } = await supabase
                .from('note_embeddings')
                .insert({
                  note_id: id,
                  content_chunk: chunks[i],
                  embedding: embedding,
                });

              if (embeddingError) {
                console.error(`❌ 第 ${i + 1} 块保存失败:`, embeddingError);
              } else {
                console.log(`✅ 第 ${i + 1} 块保存成功`);
              }
            }

            console.log('🎉 所有向量生成完成！');
          } catch (embError) {
            console.error('❌ 生成向量失败:', embError);
            // 不阻止保存，只是警告
            alert('笔记已保存，但向量生成失败。搜索功能可能受影响。');
          }
        }

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

        console.log('✅ 笔记保存成功，ID:', data.id);

        // 生成向量（分块处理）
        if (markdown && markdown.trim()) {
          try {
            console.log('🔄 开始生成向量（新建模式）...');
            console.log('📝 笔记总长度:', markdown.length, '字符');

            // 将文本分块
            const chunks = chunkText(markdown, 2000, 200);
            console.log('📊 分块数量:', chunks.length);

            // 为每个块生成向量并保存
            for (let i = 0; i < chunks.length; i++) {
              console.log(`🔄 处理第 ${i + 1}/${chunks.length} 块...`);

              const embedding = await generateEmbedding(chunks[i]);

              const { error: embeddingError } = await supabase
                .from('note_embeddings')
                .insert({
                  note_id: data.id,
                  content_chunk: chunks[i],
                  embedding: embedding,
                });

              if (embeddingError) {
                console.error(`❌ 第 ${i + 1} 块保存失败:`, embeddingError);
              } else {
                console.log(`✅ 第 ${i + 1} 块保存成功`);
              }
            }

            console.log('🎉 所有向量生成完成！');
          } catch (embError) {
            console.error('❌ 生成向量失败:', embError);
            alert('笔记已创建，但向量生成失败。搜索功能可能受影响。');
          }
        }

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
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 pl-8 pr-8 py-6 flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
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
        <div className="max-w-5xl mx-auto px-12">
          {/* 顶部按钮区域 */}
          <div className="flex justify-end items-center gap-3 mb-8">
            {isEditMode && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="h-10 px-4 flex items-center gap-2 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-10 px-4 flex items-center gap-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? '保存中...' : '保存'}</span>
            </button>
          </div>

          {/* 标题输入框 */}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="在这里输入标题..."
            className="w-full text-4xl font-bold text-gray-900 border-none outline-none bg-transparent mb-6 resize-none overflow-hidden whitespace-normal break-words leading-tight"
            style={{ caretColor: '#007AFF' }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />

          {/* 元数据面板 */}
          <NoteMetadataPanel
            authors={authors}
            publication={publication}
            year={year}
            keywords={keywords}
            onAuthorsChange={setAuthors}
            onPublicationChange={setPublication}
            onYearChange={setYear}
            onKeywordsChange={setKeywords}
          />

          {/* BlockNote 编辑器 */}
          <div className="min-h-[400px] prose prose-lg max-w-none leading-loose">
            <BlockNoteView
              editor={editor}
              theme="light"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
