# 🔍 搜索功能数据诊断

## 问题描述

Supabase RPC 函数应该返回 6 个字段，但前端只收到了 2 个字段（note_id, note_title）。

## ✅ 已添加的诊断日志

在 `src/pages/SearchResultsPage.tsx` 的 `performSearch` 函数中，RPC 调用后立即添加了详细日志：

```typescript
// 🔍 详细日志：检查 RPC 返回的原始数据
console.log('🔍 RPC 原始返回数据:', data);
console.log('🔍 返回数据的第一项:', data?.[0]);
console.log('🔍 第一项的所有字段:', data?.[0] ? Object.keys(data[0]) : '无数据');
```

## 📊 预期的 Console 输出

### 如果数据完整

```
🔍 开始搜索...
📝 搜索关键词: 死亡
🔄 生成查询向量...
✅ 查询向量生成成功，维度: 1024
🔄 调用 Supabase RPC 函数: search_notes_by_vector
🔍 RPC 原始返回数据: [{note_id: "...", title: "...", author: "...", keywords: [...], content_snippet: "...", similarity: 0.85}, ...]
🔍 返回数据的第一项: {note_id: "abc-123", title: "死亡的哲学思考", author: "Thomas Nagel", keywords: ["死亡", "哲学"], content_snippet: "...", similarity: 0.85}
🔍 第一项的所有字段: ["note_id", "title", "author", "keywords", "content_snippet", "similarity"]
✅ 搜索成功，找到 5 个匹配块
```

### 如果数据不完整

```
🔍 RPC 原始返回数据: [{note_id: "...", title: "..."}, ...]
🔍 返回数据的第一项: {note_id: "abc-123", title: "死亡的哲学思考"}
🔍 第一项的所有字段: ["note_id", "title"]
```

## 🔧 诊断步骤

### 1. 运行搜索并查看 Console

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 访问笔记列表页
4. 在搜索框输入关键词
5. 点击"搜索"
6. 查看 Console 输出

### 2. 检查返回的字段

**关键问题：**
- 🔍 `第一项的所有字段` 显示了什么？
- 如果只有 `["note_id", "title"]`，说明 Supabase 函数没有正确更新
- 如果有全部 6 个字段，说明数据传输正常

### 3. 可能的原因

#### 原因 A：Supabase 函数未更新

**症状：**
```
🔍 第一项的所有字段: ["note_id", "title"]
```

**解决方案：**
在 Supabase Dashboard 的 SQL Editor 中重新执行：

```sql
CREATE OR REPLACE FUNCTION search_notes_by_vector(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  note_id UUID,
  title TEXT,
  author TEXT,
  keywords TEXT[],
  content_snippet TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT
    n.id AS note_id,
    n.title,
    n.author,
    n.keywords,
    ne.content_chunk AS content_snippet,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM note_embeddings ne
  JOIN notes n ON ne.note_id = n.id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$;
```

**验证函数是否更新：**
```sql
-- 查看函数定义
SELECT pg_get_functiondef('search_notes_by_vector'::regproc);
```

#### 原因 B：数据库表缺少字段

**症状：**
```
❌ Supabase RPC 调用失败: column "keywords" does not exist
```

**解决方案：**
检查 `notes` 表是否有 `keywords` 字段：

```sql
-- 查看表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notes';
```

如果缺少 `keywords` 字段，添加：

```sql
ALTER TABLE notes ADD COLUMN keywords TEXT[];
```

#### 原因 C：字段名不匹配

**症状：**
```
🔍 第一项的所有字段: ["note_id", "note_title", "note_author", ...]
```

注意字段名是 `note_title` 而不是 `title`。

**解决方案：**
更新 SQL 函数，使用 `AS` 别名：

```sql
SELECT
  n.id AS note_id,
  n.title AS title,  -- 不要用 note_title
  n.author AS author,
  n.keywords AS keywords,
  ne.content_chunk AS content_snippet,
  1 - (ne.embedding <=> query_embedding) AS similarity
```

## 📝 TypeScript 接口

确保前端接口与 SQL 返回的字段名一致：

```typescript
interface SearchResult {
  note_id: string;        // ✅ 匹配 SQL 的 note_id
  title: string;          // ✅ 匹配 SQL 的 title
  author: string | null;  // ✅ 匹配 SQL 的 author
  keywords: string[] | null;  // ✅ 匹配 SQL 的 keywords
  content_snippet: string;    // ✅ 匹配 SQL 的 content_snippet
  similarity: number;     // ✅ 匹配 SQL 的 similarity
}
```

## 🧪 测试 SQL 函数

在 Supabase Dashboard 的 SQL Editor 中直接测试：

```sql
-- 1. 生成一个测试向量（1024维，全为0.1）
SELECT search_notes_by_vector(
  ARRAY_FILL(0.1::float, ARRAY[1024])::vector(1024),
  0.3,
  5
);
```

**预期结果：**
应该返回包含所有 6 个字段的表格。

## 🔍 调试清单

- [ ] 在 Console 中查看 `🔍 RPC 原始返回数据`
- [ ] 在 Console 中查看 `🔍 第一项的所有字段`
- [ ] 确认字段数量是 6 个
- [ ] 确认字段名称正确（title 不是 note_title）
- [ ] 在 Supabase Dashboard 验证函数定义
- [ ] 在 Supabase Dashboard 测试函数调用
- [ ] 检查 `notes` 表是否有 `keywords` 字段
- [ ] 检查 `note_embeddings` 表是否有 `content_chunk` 字段

## 📞 报告问题

如果问题仍然存在，请提供以下信息：

1. **Console 输出：**
   ```
   🔍 第一项的所有字段: [...]
   ```

2. **Supabase 函数定义：**
   ```sql
   SELECT pg_get_functiondef('search_notes_by_vector'::regproc);
   ```

3. **表结构：**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'notes';
   ```

## ✅ 修复完成后

删除或注释掉调试日志：

```typescript
// 🔍 详细日志：检查 RPC 返回的原始数据
// console.log('🔍 RPC 原始返回数据:', data);
// console.log('🔍 返回数据的第一项:', data?.[0]);
// console.log('🔍 第一项的所有字段:', data?.[0] ? Object.keys(data[0]) : '无数据');
```

或者保留简化版本：

```typescript
console.log('✅ 搜索成功，找到', data?.length || 0, '个匹配块');
if (data && data.length > 0) {
  console.log('📊 第一个结果字段:', Object.keys(data[0]));
}
```

## 🎯 下一步

1. 运行搜索功能
2. 查看 Console 输出
3. 根据输出确定问题原因
4. 应用相应的解决方案
5. 重新测试

祝调试顺利！🚀
