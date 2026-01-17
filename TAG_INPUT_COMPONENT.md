# 🏷️ TagInput 通用组件实现

## 概述

创建了一个通用的 `TagInput` 组件，用于处理作者和关键词的输入。组件设计灵活，支持未来扩展。

## 组件特性

### 1. 通用设计

通过 `type` 属性区分不同类型的 Tag：
- `type="author"`: 作者输入（当前限制为 1 个）
- `type="keyword"`: 关键词输入（支持多个）

### 2. 核心功能

✅ **添加 Tag**:
- 按 `Enter` 键添加
- 输入逗号 `,` 自动添加
- 自动去除空格
- 防止重复添加

✅ **删除 Tag**:
- 点击 `×` 按钮删除
- 按 `Backspace` 删除最后一个（当输入框为空时）

✅ **智能限制**:
- 作者：最多 1 个（预留未来支持多作者）
- 关键词：无限制

✅ **用户体验**:
- 输入框自动聚焦
- 占位符提示
- 悬停效果
- 键盘快捷键

## 组件接口

### Props

```typescript
interface TagInputProps {
  type: 'author' | 'keyword';      // Tag 类型
  value: string[];                  // 当前 Tags 数组
  onChange: (tags: string[]) => void; // 变化回调
  placeholder?: string;             // 占位符文本
}
```

### 使用示例

#### 作者输入（单个）

```tsx
<TagInput
  type="author"
  value={author ? [author] : []}
  onChange={(tags) => setAuthor(tags[0] || '')}
  placeholder="输入作者姓名..."
/>
```

#### 关键词输入（多个）

```tsx
<TagInput
  type="keyword"
  value={keywords}
  onChange={setKeywords}
  placeholder="输入关键词..."
/>
```

## 样式设计

### Tag 样式

```css
背景色: #E5F1FF (浅蓝色)
文字颜色: #1F2937 (深灰色)
圆角: 6px
内边距: 12px 横向, 4px 纵向
字体大小: 14px
字体粗细: 500 (medium)
```

### 删除按钮

```css
默认: 灰色
悬停: 红色 (#DC2626)
图标大小: 12px × 12px
过渡动画: 200ms
```

### 输入框

```css
边框: 1px solid #D1D5DB
聚焦边框: 2px solid #3B82F6
聚焦阴影: ring-2 ring-blue-500
圆角: 8px
内边距: 12px
背景: 白色
```

## 类型配置

每种类型都有独立的配置：

```typescript
const getTypeConfig = () => {
  switch (type) {
    case 'author':
      return {
        label: '作者',
        icon: '👤',
        maxTags: 1,  // 当前限制
      };
    case 'keyword':
      return {
        label: '关键词',
        icon: '🏷️',
        maxTags: Infinity,  // 无限制
      };
  }
};
```

## 键盘交互

| 按键 | 功能 |
|------|------|
| `Enter` | 添加当前输入为 Tag |
| `,` (逗号) | 自动添加 Tag |
| `Backspace` | 删除最后一个 Tag（输入框为空时） |
| `Escape` | 清空输入框（未实现，可扩展） |

## 数据流

### 作者（单个）

```
数据库: author: TEXT
  ↓
组件状态: author: string
  ↓
TagInput: value: string[]  (转换: [author] 或 [])
  ↓
用户编辑
  ↓
onChange: (tags: string[]) => void
  ↓
组件状态: setAuthor(tags[0] || '')  (取第一个)
  ↓
数据库: author: TEXT
```

### 关键词（多个）

```
数据库: keywords: TEXT[]
  ↓
组件状态: keywords: string[]
  ↓
TagInput: value: string[]  (直接传递)
  ↓
用户编辑
  ↓
onChange: (tags: string[]) => void
  ↓
组件状态: setKeywords(tags)  (直接更新)
  ↓
数据库: keywords: TEXT[]
```

## 集成到 NoteMetadataPanel

### 修改前

```tsx
{/* 作者 - 普通输入框 */}
<Input
  value={author}
  onChange={(e) => onAuthorChange(e.target.value)}
  placeholder="例如：Thomas Nagel"
/>

{/* 关键词 - 复杂的自定义实现 */}
<Input
  value={keywordInput}
  onChange={(e) => setKeywordInput(e.target.value)}
  onKeyPress={handleKeywordKeyPress}
/>
<Button onClick={handleAddKeyword}>添加</Button>
{keywords.map((keyword, index) => (
  <Badge>
    {keyword}
    <X onClick={() => handleRemoveKeyword(index)} />
  </Badge>
))}
```

### 修改后

```tsx
{/* 作者 - 使用 TagInput */}
<TagInput
  type="author"
  value={author ? [author] : []}
  onChange={(tags) => onAuthorChange(tags[0] || '')}
  placeholder="输入作者姓名..."
/>

{/* 关键词 - 使用 TagInput */}
<TagInput
  type="keyword"
  value={keywords}
  onChange={onKeywordsChange}
  placeholder="输入关键词..."
/>
```

