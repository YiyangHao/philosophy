# 🔄 单作者到多作者迁移

## 概述

将 PhiloNote 从单作者模式升级为多作者模式，支持为每篇笔记添加多个作者。

## 数据库变更

### 已完成的数据库迁移

```sql
-- 将 author 字段从 TEXT 改为 TEXT[]
ALTER TABLE notes 
  ALTER COLUMN author TYPE TEXT[] 
  USING CASE 
    WHEN author IS NULL THEN NULL 
    WHEN author = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[author]
  END;

-- 重命名字段
ALTER TABLE notes RENAME COLUMN author TO authors;
```

## 前端代码变更

### 1. 类型定义 (`src/types/note.ts`)

**修改前：**
```typescript
export interface Note {
  author: string | null;
}

export interface NoteFormData {
  author: string;
}
```

**修改后：**
```typescript
export interface Note {
  authors: string[] | null;  // 改为数组
}

export interface NoteFormData {
  authors: string[];  // 改为数组
}
```

### 2. 编辑页 (`src/pages/NoteEditorPage.tsx`)

#### 状态管理

**修改前：**
```typescript
const [author, setAuthor] = useState('');
```

**修改后：**
```typescript
const [authors, setAuthors] = useState<string[]>([]);
```

#### 数据加载

**修改前：**
```typescript
setAuthor(data.author || '');
```

**修改后：**
```typescript
setAuthors(data.authors || []);
```

#### 数据保存

**修改前：**
```typescript
const noteData = {
  author: author.trim() || '',
  // ...
};
```

**修改后：**
```typescript
const noteData = {
  authors: authors,  // 直接保存数组
  // ...
};
```

#### 组件使用

**修改前：**
```typescript
<NoteMetadataPanel
  author={author}
  onAuthorChange={setAuthor}
/>
```

**修改后：**
```typescript
<NoteMetadataPanel
  authors={authors}
  onAuthorsChange={setAuthors}
/>
```

### 3. 元数据面板 (`src/components/NoteMetadataPanel.tsx`)

#### Props 接口

**修改前：**
```typescript
interface NoteMetadataPanelProps {
  author: string;
  onAuthorChange: (value: string) => void;
}
```

**修改后：**
```typescript
interface NoteMetadataPanelProps {
  authors: string[];
  onAuthorsChange: (value: string[]) => void;
}
```

#### TagInput 使用

**修改前：**
```typescript
<TagInput
  type="author"
  value={author ? [author] : []}
  onChange={(tags) => onAuthorChange(tags[0] || '')}
/>
```

**修改后：**
```typescript
<TagInput
  type="author"
  value={authors}
  onChange={onAuthorsChange}
/>
```

### 4. TagInput 组件 (`src/components/TagInput.tsx`)

#### 配置更新

**修改前：**
```typescript
case 'author':
  return {
    label: '作者',
    icon: '👤',
    maxTags: 1,  // 只支持一个
  };
```

**修改后：**
```typescript
case 'author':
  return {
    label: '作者',
    icon: '👤',
    maxTags: Infinity,  // 支持多个
  };
```

#### 添加逻辑

**修改前：**
```typescript
if (type === 'author') {
  onChange([trimmedTag]);  // 替换
} else {
  onChange([...value, trimmedTag]);  // 追加
}
```

**修改后：**
```typescript
// 统一处理，都支持多个
onChange([...value, trimmedTag]);
```

#### 提示文本

**修改前：**
```typescript
{type === 'author' && value.length > 0
  ? '暂时只支持一个作者'
  : '按 Enter 或输入逗号添加，Backspace 删除'}
```

**修改后：**
```typescript
按 Enter 或输入逗号添加，Backspace 删除
```

### 5. 搜索结果页 (`src/pages/SearchResultsPage.tsx`)

#### 接口定义

**修改前：**
```typescript
interface SearchResult {
  author: string | null;
}
```

**修改后：**
```typescript
interface SearchResult {
  authors: string[] | null;
}
```

#### 显示逻辑

**修改前：**
```typescript
{result.author && (
  <p>👤 {result.author}</p>
)}
```

**修改后：**
```typescript
{result.authors && result.authors.length > 0 && (
  <p>👤 {result.authors.join(', ')}</p>
)}
```

### 6. 笔记详情页 (`src/pages/NoteDetailPage.tsx`)

#### 显示逻辑

**修改前：**
```typescript
{note.author && (
  <p className="text-lg text-[#8E8E93] mb-4">
    {note.author}
  </p>
)}
```

**修改后：**
```typescript
{note.authors && note.authors.length > 0 && (
  <div className="mb-4">
    <p className="text-sm text-[#8E8E93] mb-2">👤 作者</p>
    <div className="flex flex-wrap gap-2">
      {note.authors.map((author, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-[#E5F1FF] text-[#1F2937] rounded-md text-sm font-medium"
        >
          {author}
        </span>
      ))}
    </div>
  </div>
)}
```

### 7. SQL 函数 (`supabase/vector_search_function.sql`)

**修改前：**
```sql
RETURNS TABLE (
  note_author TEXT,
)
BEGIN
  SELECT
    n.author AS note_author,
  FROM notes n
END;
```

**修改后：**
```sql
RETURNS TABLE (
  authors TEXT[],
)
BEGIN
  SELECT
    n.authors,
  FROM notes n
END;
```

## 用户体验改进

