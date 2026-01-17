import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new AnthropicProvider('test-api-key');
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with correct name', () => {
      expect(provider.name).toBe('anthropic');
    });

    it('should store API key', () => {
      const testProvider = new AnthropicProvider('my-secret-key');
      expect(testProvider).toBeDefined();
    });
  });

  describe('generateText', () => {
    it('should make correct API call with default options', async () => {
      const mockResponse = {
        content: [
          {
            text: 'Generated response',
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.generateText('Test prompt');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          },
        })
      );

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: undefined,
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      expect(result).toBe('Generated response');
    });

    it('should pass custom temperature option', async () => {
      const mockResponse = {
        content: [{ text: 'Response' }],
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
        content: [{ text: 'Response' }],
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
        content: [{ text: 'Response' }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', { model: 'claude-3-opus-20240229' });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.model).toBe('claude-3-opus-20240229');
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = {
        content: [{ text: 'Response' }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', {
        systemPrompt: 'You are a helpful assistant',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are a helpful assistant');
      expect(callBody.messages).toEqual([
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
        'Anthropic API error: 400 Bad Request'
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'Anthropic API error: 401 Unauthorized'
      );
    });

    it('should handle 5xx server errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'Anthropic API error: 500 Internal Server Error'
      );
    });

    it('should handle 503 service unavailable errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(provider.generateText('Test prompt')).rejects.toThrow(
        'Anthropic API error: 503 Service Unavailable'
      );
    });

    it('should return empty string if no content in response', async () => {
      const mockResponse = {
        content: [{}],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.generateText('Test prompt');
      expect(result).toBe('');
    });

    it('should return empty string if content array is empty', async () => {
      const mockResponse = {
        content: [],
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
        content: [{ text: 'Response' }],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateText('Test prompt', {
        temperature: 0.5,
        maxTokens: 500,
        model: 'claude-3-opus-20240229',
        systemPrompt: 'Be concise',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        temperature: 0.5,
        system: 'Be concise',
        messages: [
          { role: 'user', content: 'Test prompt' },
        ],
      });
    });
  });

  describe('generateStream', () => {
    it('should stream text chunks correctly', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n',
        'data: {"type":"content_block_delta","delta":{"text":" world"}}\n',
        'data: {"type":"message_stop"}\n',
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
          controller.enqueue(encoder.encode('data: {"type":"message_stop"}\n'));
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
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
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
          controller.enqueue(encoder.encode('data: {"type":"message_stop"}\n'));
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
        model: 'claude-3-opus-20240229',
        systemPrompt: 'Be creative',
      });

      // Consume the generator
      for await (const _ of generator) {
        // Just consume
      }

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody).toEqual({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.8,
        system: 'Be creative',
        messages: [
          { role: 'user', content: 'Test prompt' },
        ],
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
        'Anthropic API error: 429 Too Many Requests'
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
        'data: {"type":"content_block_delta","delta":{"text":"Valid"}}\n',
        'data: invalid json\n',
        'data: {"type":"content_block_delta","delta":{"text":" chunk"}}\n',
        'data: {"type":"message_stop"}\n',
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

    it('should handle chunks without text content', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","delta":{}}\n',
        'data: {"type":"content_block_delta","delta":{"text":"Text"}}\n',
        'data: {"type":"message_stop"}\n',
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

      // Should only yield chunks with text content
      expect(chunks).toEqual(['Text']);
    });

    it('should only yield content_block_delta events', async () => {
      const mockStreamData = [
        'data: {"type":"message_start"}\n',
        'data: {"type":"content_block_start"}\n',
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n',
        'data: {"type":"content_block_stop"}\n',
        'data: {"type":"message_stop"}\n',
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

      // Should only yield content_block_delta events with text
      expect(chunks).toEqual(['Hello']);
    });

    it('should handle multi-line buffering correctly', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","delta":{"text":"First"}}\ndata: {"type":"content_block_delta","delta":{"text":"Second"}}\n',
        'data: {"type":"content_block_delta","delta":{"text":"Third"}}\n',
        'data: {"type":"message_stop"}\n',
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

    it('should handle empty stream gracefully', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
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

      expect(chunks).toEqual([]);
    });

    it('should handle lines without data prefix', async () => {
      const mockStreamData = [
        'data: {"type":"content_block_delta","delta":{"text":"Valid"}}\n',
        'event: ping\n',
        'data: {"type":"content_block_delta","delta":{"text":"Also valid"}}\n',
        'data: {"type":"message_stop"}\n',
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

      // Should only process lines with 'data:' prefix
      expect(chunks).toEqual(['Valid', 'Also valid']);
    });
  });
});
