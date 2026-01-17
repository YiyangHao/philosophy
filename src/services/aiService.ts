/**
 * AI Service 抽象层
 * 封装智谱 AI 的 API 调用
 */

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const EMBEDDING_MODEL = 'embedding-2';

/**
 * 生成文本向量
 * @param text 要生成向量的文本
 * @returns 1536 维向量数组
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;

  if (!apiKey) {
    throw new Error('智谱 API Key 未配置，请在 .env 文件中设置 VITE_ZHIPU_API_KEY');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('文本内容不能为空');
  }

  try {
    const response = await fetch(`${ZHIPU_API_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `智谱 API 调用失败: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('智谱 API 返回数据格式错误');
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error('生成向量失败:', error);
    throw error;
  }
}

/**
 * AI 总结（可选功能）
 * @param notes 笔记列表
 * @param query 搜索查询
 * @returns 总结文本
 */
export async function generateSummary(
  notes: Array<{ title: string; content: string }>,
  query: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;

  if (!apiKey) {
    throw new Error('智谱 API Key 未配置');
  }

  try {
    // 构建提示词
    const notesText = notes
      .map((note, index) => `笔记${index + 1}：${note.title}\n${note.content}`)
      .join('\n\n');

    const prompt = `基于以下笔记内容，回答问题："${query}"\n\n${notesText}\n\n请提供简洁的总结：`;

    const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`智谱 API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('生成总结失败:', error);
    throw error;
  }
}
