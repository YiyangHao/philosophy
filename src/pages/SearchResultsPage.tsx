/**
 * 搜索结果页
 * 使用 AI 向量搜索显示相关笔记
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../services/aiService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface SearchResult {
  note_id: string;
  title: string;
  author: string | null;
  content_snippet: string;
  similarity: number;
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
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

  // 将相似度转换为星星数量（0-5星）
  const getSimilarityStars = (similarity: number) => {
    return Math.round(similarity * 5);
  };

  // 格式化相似度为百分比
  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
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

            {results.map((result) => (
              <Card
                key={result.note_id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-[#1C1C1E] mb-2">
                        {result.title}
                      </CardTitle>
                      {result.author && (
                        <p className="text-sm text-[#8E8E93]">{result.author}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {/* 相似度显示 */}
                      <Badge
                        variant="secondary"
                        className="bg-[#FFB800] text-white hover:bg-[#FFB800]"
                      >
                        {formatSimilarity(result.similarity)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 内容片段 */}
                  <p className="text-sm text-[#8E8E93] mb-4 line-clamp-3">
                    {result.content_snippet}
                  </p>

                  {/* 相似度星星 */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-[#8E8E93]">相关度：</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${
                            index < getSimilarityStars(result.similarity)
                              ? 'fill-[#FFB800] text-[#FFB800]'
                              : 'text-[#E5E5E5]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 查看完整笔记按钮 */}
                  <Link to={`/notes/${result.note_id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      查看完整笔记
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
