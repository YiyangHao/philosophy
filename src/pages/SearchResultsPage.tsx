/**
 * 搜索结果页
 * 使用 AI 向量搜索显示相关笔记
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../services/aiService';
import { Button } from '../components/ui/button';

interface SearchResult {
  note_id: string;
  note_title: string;
  note_author: string | null;
  note_keywords: string[] | null;
  content_chunk: string;
  similarity: number;
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 开始搜索...');
      console.log('📝 搜索关键词:', searchQuery);

      // 1. 将搜索词转成向量
      console.log('🔄 生成查询向量...');
      const queryEmbedding = await generateEmbedding(searchQuery);
      console.log('✅ 查询向量生成成功，维度:', queryEmbedding.length);

      // 2. 在 Supabase 中执行向量搜索
      console.log('🔄 调用 Supabase RPC 函数: search_notes_by_vector');
      const { data, error: searchError } = await supabase.rpc(
        'search_notes_by_vector',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 20, // 增加数量，因为可能有多个块
        }
      );

      // 🔍 详细日志：检查 RPC 返回的原始数据
      console.log('🔍 RPC 原始返回数据:', data);
      console.log('🔍 返回数据的第一项:', data?.[0]);
      console.log('🔍 第一项的所有字段:', data?.[0] ? Object.keys(data[0]) : '无数据');

      if (searchError) {
        console.error('❌ Supabase RPC 调用失败:', searchError);
        throw searchError;
      }

      console.log('✅ 搜索成功，找到', data?.length || 0, '个匹配块');

      // 3. 按 note_id 分组，每篇笔记只保留最相关的块
      const groupedResults: Record<string, SearchResult> = {};
      
      if (data) {
        data.forEach((result: SearchResult) => {
          if (
            !groupedResults[result.note_id] ||
            groupedResults[result.note_id].similarity < result.similarity
          ) {
            groupedResults[result.note_id] = result;
          }
        });
      }

      // 4. 排序并限制结果数量
      const topResults = Object.values(groupedResults)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      console.log('📊 去重后结果:', topResults.length, '篇笔记');
      console.log('📊 搜索结果:', topResults);

      setResults(topResults);
    } catch (err) {
      console.error('❌ 搜索失败:', err);
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
    } finally {
      setLoading(false);
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
            <p className="text-sm text-[#8E8E93] mb-4">
              找到 {results.length} 个相关结果
            </p>

            {results.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
              >
                {/* 顶部：标题 + 相关度 */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1 mr-4">
                    {result.note_title || '无标题'}
                  </h3>
                  {result.similarity != null && (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                      {Math.round(result.similarity * 100)}%
                    </span>
                  )}
                </div>

                {/* 作者信息 */}
                {result.note_author && (
                  <p className="text-sm text-gray-500 mb-3">
                    👤 {result.note_author}
                  </p>
                )}

                {/* 关键词标签 */}
                {result.note_keywords && Array.isArray(result.note_keywords) && result.note_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.note_keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        🏷️ {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* 匹配文本片段 - 完全安全的处理 */}
                <div className="text-gray-700 text-sm mb-4">
                  {result.content_chunk && typeof result.content_chunk === 'string' && result.content_chunk.length > 0 ? (
                    <p className="line-clamp-3">
                      {result.content_chunk.length > 150 
                        ? result.content_chunk.slice(0, 150) + '...'
                        : result.content_chunk}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
