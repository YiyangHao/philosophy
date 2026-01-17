/**
 * 在文本中高亮显示搜索关键词
 * @param text 原始文本
 * @param searchQuery 搜索关键词
 * @returns 带有高亮标记的 JSX 元素
 */
export function highlightText(text: string, searchQuery: string): JSX.Element {
  if (!text || !searchQuery) {
    return <>{text}</>;
  }

  // 转义特殊字符，避免正则表达式错误
  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 创建不区分大小写的正则表达式
  const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');

  // 分割文本
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        // 检查是否是匹配的关键词（不区分大小写）
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded"
            >
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