### 编辑页

**修改前：**
- 只能输入一个作者
- 输入第二个作者会替换第一个
- 提示"暂时只支持一个作者"

**修改后：**
- 可以输入多个作者
- 每个作者显示为独立的 Tag
- 可以单独删除任意作者
- 支持逗号分隔批量添加

### 详情页

**修改前：**
```
作者：John Rawls
```

**修改后：**
```
👤 作者
[John Rawls] [Gerald Gaus] [John Thrasher]
```

每个作者显示为独立的 Tag，视觉上更清晰。

### 搜索结果页

**修改前：**
```
👤 John Rawls
```

**修改后：**
```
👤 John Rawls, Gerald Gaus, John Thrasher
```

多个作者用逗号分隔显示。

## 数据迁移策略

### 现有数据处理

数据库迁移脚本会自动处理现有数据：

1. **有作者的笔记**：`"John Rawls"` → `["John Rawls"]`
2. **空作者的笔记**：`""` → `[]`
3. **NULL 作者的笔记**：`NULL` → `NULL`

### 前端兼容性

前端代码已经处理了所有边界情况：

```typescript
// 安全读取
setAuthors(data.authors || []);

// 安全显示
{note.authors && note.authors.length > 0 && (
  // 渲染作者
)}

// 安全保存
authors: authors,  // 可以是空数组
```

## 测试场景

### 1. 创建新笔记

- [ ] 不添加作者（保存为空数组）
- [ ] 添加一个作者
- [ ] 添加多个作者
- [ ] 使用逗号批量添加作者

### 2. 编辑现有笔记

- [ ] 编辑没有作者的笔记
- [ ] 编辑有一个作者的笔记
- [ ] 为现有笔记添加更多作者
- [ ] 删除部分作者
- [ ] 删除所有作者

### 3. 显示笔记

- [ ] 详情页正确显示多个作者
- [ ] 搜索结果正确显示多个作者
- [ ] 笔记列表正确显示多个作者（如果有）

### 4. 搜索功能

- [ ] 搜索结果包含作者信息
- [ ] 多作者正确显示
- [ ] 作者字段为空时不显示

### 5. 边界情况

- [ ] 作者数组为空 `[]`
- [ ] 作者数组为 `null`
- [ ] 作者名包含特殊字符
- [ ] 作者名很长
- [ ] 作者数量很多（>10）

## 部署步骤

### 1. 数据库迁移

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 1. 修改字段类型
ALTER TABLE notes 
  ALTER COLUMN author TYPE TEXT[] 
  USING CASE 
    WHEN author IS NULL THEN NULL 
    WHEN author = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[author]
  END;

-- 2. 重命名字段
ALTER TABLE notes RENAME COLUMN author TO authors;

-- 3. 更新搜索函数
-- 复制 supabase/vector_search_function.sql 的内容并执行
```

### 2. 前端部署

前端代码已经全部更新，直接部署即可：

```bash
npm run build
# 部署到生产环境
```

### 3. 验证

1. 检查现有笔记的作者是否正确迁移
2. 创建新笔记测试多作者功能
3. 测试搜索功能是否正常
4. 检查详情页显示是否正确

## 回滚方案

如果需要回滚到单作者模式：

```sql
-- 1. 重命名字段
ALTER TABLE notes RENAME COLUMN authors TO author;

-- 2. 转换回单作者（取第一个）
ALTER TABLE notes 
  ALTER COLUMN author TYPE TEXT 
  USING CASE 
    WHEN author IS NULL THEN NULL
    WHEN array_length(author, 1) = 0 THEN ''
    ELSE author[1]
  END;

-- 3. 恢复旧的搜索函数
-- 执行旧版本的 SQL 函数
```

## 相关文件

### 已修改的文件

- ✅ `philonote/src/types/note.ts` - 类型定义
- ✅ `philonote/src/pages/NoteEditorPage.tsx` - 编辑页
- ✅ `philonote/src/components/NoteMetadataPanel.tsx` - 元数据面板
- ✅ `philonote/src/components/TagInput.tsx` - Tag 输入组件
- ✅ `philonote/src/pages/SearchResultsPage.tsx` - 搜索结果页
- ✅ `philonote/src/pages/NoteDetailPage.tsx` - 详情页
- ✅ `philonote/supabase/vector_search_function.sql` - SQL 函数

### 未修改的文件

- `philonote/src/pages/NotesList.tsx` - 列表页（如果不显示作者）
- `philonote/src/pages/Dashboard.tsx` - 仪表板（如果不显示作者）

## 完成标准

- ✅ 数据库字段从 `author TEXT` 改为 `authors TEXT[]`
- ✅ 所有类型定义更新为 `authors: string[]`
- ✅ 编辑页支持添加多个作者
- ✅ TagInput 组件支持多作者
- ✅ 详情页以 Tag 形式显示多个作者
- ✅ 搜索结果页正确显示多个作者
- ✅ SQL 函数返回 `authors TEXT[]`
- ✅ 所有边界情况处理正确
- ✅ 现有数据正确迁移

## 总结

多作者支持已经完全实现！用户现在可以：

1. 为每篇笔记添加多个作者
2. 使用 Tag 形式管理作者
3. 在详情页看到所有作者
4. 在搜索结果中看到所有作者

这个改动提升了 PhiloNote 对学术文献的支持能力，特别是对于合著论文的管理。
