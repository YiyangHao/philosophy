# PhiloNote AI 智能搜索系统 - 完整指南

## ✅ 已完成功能

### 1. AI Service 抽象层
- ✅ 智谱 AI Embedding API 集成
- ✅ `generateEmbedding()` - 生成文本向量
- ✅ `generateSummary()` - AI 总结（可选）
- ✅ 错误处理和重试机制

### 2. 自动向量生成
- ✅ 创建笔记时自动生成向量
- ✅ 编辑笔记时更新向量
- ✅ 向量存储到 `note_embeddings` 表
- ✅ 失败时不阻止笔记保存

### 3. 搜索功能
- ✅ 笔记列表页搜索框
- ✅ 搜索结果页（向量相似度搜索）
- ✅ 相关度显示（星星 + 百分比）
- ✅ 内容片段预览
- ✅ 跳转到完整笔记

## 🚀 使用步骤

### 步骤 1: 配置智谱 AI API Key

编辑 `.env` 文件：
```env
VITE_ZHIPU_API_KEY=your_zhipu_api_key_here
```

获取 API Key：
1. 访问 https://open.bigmodel.cn/
2. 注册/登录账号
3. 进入控制台获取 API Key

### 步骤 2: 在 Supabase 创建向量搜索函数

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 `supabase/vector_search_function.sql` 的内容
4. 粘贴并执行

SQL 内容：
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
```

### 步骤 3: 启动应用

```bash
cd philonote
npm run dev
```

访问：http://localhost:5173

## 📝 功能测试清单

### 测试 1: 创建笔记并生成向量
- [ ] 访问 http://localhost:5173/notes/new
- [ ] 输入标题："死亡的哲学思考"
- [ ] 输入内容："Nagel 认为死亡是一种剥夺..."
- [ ] 点击"保存"
- [ ] 等待几秒（生成向量）
- [ ] 确认保存成功

### 测试 2: 使用搜索功能
- [ ] 返回笔记列表页
- [ ] 在搜索框输入："死亡"
- [ ] 点击"搜索"按钮
- [ ] 等待搜索结果加载
- [ ] 查看相关度显示（星星和百分比）
- [ ] 点击"查看完整笔记"

### 测试 3: 编辑笔记更新向量
- [ ] 编辑一篇笔记
- [ ] 修改内容
- [ ] 保存
- [ ] 确认向量已更新（再次搜索应该反映新内容）

## 🎨 UI 特点

### 搜索框设计
- 高度：44px
- 圆角：8px
- 边框：1px solid #E5E5E5
- 聚焦时边框变蓝：#007AFF
- 搜索图标在左侧

### 搜索结果卡片
- 标题：大号字体，黑色
- 作者：小号字体，灰色
- 相关度：金色 Badge（#FFB800）
- 星星评分：0-5星
- 内容片段：最多3行，灰色
- "查看完整笔记"按钮

## 🔧 技术实现细节

### 向量生成流程

```typescript
// 1. 用户保存笔记
const markdown = await editor.blocksToMarkdownLossy(editor.document);

// 2. 保存到 notes 表
const { data: note } = await supabase
  .from('notes')
  .insert({ title, content: markdown, ... })
  .select()
  .single();

// 3. 生成向量
const embedding = await generateEmbedding(markdown);

// 4. 保存向量到 note_embeddings 表
await supabase
  .from('note_embeddings')
  .insert({
    note_id: note.id,
    content: markdown,
    embedding: embedding,
  });
```

### 搜索流程

```typescript
// 1. 获取搜索词
const query = searchParams.get('q');

// 2. 将搜索词转成向量
const queryEmbedding = await generateEmbedding(query);

// 3. 执行向量搜索
const { data: results } = await supabase.rpc('search_notes_by_vector', {
  query_embedding: queryEmbedding,
  match_threshold: 0.5,
  match_count: 10,
});

// 4. 显示结果
results.forEach(result => {
  console.log(result.title, result.similarity);
});
```

### 智谱 AI API 调用

```typescript
const response = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'embedding-2',
    input: text,
  }),
});

const data = await response.json();
return data.data[0].embedding; // 1024维向量
```

## 📂 新增文件

```
src/
├── services/
│   └── aiService.ts              # AI Service 抽象层
├── pages/
│   ├── NotesListPage.tsx         # 添加了搜索框
│   ├── NoteEditorPage.tsx        # 添加了向量生成
│   └── SearchResultsPage.tsx     # 新建：搜索结果页
└── App.tsx                       # 添加了搜索路由

supabase/
└── vector_search_function.sql    # 向量搜索函数
```

## ⚠️ 重要提示

### 1. API Key 配置
- 必须配置 `VITE_ZHIPU_API_KEY`
- 不要将 API Key 提交到 Git
- 使用 `.env.local` 或 `.env`

### 2. 向量生成时间
- 每次保存笔记需要 2-5 秒生成向量
- 显示 Loading 状态提示用户
- 失败时不阻止笔记保存

### 3. 搜索阈值
- `match_threshold: 0.5` - 较宽松，返回更多结果
- `match_threshold: 0.7` - 较严格，只返回高相关度结果
- 可根据实际效果调整

### 4. 向量维度
- 智谱 embedding-2 模型：1024 维
- 必须与数据库 `VECTOR(1024)` 匹配
- 不要修改维度

## ❓ 常见问题

### Q: 搜索没有结果？
A: 检查：
1. 是否已创建笔记并生成向量
2. Supabase 函数是否已创建
3. 搜索阈值是否太高（降低到 0.5）

### Q: 向量生成失败？
A: 检查：
1. 智谱 API Key 是否正确
2. 网络连接是否正常
3. 浏览器控制台错误信息

### Q: 搜索很慢？
A: 优化方案：
1. 添加向量索引（已在 schema.sql 中）
2. 减少 `match_count`
3. 提高 `match_threshold`

### Q: 如何查看向量数据？
A: 在 Supabase Dashboard：
```sql
SELECT * FROM note_embeddings LIMIT 10;
```

## 🎯 下一步优化

- [ ] 添加搜索历史
- [ ] 支持多语言搜索
- [ ] 添加搜索过滤（按作者、年份）
- [ ] 实现 AI 总结功能
- [ ] 添加搜索结果高亮
- [ ] 支持批量向量生成

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台错误
2. 查看 Supabase Dashboard 日志
3. 确认 API Key 和数据库配置
4. 参考本文档的故障排除部分
