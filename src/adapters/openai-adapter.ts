// src/openai-adapter.ts
import { ProviderAdapter, SendMessageParams, SendMessageResponse, SendStructuredMessageParams } from './provider-adapter';
// @ts-ignore
import OpenAI from 'openai';

export class OpenAIAdapter implements ProviderAdapter {
  private client: OpenAI;
  private model: string;

  constructor(model: string, apiKey?: string, baseURL?: string) {
    this.model = model;
    // @ts-ignore - Ignorar erro de tipo temporariamente
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'MISSING_API_KEY',
      baseURL: baseURL || process.env.OPENAI_BASE_URL
    });
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      // Converter mensagens para o formato esperado pela API do OpenAI
      const openaiMessages = params.messages.map(msg => ({
        role: msg.role as any,
        content: msg.content
      }));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        presence_penalty: params.presencePenalty,
        frequency_penalty: params.frequencyPenalty
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem para OpenAI: ${error}`);
    }
  }

  async sendStructuredMessage(params: SendStructuredMessageParams): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: params.message }],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem estruturada para OpenAI: ${error}`);
    }
  }

  supportsTools(): boolean {
    return true;
  }

  supportsStreaming(): boolean {
    return true;
  }

  private mapToolsToOpenAIFormat(tools: any[]): any[] {
    return tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
}