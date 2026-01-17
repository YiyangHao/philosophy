# 🎯 长文本分块处理功能 - 实现完成

## 功能概述

PhiloNote 现在支持长文本分块处理，可以为 10000+ 字符的笔记生成多个向量，确保搜索时能找到具体相关的段落。

## ✅ 已实现的功能

### 1. 文本分块函数 (`src/services/aiService.ts`)

新增 `chunkText()` 函数：
- 默认每块 2000 字符
- 块之间重叠 200 字符（保证上下文连续）
- 自动处理边界情况

```typescript
export function chunkText(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200
): string[] {
  // 实现逻辑...
}
```

### 2. 笔记编辑页分块处理 (`src/pages/NoteEditorPage.tsx`)

**新建笔记时：**
1. 保存笔记到 `notes` 表
2. 将内容分块（2000 字符/块，重叠 200 字符）
3. 为每个块生成向量
4. 保存所有块到 `note_embeddings` 表

**编辑笔记时：**
1. 更新笔记内容
2. 删除旧的所有向量块
3. 重新分块并生成新向量

**Console 日志示例：**
```
✅ 笔记保存成功，ID: xxxxx
📝 笔记总长度: 22703 字符
📊 分块数量: 12
🔄 处理第 1/12 块...
✅ 智谱 API 调用成功
📊 向量维度: 1024 ✅
✅ 第 1 块保存成功
🔄 处理第 2/12 块...
✅ 第 2 块保存成功
...
🎉 所有向量生成完成！
```

### 3. 搜索结果去重 (`src/pages/SearchResultsPage.tsx`)

**搜索逻辑：**
1. 生成查询向量
2. 搜索所有匹配的块（`match_count: 20`）
3. 按 `note_id` 分组
4. 每篇笔记只保留相似度最高的块
5. 排序并返回前 10 篇笔记

**Console 日志示例：**
```
🔍 开始搜索...
📝 搜索关键词: 死亡
🔄 生成查询向量...
✅ 查询向量生成成功，维度: 1024
🔄 调用 Supabase RPC 函数: search_notes_by_vector
✅ 搜索成功，找到 18 个匹配块
📊 去重后结果: 5 篇笔记
```

### 4. 数据库函数更新 (`supabase/vector_search_function.sql`)

**重要修改：**
- 字段名从 `ne.content` 改为 `ne.content_chunk`
- 这是关键的 Bug 修复！

```sql
SELECT
  n.id AS note_id,
  n.title,
  n.author,
  ne.content_chunk AS content_snippet,  -- 修复：使用 content_chunk
  1 - (ne.embedding <=> query_embedding) AS similarity
FROM note_embeddings ne
JOIN notes n ON ne.note_id = n.id
```

## 🔧 技术细节

### 分块策略

| 参数 | 值 | 说明 |
|------|-----|------|
| `chunkSize` | 2000 | 每块大小（字符） |
| `overlap` | 200 | 重叠大小（字符） |
| API 限制 | 5000 | 单次 API 调用最大字符数 |

### 为什么需要重叠？

重叠确保跨块的语义不会丢失。例如：

```
块1: "...个人同一性问题是哲学中的核心议题。Parfit 认为..."
块2: "...Parfit 认为个人同一性并不重要，重要的是心理连续性..."
```

如果没有重叠，"Parfit 认为" 可能被截断，影响搜索效果。

### 数据库表结构

`note_embeddings` 表：
```sql
CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES notes(id),
  content_chunk TEXT,      -- 文本块内容
  embedding VECTOR(1024),  -- 1024维向量
  created_at TIMESTAMPTZ
);
```

一篇笔记可能对应多行记录（多个块）。

## ⚠️ 重要提示

### 1. 必须更新 Supabase 函数

在 Supabase Dashboard 的 SQL Editor 中执行：

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
    ne.content_chunk AS content_snippet,  -- 关键：使用 content_chunk
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM note_embeddings ne
  JOIN notes n ON ne.note_id = n.id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$;
```

### 2. 处理时间

长文本处理需要时间：
- 1000 字符：约 5 秒
- 5000 字符：约 15 秒
- 10000 字符：约 30 秒
- 20000 字符：约 60 秒

用户会看到 "保存中..." 状态，请耐心等待。

### 3. 旧数据迁移

如果数据库中有旧笔记（使用 `content` 字段），需要：

**选项 A：重新编辑保存**
- 打开旧笔记
- 点击"保存"
- 系统会自动重新分块

**选项 B：批量迁移（SQL）**
```sql
-- 删除所有旧向量
DELETE FROM note_embeddings;

-- 然后在前端重新编辑保存每篇笔记
```

### 4. 字段名修复

**之前的 Bug：**
- 代码中使用 `content_chunk`
- SQL 函数中使用 `content`
- 导致搜索失败

**现在已修复：**
- 统一使用 `content_chunk`

## 📊 性能优化建议

### 1. 调整分块大小

如果笔记通常较短（< 5000 字符），可以增加 `chunkSize`：

```typescript
const chunks = chunkText(markdown, 3000, 300);
```

### 2. 并行处理（高级）

目前是串行处理每个块，可以改为并行：

```typescript
const embeddingPromises = chunks.map(chunk => generateEmbedding(chunk));
const embeddings = await Promise.all(embeddingPromises);
```

⚠️ 注意：并行可能触发 API 速率限制。

### 3. 缓存向量

如果笔记内容未改变，不需要重新生成向量。可以添加内容哈希检查。

## 🧪 测试步骤

### 测试 1：创建长文本笔记

1. 访问 `/notes/new`
2. 输入标题："长文本测试"
3. 输入 10000+ 字符的内容
4. 点击"保存"
5. 观察 Console 日志

**预期日志：**
```
✅ 笔记保存成功，ID: xxxxx
📝 笔记总长度: 12345 字符
📊 分块数量: 7
🔄 处理第 1/7 块...
✅ 第 1 块保存成功
...
🎉 所有向量生成完成！
```

### 测试 2：搜索长文本

1. 在搜索框输入关键词
2. 点击"搜索"
3. 观察 Console 日志

**预期日志：**
```
✅ 搜索成功，找到 15 个匹配块
📊 去重后结果: 3 篇笔记
```

### 测试 3：编辑笔记

1. 编辑一篇笔记
2. 修改内容
3. 保存
4. 确认旧向量被删除，新向量生成

**预期日志：**
```
✅ 笔记更新成功，ID: xxxxx
🗑️ 旧向量已删除
📝 笔记总长度: 8765 字符
📊 分块数量: 5
...
🎉 所有向量生成完成！
```

## 📝 修改文件列表

```
✅ src/services/aiService.ts              - 新增 chunkText() 函数
✅ src/pages/NoteEditorPage.tsx           - 实现分块处理逻辑
✅ src/pages/SearchResultsPage.tsx        - 实现去重逻辑
✅ supabase/vector_search_function.sql    - 修复字段名 Bug
```

## 🎉 完成！

长文本分块处理功能已完全实现。现在 PhiloNote 可以：
- ✅ 处理任意长度的笔记
- ✅ 搜索时找到具体相关的段落
- ✅ 自动去重，每篇笔记只显示一次
- ✅ 显示最相关的内容片段

开始测试吧！
