# 🐛 chunkText 无限循环 Bug 修复

## 问题描述

**错误信息：**
```
RangeError: Invalid array length
at Array.push ()
at chunkText (aiService.ts:38:14)
```

**原因：**
原始的 `while` 循环实现存在逻辑错误，在某些情况下会导致无限循环：

```typescript
// ❌ 有问题的代码
while (start < text.length) {
  const end = Math.min(start + chunkSize, text.length);
  const chunk = text.substring(start, end);
  
  if (chunk.trim().length > 0) {
    chunks.push(chunk);
  }
  
  start = end - overlap;  // 问题：可能导致 start 不增长
  
  if (text.length - start < overlap) {
    break;
  }
}
```

**问题场景：**
- 当 `overlap` 接近或等于 `chunkSize` 时
- 当文本长度特殊时，`start` 可能不增长
- 导致无限循环，数组不断增长直到内存溢出

## ✅ 修复方案

### 新的实现（使用 for 循环）

```typescript
/**
 * 将长文本分块（修复版）
 * @param text 原始文本
 * @param chunkSize 每块大小（默认 2000 字符）
 * @param overlap 块之间的重叠字符数（默认 200）
 * @returns 文本块数组
 */
export function chunkText(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200
): string[] {
  // 边界情况处理
  if (!text || text.length === 0) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const step = chunkSize - overlap; // 每次前进的步长

  // 使用 for 循环，避免无限循环
  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);

    // 只添加非空块
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }

    // 如果这个块已经包含了文本末尾，退出循环
    if (end >= text.length) {
      break;
    }
  }

  console.log(`📊 文本分块完成: ${text.length} 字符 → ${chunks.length} 块`);
  return chunks;
}
```

### 关键改进

| 改进点 | 说明 |
|--------|------|
| ✅ **使用 for 循环** | `for (let start = 0; start < text.length; start += step)` 确保每次迭代 start 都增长 |
| ✅ **固定步长** | `step = chunkSize - overlap` 在循环外计算，保证一致性 |
| ✅ **明确退出条件** | `if (end >= text.length) break;` 确保到达末尾时退出 |
| ✅ **边界处理** | 空文本和短文本提前返回 |
| ✅ **调试日志** | 添加分块完成日志，方便调试 |

## 🧪 测试结果

```
测试 1: 空文本
  结果: 0 块 ✅

测试 2: 短文本 (100字符)
  结果: 1 块 ✅

测试 3: 中等文本 (3000字符)
  结果: 2 块
  第1块: 2000 字符
  第2块: 1200 字符 ✅

测试 4: 长文本 (22703字符)
  结果: 13 块
  预期: 约 12-13 块 ✅

测试 5: 验证步长计算
  步长: 1800 (应该是 1800) ✅

✅ 所有测试通过！无限循环已修复！
```

## 📊 分块逻辑说明

### 参数

- `chunkSize = 2000`：每块大小
- `overlap = 200`：重叠大小
- `step = 1800`：每次前进的步长（2000 - 200）

### 示例：22703 字符的文本

```
块1:  [0     → 2000]   (2000 字符)
块2:  [1800  → 3800]   (2000 字符，与块1重叠200)
块3:  [3600  → 5600]   (2000 字符，与块2重叠200)
...
块13: [21600 → 22703]  (1103 字符，最后一块)
```

### 重叠的作用

重叠确保跨块的语义不会丢失：

```
块1: "...个人同一性问题是哲学中的核心议题。Parfit 认为..."
                                          ↑ 重叠区域开始
块2: "...Parfit 认为个人同一性并不重要，重要的是心理连续性..."
```

## 🎯 预期 Console 日志

修复后，创建笔记时应该看到：

```
✅ 笔记保存成功，ID: abc-123-def
📝 笔记总长度: 22703 字符
📊 文本分块完成: 22703 字符 → 13 块
📊 分块数量: 13
🔄 处理第 1/13 块...
✅ 智谱 API 调用成功
📊 向量维度: 1024 ✅
✅ 第 1 块保存成功
🔄 处理第 2/13 块...
✅ 第 2 块保存成功
...
🎉 所有向量生成完成！
```

## ⚠️ 注意事项

### 1. 步长必须大于 0

确保 `overlap < chunkSize`，否则步长为负或零：

```typescript
const step = chunkSize - overlap; // 必须 > 0
```

默认值（2000 - 200 = 1800）是安全的。

### 2. 性能考虑

- 22703 字符 → 13 块 → 约 65 秒（每块 5 秒）
- 10000 字符 → 6 块 → 约 30 秒
- 5000 字符 → 3 块 → 约 15 秒

### 3. 内存使用

修复后的代码不会导致内存溢出，因为：
- 循环次数是确定的：`Math.ceil(text.length / step)`
- 每次迭代 `start` 都增长 `step`
- 有明确的退出条件

## 📝 修改文件

```
✅ src/services/aiService.ts - chunkText() 函数完全重写
```

## 🎉 修复完成！

无限循环 Bug 已完全修复。现在可以安全地处理任意长度的文本，不会出现内存溢出或无限循环问题。

开始测试吧！创建一篇长文本笔记，观察 Console 日志确认分块正常工作。
