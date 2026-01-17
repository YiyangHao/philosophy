import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new OpenAIProvider('test-api-key');
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with correct name', () => {
      expect(provider.name).toBe('openai');
    });

    it('should store API key', () => {
      const testProvider = new OpenAIProvider('my-secret-key');
      expect(testProvider).toBeDefined();
    });
  });

  describe('generateText', () => {
    it('should make correct API call with default options', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated response',
            },
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.generateText('Test prompt');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      expect(result).toBe('Generated response');
    });

    it('should pass custom temperature option', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', { temperature: 0.9 });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.9);
    });

    it('should pass custom maxTokens option', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', { maxTokens: 2000 });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.max_tokens).toBe(2000);
    });

    it('should pass custom model option', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', { model: 'gpt-3.5-turbo' });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.model).toBe('gpt-3.5-turbo');
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', {
        systemPrompt: 'You are a helpful assistant',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Test prompt' },
      ]);
    });

    it('should handle 4xx client errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'OpenAI API error: 400 Bad Request'
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'OpenAI API error: 401 Unauthorized'
      );
    });

    it('should handle 5xx server errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'OpenAI API error: 500 Internal Server Error'
      );
    });

    it('should handle 503 service unavailable errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'OpenAI API error: 503 Service Unavailable'
      );
    });

    it('should return empty string if no content in response', async () => {
      const mockResponse = {
        choices: [{ message: {} }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.generateText('Test prompt');
      expect(result).toBe('');
    });

    it('should return empty string if choices array is empty', async () => {
      const mockResponse = {
        choices: [],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.generateText('Test prompt');
      expect(result).toBe('');
    });

    it('should pass all options together', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', {
        temperature: 0.5,
        maxTokens: 500,
        model: 'gpt-3.5-turbo',
        systemPrompt: 'Be concise',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Be concise' },
          { role: 'user', content: 'Test prompt' },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });
    });
  });

  describe('generateStream', () => {
    it('should stream text chunks correctly', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        'data: [DONE]\n',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should make correct API call with stream enabled', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n'));
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const generator = provider.generateStream('Test prompt');
      // Consume the generator
      for await (const _ of generator) {
        // Just consume
      }

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.stream).toBe(true);
    });

    it('should pass options to streaming request', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n'));
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const generator = provider.generateStream('Test prompt', {
        temperature: 0.8,
        maxTokens: 1500,
        model: 'gpt-4-turbo',
        systemPrompt: 'Be creative',
      });

      // Consume the generator
      for await (const _ of generator) {
        // Just consume
      }

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'Be creative' },
          { role: 'user', content: 'Test prompt' },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        stream: true,
      });
    });

    it('should handle API errors in streaming', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const generator = provider.generateStream('Test prompt');

      await expect(generator.next()).rejects.toThrow(
        'OpenAI API error: 429 Too Many Requests'
      );
    });

    it('should throw error if no response body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        body: null,
      });

      const generator = provider.generateStream('Test prompt');

      await expect(generator.next()).rejects.toThrow('No response body');
    });

    it('should skip invalid JSON in stream', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Valid"}}]}\n',
        'data: invalid json\n',
        'data: {"choices":[{"delta":{"content":" chunk"}}]}\n',
        'data: [DONE]\n',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test prompt')) {
        chunks.push(chunk);
      }

      // Should only get valid chunks, invalid JSON is skipped
      expect(chunks).toEqual(['Valid', ' chunk']);
    });

    it('should handle chunks without content', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{}}]}\n',
        'data: {"choices":[{"delta":{"content":"Text"}}]}\n',
        'data: [DONE]\n',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test prompt')) {
        chunks.push(chunk);
      }

      // Should only yield chunks with content
      expect(chunks).toEqual(['Text']);
    });

    it('should handle multi-line buffering correctly', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"First"}}]}\ndata: {"choices":[{"delta":{"content":"Second"}}]}\n',
        'data: {"choices":[{"delta":{"content":"Third"}}]}\n',
        'data: [DONE]\n',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['First', 'Second', 'Third']);
    });

    it('should stop streaming on [DONE] marker', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Before"}}]}\n',
        'data: [DONE]\n',
        'data: {"choices":[{"delta":{"content":"After"}}]}\n',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk));
          });
          controller.close();
        },
      });

      fetchMock.mockResolvedValue({
        ok: true,
        body: stream,
      });

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test prompt')) {
        chunks.push(chunk);
      }

      // Should only get chunks before [DONE]
      expect(chunks).toEqual(['Before']);
    });
  });
});
