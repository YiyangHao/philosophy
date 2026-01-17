/**
 * 搜索结果页
 * 使用 AI 向量搜索显示相关笔记
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../services/aiService';
import { Button } from '../components/ui/button';
import { highlightText } from '../utils/highlightText';

interface SearchResult {
  note_id: string;
  title: string;
  authors: string[] | null;  // 改为 authors 数组
  keywords: string[] | null;
  content_snippet: string;
  similarity: number;
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingKeywords, setAddingKeywords] = useState(false);
  const [keywordsAdded, setKeywordsAdded] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      setKeywordsAdded(false);  // 重置状态

      console.log('🔍 开始搜索...');
      console.log('📝 搜索关键词:', searchQuery);

      // 1. 将搜索词转成向量
      console.log('🔄 生成查询向量...');
      const queryEmbedding = await generateEmbedding(searchQuery);
      console.log('✅ 查询向量生成成功，维度:', queryEmbedding.length);

      // 2. 在 Supabase 中执行向量搜索
      console.log('==================== RPC 调用详情 ====================');
      console.log('📊 传入参数：');
      console.log('  query_embedding 维度:', queryEmbedding.length);
      console.log('  query_embedding 前5个值:', queryEmbedding.slice(0, 5));
      console.log('  match_threshold:', 0.0);
      console.log('  match_count:', 50);
      console.log('完整参数对象:', {
        query_embedding: queryEmbedding,
        match_threshold: 0.0,
        match_count: 50
      });

      const { data, error: searchError } = await supabase.rpc(
        'search_notes_by_vector',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.0,
          match_count: 50,
        }
      );

      console.log('==================== RPC 返回结果 ====================');
      console.log('✅ data:', data);
      console.log('❌ error:', searchError);
      console.log('data 类型:', typeof data);
      console.log('data 是数组吗?', Array.isArray(data));
      console.log('data 长度:', data?.length);
      console.log('🔍 返回数据的第一项:', data?.[0]);
      console.log('🔍 第一项的所有字段:', data?.[0] ? Object.keys(data[0]) : '无数据');

      if (searchError) {
        console.error('❌ Supabase RPC 调用失败:', searchError);
        throw searchError;
      }

      console.log('✅ 搜索成功，找到', data?.length || 0, '个匹配块');

      // 3. 直接使用所有结果，按相似度排序（不去重）
      const sortedResults = (data || [])
        .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
        .slice(0, 50); // 限制最多显示 50 个结果

      console.log('📊 最终搜索结果数量:', sortedResults.length);
      console.log('📊 最终搜索结果:', sortedResults);

      setResults(sortedResults);
    } catch (err) {
      console.error('❌ 搜索失败:', err);
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 批量添加关键词到所有搜索结果的笔记
  const handleBatchAddKeyword = async () => {
    if (!query.trim() || results.length === 0) return;

    try {
      setAddingKeywords(true);

      // 1. 提取所有唯一的 note_id
      const uniqueNoteIds = [...new Set(results.map(r => r.note_id))];
      console.log('📝 准备为', uniqueNoteIds.length, '篇笔记添加关键词:', query);

      let successCount = 0;
      let skipCount = 0;

      // 2. 逐个更新笔记
      for (const noteId of uniqueNoteIds) {
        try {
          // 获取当前笔记的关键词
          const { data: note, error: fetchError } = await supabase
            .from('notes')
            .select('keywords')
            .eq('id', noteId)
            .single();

          if (fetchError) {
            console.error('❌ 获取笔记失败:', noteId, fetchError);
            continue;
          }

          // 检查关键词是否已存在
          const currentKeywords = note.keywords || [];
          if (currentKeywords.includes(query.trim())) {
            console.log('⏭️ 关键词已存在，跳过:', noteId);
            skipCount++;
            continue;
          }

          // 添加新关键词
          const updatedKeywords = [...currentKeywords, query.trim()];
          const { error: updateError } = await supabase
            .from('notes')
            .update({ keywords: updatedKeywords })
            .eq('id', noteId);

          if (updateError) {
            console.error('❌ 更新笔记失败:', noteId, updateError);
          } else {
            console.log('✅ 成功添加关键词到笔记:', noteId);
            successCount++;
          }
        } catch (err) {
          console.error('❌ 处理笔记时出错:', noteId, err);
        }
      }

      // 3. 显示结果
      if (successCount > 0) {
        setKeywordsAdded(true);
        alert(`✅ 已为 ${successCount} 篇笔记添加关键词 "${query}"${skipCount > 0 ? `\n⏭️ ${skipCount} 篇笔记已有该关键词` : ''}`);
      } else if (skipCount > 0) {
        alert(`ℹ️ 所有笔记都已包含关键词 "${query}"`);
      } else {
        alert('❌ 未能添加关键词，请稍后重试');
      }

      console.log('🎉 批量添加完成！成功:', successCount, '跳过:', skipCount);
    } catch (err) {
      console.error('❌ 批量添加关键词失败:', err);
      alert('添加关键词失败，请稍后重试');
    } finally {
      setAddingKeywords(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <Link to="/notes">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">
            搜索结果
          </h1>
          <p className="text-[#8E8E93]">
            搜索词：<span className="font-medium text-[#1C1C1E]">"{query}"</span>
          </p>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF] mx-auto mb-4"></div>
            <p className="text-[#8E8E93]">正在搜索...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => performSearch(query)}
              variant="outline"
            >
              重试
            </Button>
          </div>
        )}

        {/* 无结果 */}
        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8E8E93] mb-4">
              没有找到相关笔记，试试其他关键词吧
            </p>
            <Link to="/notes">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {/* 结果统计和批量操作 */}
            <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  找到 <span className="font-semibold">{results.length}</span> 个结果，来自{' '}
                  <span className="font-semibold">{[...new Set(results.map(r => r.note_id))].length}</span> 篇笔记
                </p>
              </div>
              <Button
                onClick={handleBatchAddKeyword}
                disabled={addingKeywords || keywordsAdded}
                className={`${
                  keywordsAdded
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {addingKeywords ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    添加中...
                  </>
                ) : keywordsAdded ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已添加
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4 mr-2" />
                    将 "{query}" 添加到所有笔记
                  </>
                )}
              </Button>
            </div>

            {results.map((result, index) => {
              // 调试日志：检查每个结果的字段
              console.log(`渲染第 ${index + 1} 个结果:`, {
                title: result.title,
                content_snippet: result.content_snippet,
                authors: result.authors,  // 改为 authors
                keywords: result.keywords,
                similarity: result.similarity
              });

              return (
                <div
                  key={`${result.note_id}-${index}`}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                >
                  {/* 顶部：标题 + 相关度 */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex-1 mr-4">
                      {highlightText(result.title || '无标题', query)}
                    </h3>
                    {result.similarity != null && (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        {Math.round(result.similarity * 100)}%
                      </span>
                    )}
                  </div>

                  {/* 作者信息 - 支持多作者 */}
                  {result.authors && result.authors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.authors.map((author, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded"
                        >
                          👤 {author}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 关键词标签 */}
                  {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded"
                        >
                          🏷️ {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 匹配文本片段 - 带高亮 */}
                  <div className="text-gray-700 text-sm mb-4">
                    {result.content_snippet && typeof result.content_snippet === 'string' && result.content_snippet.length > 0 ? (
                      <p className="line-clamp-3">
                        {highlightText(
                          result.content_snippet.length > 200 
                            ? result.content_snippet.slice(0, 200) + '...'
                            : result.content_snippet,
                          query
                        )}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">暂无内容预览</p>
                    )}
                  </div>

                  {/* 查看完整笔记按钮 */}
                  <button
                    onClick={() => navigate(`/notes/${result.note_id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    查看完整笔记 <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
