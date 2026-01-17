# 🔍 搜索结果去重逻辑诊断

## 问题描述

- Supabase RPC 返回了 2 个结果：`Array(2)`
- 经过去重后变成 1 个：`Array(1)`
- 前端显示"没有找到相关笔记"

## ✅ 已添加的详细日志

在 `src/pages/SearchResultsPage.tsx` 的去重逻辑中添加了详细日志：

```typescript
console.log('✅ 搜索成功，找到', data?.length || 0, '个匹配块');
console.log('🔄 开始去重处理...');

data.forEach((result: SearchResult) => {
  console.log(`  - 处理结果: note_id=${result.note_id}, similarity=${result.similarity}`);
  if (!groupedResults[result.note_id] || 
      groupedResults[result.note_id].similarity < result.similarity) {
    groupedResults[result.note_id] = result;
    console.log(`    ✅ 保留此结果`);
  } else {
    console.log(`    ⏭️ 跳过（已有更高相似度的结果）`);
  }
});

console.log('📊 去重后的 groupedResults:', Object.keys(groupedResults).length, '个唯一笔记');
console.log('📊 去重后结果:', topResults.length, '篇笔记');
console.log('📊 最终搜索结果:', topResults);
```

## 📊 预期的 Console 输出

### 场景 1：正常去重（2个块来自同一篇笔记）

```
✅ 搜索成功，找到 2 个匹配块
🔄 开始去重处理...
  - 处理结果: note_id=abc-123, similarity=0.85
    ✅ 保留此结果
  - 处理结果: note_id=abc-123, similarity=0.75
    ⏭️ 跳过（已有更高相似度的结果）
📊 去重后的 groupedResults: 1 个唯一笔记
📊 去重后结果: 1 篇笔记
📊 最终搜索结果: [{note_id: "abc-123", ...}]
```

**结果：** 应该显示 1 个搜索结果 ✅

### 场景 2：正常去重（2个块来自不同笔记）

```
✅ 搜索成功，找到 2 个匹配块
🔄 开始去重处理...
  - 处理结果: note_id=abc-123, similarity=0.85
    ✅ 保留此结果
  - 处理结果: note_id=def-456, similarity=0.75
    ✅ 保留此结果
📊 去重后的 groupedResults: 2 个唯一笔记
📊 去重后结果: 2 篇笔记
📊 最终搜索结果: [{note_id: "abc-123", ...}, {note_id: "def-456", ...}]
```

**结果：** 应该显示 2 个搜索结果 ✅

### 场景 3：异常情况（note_id 为 null 或 undefined）

```
✅ 搜索成功，找到 2 个匹配块
🔄 开始去重处理...
  - 处理结果: note_id=undefined, similarity=0.85
    ✅ 保留此结果
  - 处理结果: note_id=undefined, similarity=0.75
    ⏭️ 跳过（已有更高相似度的结果）
📊 去重后的 groupedResults: 1 个唯一笔记
📊 去重后结果: 1 篇笔记
📊 最终搜索结果: [{note_id: undefined, ...}]
```

**问题：** 如果 `note_id` 为 `undefined`，所有结果会被当作同一篇笔记！❌

## 🔧 去重逻辑说明

### 当前实现

```typescript
const groupedResults: Record<string, SearchResult> = {};

data.forEach((result: SearchResult) => {
  if (
    !groupedResults[result.note_id] ||
    groupedResults[result.note_id].similarity < result.similarity
  ) {
    groupedResults[result.note_id] = result;
  }
});

const topResults = Object.values(groupedResults)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 10);
```

### 工作原理

1. **创建 Map**：使用 `note_id` 作为键
2. **遍历结果**：对每个结果
   - 如果该 `note_id` 不存在，添加
   - 如果该 `note_id` 已存在，比较相似度
   - 保留相似度更高的结果
3. **转换为数组**：`Object.values(groupedResults)`
4. **排序**：按相似度降序
5. **限制数量**：最多返回 10 个

### 可能的问题

#### 问题 1：note_id 为 null 或 undefined

**症状：**
```
📊 去重后的 groupedResults: 1 个唯一笔记
（但实际应该有 2 个）
```

**原因：**
```typescript
groupedResults[undefined] = result1;  // 第一个结果
groupedResults[undefined] = result2;  // 覆盖第一个结果
```

**解决方案：**
```typescript
// 添加 note_id 验证
if (!result.note_id) {
  console.warn('⚠️ 结果缺少 note_id:', result);
  return;  // 跳过无效结果
}
```

#### 问题 2：相似度比较错误

