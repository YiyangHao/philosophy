# PhiloNote - Notion 风格笔记系统

## ✅ 已完成功能

### 1. 笔记列表页 (`/notes`)
- ✅ 显示所有笔记的卡片列表
- ✅ 按创建时间倒序排列
- ✅ 卡片 Hover 效果（上浮 + 阴影）
- ✅ 右上角"新建笔记"按钮
- ✅ 空状态提示
- ✅ 加载和错误状态处理

### 2. Notion 风格编辑页 (`/notes/new` 和 `/notes/:id/edit`)
- ✅ 大号标题输入框（无边框，2rem 字号）
- ✅ 可折叠的元数据面板
  - 作者
  - 出版物
  - 年份
  - 关键词（支持添加/删除，显示为 Badge）
- ✅ BlockNote 编辑器集成
  - 支持 Markdown 快捷键
  - 支持 / 斜杠命令
  - 最小高度 400px
- ✅ 保存功能（新建/更新）
- ✅ 删除功能（带二次确认）
- ✅ 返回按钮

### 3. 笔记详情页 (`/notes/:id`)
- ✅ 显示标题和元数据
- ✅ 关键词显示为彩色标签
- ✅ Markdown 内容渲染
- ✅ 编辑按钮
- ✅ 删除按钮（带二次确认）
- ✅ 显示创建和更新时间

## 🎨 UI 设计

### 色彩系统
- 主色：`#007AFF` (Apple Blue)
- 背景：`#FAFAFA`
- 卡片背景：`#FFFFFF`
- 边框：`#E5E5E5`
- 主标题：`#1C1C1E`
- 次要文字：`#8E8E93`

### 组件使用
- ✅ shadcn/ui Button
- ✅ shadcn/ui Input
- ✅ shadcn/ui Card
- ✅ shadcn/ui Badge
- ✅ BlockNote 编辑器
- ✅ react-markdown

## 📦 已安装的依赖

```bash
@blocknote/core
@blocknote/react
react-markdown
sonner (Toast 通知)
```

## 🚀 使用方法

### 1. 确保数据库配置正确

检查 `.env` 文件：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 启动开发服务器

```bash
cd philonote
npm run dev
```

### 3. 访问应用

打开浏览器访问：http://localhost:5173

## 📝 功能测试清单

- [ ] 访问首页，看到笔记列表（或空状态）
- [ ] 点击"新建笔记"按钮
- [ ] 输入标题（大号输入框）
- [ ] 展开/折叠元数据面板
- [ ] 填写作者、出版物、年份
- [ ] 添加关键词（按回车或点击"添加"）
- [ ] 在 BlockNote 编辑器中输入内容
  - 尝试 Markdown 快捷键（# 标题，**粗体**）
  - 尝试 / 斜杠命令
- [ ] 点击"保存"按钮
- [ ] 自动跳转到详情页
- [ ] 查看 Markdown 渲染效果
- [ ] 点击"编辑"按钮，修改笔记
- [ ] 保存修改
- [ ] 点击"删除"按钮，确认删除
- [ ] 返回列表页，确认笔记已删除

## 🔧 技术实现细节

### BlockNote 编辑器

```typescript
import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/react/style.css';

const editor = useCreateBlockNote();

// 保存时获取 Markdown
const markdown = await editor.blocksToMarkdownLossy(editor.document);

// 加载时解析 Markdown
const blocks = await editor.tryParseMarkdownToBlocks(markdown);
editor.replaceBlocks(editor.document, blocks);
```

### Supabase 数据库操作

```typescript
// 查询所有笔记
const { data } = await supabase
  .from('notes')
  .select('*')
  .order('created_at', { ascending: false });

// 创建笔记
const { data } = await supabase
  .from('notes')
  .insert({ title, author, content, ... })
  .select()
  .single();

// 更新笔记
await supabase
  .from('notes')
  .update({ title, content, updated_at: new Date().toISOString() })
  .eq('id', noteId);

// 删除笔记
await supabase
  .from('notes')
  .delete()
  .eq('id', noteId);
```

## 📂 文件结构

```
src/
├── components/
│   ├── NoteCard.tsx              # 笔记卡片组件
│   ├── NoteMetadataPanel.tsx     # 元数据面板组件
│   └── ui/                       # shadcn/ui 组件
├── pages/
│   ├── NotesListPage.tsx         # 笔记列表页
│   ├── NoteDetailPage.tsx        # 笔记详情页
│   └── NoteEditorPage.tsx        # 笔记编辑页
├── lib/
│   └── supabase.ts               # Supabase 客户端
├── types/
│   └── note.ts                   # 笔记类型定义
└── App.tsx                       # 路由配置
```

## 🚨 重要提示

1. **无登录系统**：所有笔记对所有人可见
2. **无 user_id**：notes 表不包含 user_id 字段
3. **删除确认**：删除操作使用 `confirm()` 进行二次确认
4. **Markdown 支持**：编辑器支持完整的 Markdown 语法
5. **自动保存**：需要手动点击"保存"按钮

## 🎯 下一步计划

- [ ] 添加搜索功能
- [ ] 添加标签过滤
- [ ] 添加排序选项
- [ ] 集成 AI 功能（向量搜索）
- [ ] 添加导出功能（PDF/Markdown）

## ❓ 常见问题

### Q: BlockNote 编辑器不显示？
A: 确保已正确导入 CSS：
```typescript
import '@blocknote/core/fonts/inter.css';
import '@blocknote/react/style.css';
```

### Q: Markdown 渲染样式不对？
A: 添加 Tailwind Typography 插件：
```bash
npm install @tailwindcss/typography
```

### Q: 保存后内容丢失？
A: 检查 Supabase 连接和 notes 表结构是否正确。

## 📞 需要帮助？

如果遇到问题，请检查：
1. Supabase 连接是否正常
2. notes 表是否存在且结构正确
3. 浏览器控制台是否有错误信息
4. 网络请求是否成功
