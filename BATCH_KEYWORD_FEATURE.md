# 🏷️ 批量添加关键词功能

## 功能概述

在搜索结果页面，用户可以一键将搜索词作为关键词批量添加到所有搜索结果涉及的笔记中。

## 使用场景

### 场景 1：学术研究整理

用户搜索"个人同一性"，找到 9 个相关段落，来自 3 篇不同的笔记。点击批量添加按钮后，这 3 篇笔记都会自动添加"个人同一性"关键词，方便后续按关键词筛选。

### 场景 2：主题标注

用户搜索"康德"，找到多篇相关笔记。批量添加关键词后，所有涉及康德的笔记都会被标注，便于主题分类。

### 场景 3：快速整理

用户搜索某个概念，发现多篇笔记都相关，但之前没有添加关键词。通过批量添加功能，可以快速完成标注工作。

## UI 设计

### 搜索结果页顶部

```
┌─────────────────────────────────────────────────────────────┐
│ 搜索词："个人同一性"                                          │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 找到 9 个结果，来自 3 篇笔记                            │   │
│ │                                                         │   │
│ │              [🏷️ 将 "个人同一性" 添加到所有笔记]       │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 按钮状态

#### 1. 默认状态
```
[🏷️ 将 "个人同一性" 添加到所有笔记]
背景：蓝色 (#3B82F6)
文字：白色
```

#### 2. 加载状态
```
[⏳ 添加中...]
背景：蓝色
显示：旋转加载图标
禁用：是
```

#### 3. 完成状态
```
[✓ 已添加]
背景：绿色 (#16A34A)
文字：白色
禁用：是
```

## 实现逻辑

### 1. 提取唯一笔记 ID

```typescript
const uniqueNoteIds = [...new Set(results.map(r => r.note_id))];
```

**说明：**
- 从搜索结果中提取所有 `note_id`
- 使用 `Set` 去重（因为同一篇笔记可能有多个匹配的 chunks）
- 转换回数组用于后续处理

### 2. 逐个更新笔记

```typescript
for (const noteId of uniqueNoteIds) {
  // 1. 获取当前关键词
  const { data: note } = await supabase
    .from('notes')
    .select('keywords')
    .eq('id', noteId)
    .single();

  // 2. 检查是否已存在
  const currentKeywords = note.keywords || [];
  if (currentKeywords.includes(query.trim())) {
    skipCount++;
    continue;
  }

  // 3. 添加新关键词
  const updatedKeywords = [...currentKeywords, query.trim()];
  await supabase
    .from('notes')
    .update({ keywords: updatedKeywords })
    .eq('id', noteId);

  successCount++;
}
```

**为什么不用批量更新？**

Supabase/PostgreSQL 的 `array_append` 在批量操作时难以避免重复。逐个更新虽然慢一些，但逻辑更清晰，更容易处理边界情况。

### 3. 显示结果反馈

```typescript
if (successCount > 0) {
  alert(`✅ 已为 ${successCount} 篇笔记添加关键词 "${query}"
${skipCount > 0 ? `\n⏭️ ${skipCount} 篇笔记已有该关键词` : ''}`);
}
```

## 技术细节

### 状态管理

```typescript
const [addingKeywords, setAddingKeywords] = useState(false);  // 是否正在添加
const [keywordsAdded, setKeywordsAdded] = useState(false);    // 是否已完成
```

### 按钮禁用逻辑

```typescript
disabled={addingKeywords || keywordsAdded}
```

- `addingKeywords`: 正在添加时禁用，防止重复点击
- `keywordsAdded`: 已完成后禁用，避免重复添加

### 重置状态

```typescript
const performSearch = async (searchQuery: string) => {
  setKeywordsAdded(false);  // 新搜索时重置状态
  // ...
};
```

每次执行新搜索时，重置 `keywordsAdded` 状态，允许用户再次添加。

## 错误处理

### 1. 获取笔记失败

```typescript
if (fetchError) {
  console.error('❌ 获取笔记失败:', noteId, fetchError);
  continue;  // 跳过这篇笔记，继续处理其他笔记
}
```

### 2. 更新笔记失败

```typescript
if (updateError) {
  console.error('❌ 更新笔记失败:', noteId, updateError);
  // 不中断流程，继续处理其他笔记
}
```

### 3. 整体失败

```typescript
catch (err) {
  console.error('❌ 批量添加关键词失败:', err);
  alert('添加关键词失败，请稍后重试');
}
```

## 用户反馈

### 成功场景

```
✅ 已为 3 篇笔记添加关键词 "个人同一性"
```

### 部分成功场景

```
✅ 已为 2 篇笔记添加关键词 "个人同一性"
⏭️ 1 篇笔记已有该关键词
```

### 全部跳过场景

```
ℹ️ 所有笔记都已包含关键词 "个人同一性"
```

### 失败场景

```
❌ 未能添加关键词，请稍后重试
```

## 性能考虑

### 当前实现

- **方式**：逐个更新（串行）
- **优点**：逻辑清晰，易于处理重复
- **缺点**：笔记数量多时较慢

### 性能估算

- 每个笔记更新：~100-200ms
- 3 篇笔记：~300-600ms（可接受）
- 10 篇笔记：~1-2s（稍慢但可接受）
- 50 篇笔记：~5-10s（需要优化）

### 未来优化方案

如果需要处理大量笔记，可以考虑：

#### 方案 1：使用 PostgreSQL 函数

```sql
CREATE OR REPLACE FUNCTION batch_add_keyword(
  note_ids UUID[],
  keyword TEXT
)
RETURNS TABLE (
  note_id UUID,
  added BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE notes
  SET keywords = CASE
    WHEN keyword = ANY(keywords) THEN keywords
    ELSE array_append(keywords, keyword)
  END
  WHERE id = ANY(note_ids)
  RETURNING id, (keyword = ANY(keywords));
END;
$$;
```

#### 方案 2：并行更新

```typescript
await Promise.all(
  uniqueNoteIds.map(async (noteId) => {
    // 更新逻辑
  })
);
```

但需要注意并发控制，避免过多并发请求。

## 边界情况处理

### 1. 空搜索词

```typescript
if (!query.trim() || results.length === 0) return;
```

### 2. 无搜索结果

按钮会被禁用或隐藏（通过条件渲染）。

### 3. 关键词已存在

```typescript
if (currentKeywords.includes(query.trim())) {
  skipCount++;
  continue;
}
```

### 4. 关键词为 null

```typescript
const currentKeywords = note.keywords || [];
```

### 5. 搜索词包含空格

```typescript
query.trim()  // 自动去除首尾空格
```

## 测试场景

### 功能测试

- [ ] 搜索后显示批量添加按钮
- [ ] 按钮显示正确的笔记数量
- [ ] 点击按钮成功添加关键词
- [ ] 添加过程中显示加载状态
- [ ] 完成后显示成功状态
- [ ] 成功后按钮变为绿色并禁用

### 边界测试

- [ ] 搜索词为空时按钮禁用
- [ ] 无搜索结果时按钮不显示
- [ ] 关键词已存在时正确跳过
- [ ] 部分笔记更新失败时继续处理其他笔记
- [ ] 网络错误时显示错误提示

### 性能测试

- [ ] 3 篇笔记：响应时间 < 1s
- [ ] 10 篇笔记：响应时间 < 3s
- [ ] 加载状态正确显示

### UI 测试

- [ ] 按钮样式正确
- [ ] 悬停效果正常
- [ ] 加载动画流畅
- [ ] 完成状态显示正确
- [ ] 统计信息准确

## 代码结构

### 新增状态

```typescript
const [addingKeywords, setAddingKeywords] = useState(false);
const [keywordsAdded, setKeywordsAdded] = useState(false);
```

### 新增函数

```typescript
const handleBatchAddKeyword = async () => {
  // 批量添加逻辑
};
```

### 新增 UI

```typescript
<div className="flex items-center justify-between mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  {/* 统计信息 */}
  <div>...</div>
  
  {/* 批量添加按钮 */}
  <Button onClick={handleBatchAddKeyword}>...</Button>
</div>
```

## 相关文件

- ✅ `philonote/src/pages/SearchResultsPage.tsx` - 搜索结果页（已修改）
- 📖 `philonote/src/components/ui/button.tsx` - 按钮组件
- 📖 `philonote/src/lib/supabase.ts` - Supabase 客户端

## 完成标准

- ✅ 显示搜索结果统计（结果数、笔记数）
- ✅ 显示批量添加按钮
- ✅ 提取唯一笔记 ID
- ✅ 逐个检查并更新笔记
- ✅ 避免重复添加关键词
- ✅ 显示加载状态
- ✅ 显示完成状态
- ✅ 显示成功/失败反馈
- ✅ 处理所有边界情况
- ✅ 错误处理完善

## 用户体验提升

### 修改前

用户需要：
1. 搜索找到相关笔记
2. 逐个打开笔记
3. 手动添加关键词
4. 保存并返回
5. 重复 2-4 步骤

**耗时：** 每篇笔记 ~30 秒，3 篇笔记 ~1.5 分钟

### 修改后

用户只需：
1. 搜索找到相关笔记
2. 点击批量添加按钮
3. 等待 1-2 秒

**耗时：** ~5 秒

**效率提升：** 18 倍！

## 未来扩展

### 1. 批量删除关键词

```typescript
const handleBatchRemoveKeyword = async () => {
  // 从所有笔记中删除指定关键词
};
```

### 2. 自定义关键词

```typescript
<Input
  placeholder="输入要添加的关键词"
  value={customKeyword}
  onChange={(e) => setCustomKeyword(e.target.value)}
/>
<Button onClick={() => handleBatchAddKeyword(customKeyword)}>
  添加自定义关键词
</Button>
```

### 3. 批量操作历史

记录批量操作历史，支持撤销：

```typescript
const [operationHistory, setOperationHistory] = useState([]);

const handleUndo = async () => {
  // 撤销最后一次批量操作
};
```

### 4. 进度显示

对于大量笔记，显示进度条：

```typescript
<Progress value={(processedCount / totalCount) * 100} />
```

## 总结

批量添加关键词功能大大提升了用户整理笔记的效率，特别是在学术研究场景中。通过一键操作，用户可以快速为相关笔记添加主题标签，便于后续的分类和检索。