**症状：**
```
  - 处理结果: note_id=abc-123, similarity=0.85
    ✅ 保留此结果
  - 处理结果: note_id=abc-123, similarity=0.95
    ⏭️ 跳过（已有更高相似度的结果）
```

**原因：** 相似度比较逻辑反了

**当前代码：**
```typescript
if (groupedResults[result.note_id].similarity < result.similarity) {
  // 如果新结果相似度更高，替换
}
```

这个逻辑是**正确的** ✅

#### 问题 3：数据类型不匹配

**症状：**
```
🔍 第一项的所有字段: ["note_id", "note_title", ...]
（字段名正确）

但是：
  - 处理结果: note_id=undefined, similarity=undefined
```

**原因：** TypeScript 接口与实际数据不匹配

**检查：**
```typescript
// 接口定义
interface SearchResult {
  note_id: string;
  note_title: string;
  // ...
}

// 实际数据
{
  note_id: "abc-123",  // ✅ 匹配
  title: "..."         // ❌ 不匹配（应该是 note_title）
}
```

## 🧪 诊断步骤

### 1. 运行搜索并查看 Console

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 执行搜索
4. 查看完整的日志输出

### 2. 检查关键日志

**日志 A：RPC 返回数据**
```
🔍 RPC 原始返回数据: Array(2)
🔍 返回数据的第一项: {note_id: "...", ...}
```

**日志 B：去重处理**
```
🔄 开始去重处理...
  - 处理结果: note_id=?, similarity=?
```

**日志 C：最终结果**
```
📊 去重后的 groupedResults: ? 个唯一笔记
📊 最终搜索结果: Array(?)
```

### 3. 根据日志判断问题

| 日志输出 | 问题 | 解决方案 |
|---------|------|---------|
| `note_id=undefined` | 字段名不匹配 | 检查接口定义 |
| `similarity=undefined` | 字段名不匹配 | 检查接口定义 |
| 去重后 0 个 | 所有结果被过滤 | 检查过滤条件 |
| 去重后 1 个（应该是 2 个） | note_id 重复或为空 | 检查数据完整性 |

## 🔧 可能的修复方案

### 修复 1：添加 note_id 验证

```typescript
if (data) {
  data.forEach((result: SearchResult) => {
    // 验证 note_id
    if (!result.note_id) {
      console.warn('⚠️ 结果缺少 note_id，跳过:', result);
      return;
    }

    console.log(`  - 处理结果: note_id=${result.note_id}, similarity=${result.similarity}`);
    
    if (
      !groupedResults[result.note_id] ||
      groupedResults[result.note_id].similarity < result.similarity
    ) {
      groupedResults[result.note_id] = result;
      console.log(`    ✅ 保留此结果`);
    } else {
      console.log(`    ⏭️ 跳过（已有更高相似度的结果）`);
    }
  });
}
```

### 修复 2：使用 Map 代替 Record

```typescript
// 使用 Map 更安全
const groupedResults = new Map<string, SearchResult>();

if (data) {
  data.forEach((result: SearchResult) => {
    if (!result.note_id) {
      console.warn('⚠️ 结果缺少 note_id，跳过');
      return;
    }

    const existing = groupedResults.get(result.note_id);
    if (!existing || existing.similarity < result.similarity) {
      groupedResults.set(result.note_id, result);
      console.log(`    ✅ 保留此结果`);
    } else {
      console.log(`    ⏭️ 跳过（已有更高相似度的结果）`);
    }
  });
}

const topResults = Array.from(groupedResults.values())
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 10);
```

### 修复 3：确保字段名匹配

检查 SQL 函数返回的字段名：

```sql
SELECT
  n.id AS note_id,        -- ✅ 正确
  n.title AS note_title,  -- ✅ 正确（不是 title）
  n.author AS note_author,
  n.keywords AS note_keywords,
  ne.content_chunk,
  1 - (ne.embedding <=> query_embedding) AS similarity
```

## 📝 测试清单

- [ ] 查看 Console 日志
- [ ] 确认 RPC 返回了数据
- [ ] 确认 `note_id` 不为 `undefined`
- [ ] 确认 `similarity` 不为 `undefined`
- [ ] 确认去重逻辑正确执行
- [ ] 确认最终结果数量正确
- [ ] 确认前端正确显示结果

## 🎯 下一步

1. **运行搜索**
2. **复制完整的 Console 日志**
3. **根据日志判断问题**
4. **应用相应的修复方案**

如果问题仍然存在，请提供完整的 Console 输出！
