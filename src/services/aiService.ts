/**
 * AI Service 抽象层
 * 封装智谱 AI 的 API 调用
 */

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const EMBEDDING_MODEL = 'embedding-2';

/**
 * 生成文本向量
 * @param text 要生成向量的文本
 * @returns 1024 维向量数组
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
    console.log('🔄 调用智谱 API 生成向量...');
    console.log('📝 文本长度:', text.length);

    // 限制文本长度，避免超过 API 限制
    const truncatedText = text.substring(0, 2000);
    if (text.length > 2000) {
      console.log('⚠️ 文本已截断至 2000 字符');
    }

    const response = await fetch(`${ZHIPU_API_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ 智谱 API 错误:', errorData);
      throw new Error(
        `智谱 API 调用失败: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('❌ 智谱 API 返回数据格式错误:', data);
      throw new Error('智谱 API 返回数据格式错误');
    }

    const embedding = data.data[0].embedding;

    // 验证向量维度（智谱 embedding-2 模型返回 1024 维）
    if (embedding.length !== 1024) {
      console.error('❌ 向量维度错误! 期望: 1024, 实际:', embedding.length);
      throw new Error(`向量维度应该是 1024，实际是 ${embedding.length}`);
    }

    console.log('✅ 智谱 API 调用成功');
    console.log('📊 向量维度: 1024 ✅');

    return embedding;
  } catch (error) {
    console.error('❌ 生成向量失败:', error);
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
