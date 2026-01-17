-- ============================================
-- 向量相似度搜索函数
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION search_notes_by_vector(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  note_id UUID,
  title TEXT,
  author TEXT,
  content_snippet TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS note_id,
    n.title,
    n.author,
    ne.content AS content_snippet,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM note_embeddings ne
  JOIN notes n ON ne.note_id = n.id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- 使用说明
-- ============================================
-- 1. 在 Supabase Dashboard 登录
-- 2. 进入 SQL Editor
-- 3. 复制并执行上面的 SQL
-- 4. 执行成功后，前端就可以调用这个函数了
--
-- 前端调用示例：
-- const { data } = await supabase.rpc('search_notes_by_vector', {
--   query_embedding: [0.1, 0.2, ...],  // 1024维向量
--   match_threshold: 0.7,
--   match_count: 10
-- });