### 优势

✅ **代码简化**: 从 50+ 行减少到 10 行
✅ **一致性**: 作者和关键词使用相同的交互模式
✅ **可维护性**: 逻辑集中在一个组件中
✅ **可扩展性**: 未来添加新类型只需修改配置

## 未来扩展计划

### 1. 支持多作者

当数据库支持多作者时，只需修改配置：

```typescript
case 'author':
  return {
    label: '作者',
    icon: '👤',
    maxTags: Infinity,  // 改为无限制
  };
```

### 2. 添加新类型

例如添加"出版物"类型：

```typescript
case 'publication':
  return {
    label: '出版物',
    icon: '📚',
    maxTags: 1,
  };
```

使用：

```tsx
<TagInput
  type="publication"
  value={publication ? [publication] : []}
  onChange={(tags) => setPublication(tags[0] || '')}
/>
```

### 3. 自定义样式

为不同类型添加不同的颜色：

```typescript
const getTagStyle = () => {
  switch (type) {
    case 'author':
      return 'bg-blue-100 text-blue-800';
    case 'keyword':
      return 'bg-green-100 text-green-800';
    case 'publication':
      return 'bg-purple-100 text-purple-800';
  }
};
```

### 4. 添加验证

```typescript
const validateTag = (tag: string): boolean => {
  switch (type) {
    case 'author':
      // 验证作者名格式
      return /^[a-zA-Z\s]+$/.test(tag);
    case 'keyword':
      // 验证关键词长度
      return tag.length >= 2 && tag.length <= 20;
    default:
      return true;
  }
};
```

### 5. 添加自动完成

```typescript
interface TagInputProps {
  // ... 现有 props
  suggestions?: string[];  // 建议列表
  onSearch?: (query: string) => void;  // 搜索回调
}
```

## 文件结构

```
philonote/
├── src/
│   ├── components/
│   │   ├── TagInput.tsx              ← 新增：通用 Tag 组件
│   │   └── NoteMetadataPanel.tsx     ← 修改：使用 TagInput
│   └── pages/
│       └── NoteEditorPage.tsx        ← 无需修改（通过 Panel 使用）
```

## 测试场景

### 1. 作者输入

- [ ] 输入作者名，按 Enter 添加
- [ ] 输入作者名，输入逗号添加
- [ ] 添加第二个作者时，替换第一个
- [ ] 点击 × 删除作者
- [ ] 输入框为空时按 Backspace 删除作者
- [ ] 提示文本显示"暂时只支持一个作者"

### 2. 关键词输入

- [ ] 输入关键词，按 Enter 添加
- [ ] 输入关键词，输入逗号添加
- [ ] 添加多个关键词
- [ ] 点击 × 删除特定关键词
- [ ] 输入框为空时按 Backspace 删除最后一个关键词
- [ ] 防止添加重复关键词
- [ ] 防止添加空关键词

### 3. 样式验证

- [ ] Tag 背景色为浅蓝色
- [ ] Tag 文字颜色为深灰色
- [ ] × 按钮悬停时变红色
- [ ] 输入框聚焦时有蓝色边框
- [ ] Tag 之间有适当间距

### 4. 边界情况

- [ ] 输入只有空格的内容
- [ ] 输入超长文本
- [ ] 快速连续按 Enter
- [ ] 输入多个逗号
- [ ] 复制粘贴包含逗号的文本

## 性能优化

### 1. 防抖输入

对于未来的自动完成功能：

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    onSearch?.(query);
  }, 300),
  [onSearch]
);
```

### 2. 虚拟滚动

如果 Tag 数量很多（>100）：

```typescript
import { FixedSizeList } from 'react-window';
```

### 3. Memo 优化

```typescript
const TagInput = memo(function TagInput({ ... }) {
  // ...
});
```

## 相关文件

- ✅ `philonote/src/components/TagInput.tsx` - 新增组件
- ✅ `philonote/src/components/NoteMetadataPanel.tsx` - 已更新
- 📖 `philonote/src/pages/NoteEditorPage.tsx` - 使用 Panel（无需修改）

## 完成标准

- ✅ 创建 TagInput 组件
- ✅ 支持 author 和 keyword 两种类型
- ✅ 实现添加、删除功能
- ✅ 支持 Enter 和逗号添加
- ✅ 支持 Backspace 删除
- ✅ 防止重复和空值
- ✅ 作者限制为 1 个
- ✅ 关键词支持多个
- ✅ 集成到 NoteMetadataPanel
- ✅ 样式符合设计要求
- ✅ 添加图标和标签
- ✅ 添加提示文本

## 总结

TagInput 组件提供了一个统一、灵活、易扩展的 Tag 输入解决方案。通过类型配置，可以轻松支持不同的使用场景，同时保持代码的简洁和可维护性。
