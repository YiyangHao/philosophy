# PhiloNote 快速启动指南

## ✅ 已完成的功能

1. **笔记列表页** - 显示所有笔记
2. **Notion 风格编辑页** - 带 BlockNote 编辑器
3. **笔记详情页** - Markdown 渲染

## 🚀 快速启动

### 1. 确保环境配置正确

检查 `.env` 文件：
```env
VITE_SUPABASE_URL=https://uplhybammnxmxznqgntx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_qsqu7zJ5uW84xfW05sHfog_0LRevEJm
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器：http://localhost:5173

## 📝 测试流程

1. **查看列表页**
   - 访问 http://localhost:5173
   - 应该看到笔记列表（或空状态）

2. **创建新笔记**
   - 点击右上角"新建笔记"按钮
   - 输入标题（大号输入框）
   - 展开元数据面板，填写信息
   - 在 BlockNote 编辑器中输入内容
   - 点击"保存"

3. **查看详情**
   - 自动跳转到详情页
   - 查看 Markdown 渲染效果

4. **编辑笔记**
   - 点击"编辑"按钮
   - 修改内容
   - 保存

5. **删除笔记**
   - 点击"删除"按钮
   - 确认删除

## 🎨 UI 特点

- **Notion 风格**：大号标题输入框，无边框设计
- **BlockNote 编辑器**：支持 Markdown 和斜杠命令
- **元数据面板**：可折叠，包含作者、出版物、年份、关键词
- **响应式设计**：适配桌面和平板

## 🔧 技术栈

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase（数据库）
- BlockNote（编辑器）
- react-markdown（渲染）

## ❓ 常见问题

### Q: 页面空白？
A: 检查浏览器控制台是否有错误，确认 Supabase 连接正常

### Q: 编辑器不显示？
A: 确保 BlockNote 的 CSS 已正确导入

### Q: 保存失败？
A: 检查 Supabase 的 notes 表是否存在且结构正确

## 📞 需要帮助？

查看详细文档：`NOTION_STYLE_NOTES.md`
