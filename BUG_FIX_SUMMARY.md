# 🐛 Bug 修复总结

## 问题描述

浏览器 Console 显示以下错误：
- `Failed to load resource: uplhybammnxmxznqgntx.supabase.co/note_embeddings?1` (400)
- `Failed to load resource: uplhybammnxmxznqgntx.supabase.co/h_notes_by_vector1` (404)

## ✅ 已修复的问题

### 1. AI Service (`src/services/aiService.ts`)

**修复内容：**
- ✅ 添加详细的 console.log 日志
- ✅ 限制文本长度为 2000 字符（避免超过 API 限制）
- ✅ 添加向量维度验证
- ✅ 改进错误处理和日志输出

**关键改动：**
```typescript
// 限制文本长度
const truncatedText = text.substring(0, 2000);

// 详细日志
console.log('🔄 调用智谱 API 生成向量...');
console.log('📝 文本长度:', text.length);
console.log('✅ 智谱 API 调用成功');
console.log('📊 向量维度:', data.data[0].embedding.length);
```

### 2. 笔记编辑页 (`src/pages/NoteEditorPage.tsx`)

**修复内容：**
- ✅ 添加详细的向量生成日志
- ✅ 截取内容片段为 1000 字符（`content` 字段）
- ✅ 完整内容用于生成向量
- ✅ 改进错误处理

**关键改动：**
```typescript
// 新建笔记
console.log('🔄 开始生成向量（新建模式）...');
console.log('📝 内容长度:', markdown.length);
console.log('📋 笔记 ID:', data.id);

const embedding = await generateEmbedding(markdown);
console.log('✅ 向量生成成功，维度:', embedding.length);

const { error: embError } = await supabase
  .from('note_embeddings')
  .insert({
    note_id: data.id,
    content: markdown.substring(0, 1000), // 截取前1000字符
    embedding: embedding,
  });

console.log('✅ 向量保存成功！');
```

### 3. 搜索结果页 (`src/pages/SearchResultsPage.tsx`)

**修复内容：**
- ✅ 添加详细的搜索流程日志
- ✅ 记录 RPC 函数调用
- ✅ 显示搜索结果数量
- ✅ 改进错误处理

**关键改动：**
```typescript
console.log('🔍 开始搜索...');
console.log('📝 搜索关键词:', searchQuery);
console.log('🔄 生成查询向量...');
console.log('✅ 查询向量生成成功，维度:', queryEmbedding.length);
console.log('🔄 调用 Supabase RPC 函数: search_notes_by_vector');
console.log('✅ 搜索成功，找到', data?.length || 0, '个结果');
```

## 🔍 调试日志说明

### 创建/编辑笔记时的日志流程

```
🔄 调用智谱 API 生成向量...
📝 文本长度: 1234
✅ 智谱 API 调用成功
📊 向量维度: 1024
🔄 开始生成向量（新建模式）...
📝 内容长度: 1234
📋 笔记 ID: abc-123-def
✅ 向量生成成功，维度: 1024
✅ 向量保存成功！
```

### 搜索时的日志流程

```
🔍 开始搜索...
📝 搜索关键词: 死亡
🔄 生成查询向量...
📝 文本长度: 2
✅ 智谱 API 调用成功
📊 向量维度: 1024
✅ 查询向量生成成功，维度: 1024
🔄 调用 Supabase RPC 函数: search_notes_by_vector
✅ 搜索成功，找到 3 个结果
📊 搜索结果: [...]
```

## ✅ 验证清单

修复后，请确认以下几点：

### 代码检查
- [x] 使用 `supabase.from('note_embeddings').insert(...)`
- [x] 使用 `supabase.rpc('search_notes_by_vector', {...})`
- [x] 所有 Supabase 操作通过 `import { supabase } from '../lib/supabase'`
- [x] 没有直接使用 `fetch('...supabase.co/...')`

### 功能检查
- [ ] 创建笔记时能看到向量生成日志
- [ ] 向量保存成功（无 400 错误）
- [ ] 搜索时能看到完整的日志流程
- [ ] 搜索结果正常显示（无 404 错误）

## 🚀 测试步骤

### 1. 测试创建笔记
```bash
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 访问 /notes/new
4. 输入标题和内容
5. 点击"保存"
6. 观察 Console 日志
```

**预期日志：**
```
🔄 调用智谱 API 生成向量...
📝 文本长度: xxx
✅ 智谱 API 调用成功
📊 向量维度: 1024
🔄 开始生成向量（新建模式）...
✅ 向量生成成功，维度: 1024
✅ 向量保存成功！
```

### 2. 测试搜索功能
```bash
1. 在笔记列表页输入搜索词
2. 点击"搜索"
3. 观察 Console 日志
```

**预期日志：**
```
🔍 开始搜索...
📝 搜索关键词: xxx
🔄 生成查询向量...
✅ 查询向量生成成功，维度: 1024
🔄 调用 Supabase RPC 函数: search_notes_by_vector
✅ 搜索成功，找到 X 个结果
```

## ⚠️ 常见问题排查

### 问题 1: 仍然出现 400 错误

**可能原因：**
1. 智谱 API Key 未配置或错误
2. 文本内容为空
3. 向量维度不匹配

**解决方案：**
```bash
# 检查 .env 文件
cat .env | grep VITE_ZHIPU_API_KEY

# 确认 API Key 正确
# 查看 Console 日志中的错误详情
```

### 问题 2: 仍然出现 404 错误

**可能原因：**
1. Supabase 函数 `search_notes_by_vector` 未创建
2. 函数名称拼写错误

**解决方案：**
```sql
-- 在 Supabase Dashboard 的 SQL Editor 中执行
SELECT * FROM pg_proc WHERE proname = 'search_notes_by_vector';

-- 如果没有结果，执行 supabase/vector_search_function.sql
```

### 问题 3: 向量保存失败

**可能原因：**
1. `note_embeddings` 表不存在
2. 表结构不正确
3. RLS 策略阻止插入

**解决方案：**
```sql
-- 检查表是否存在
SELECT * FROM note_embeddings LIMIT 1;

-- 检查表结构
\d note_embeddings

-- 临时禁用 RLS 测试（仅用于调试）
ALTER TABLE note_embeddings DISABLE ROW LEVEL SECURITY;
```

## 📝 修改文件列表

```
✅ src/services/aiService.ts          - 添加日志和文本截断
✅ src/pages/NoteEditorPage.tsx       - 添加详细日志
✅ src/pages/SearchResultsPage.tsx    - 添加搜索日志
```

## 🎯 下一步

如果问题仍然存在：
1. 复制完整的 Console 错误日志
2. 检查 Supabase Dashboard 的日志
3. 确认数据库表结构和 RLS 策略
4. 验证智谱 API Key 是否有效

## 📞 需要帮助？

如果修复后仍有问题，请提供：
1. 完整的 Console 错误日志
2. Supabase Dashboard 的错误信息
3. 网络请求的详细信息（Network 标签）
