// src/anthropic-adapter.ts
import { ProviderAdapter, SendMessageParams, SendMessageResponse, SendStructuredMessageParams } from './provider-adapter';
// @ts-ignore
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicAdapter implements ProviderAdapter {
  private client: any;
  private model: string;

  constructor(model: string, apiKey?: string) {
    this.model = model;
    // @ts-ignore - Ignorar erro de tipo temporariamente
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || ''
    });
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      // Converter mensagens para o formato Anthropic
      const anthropicMessages = this.convertMessagesToAnthropicFormat(params.messages);
      
      // @ts-ignore
      const response: any = await this.client.messages.create({
        model: this.model,
        messages: anthropicMessages,
        temperature: params.temperature,
        max_tokens: params.maxTokens || 1024,
        top_p: params.topP
      });

      // Extrair conteúdo do primeiro bloco de texto
      let content = '';
      if (response.content && response.content.length > 0) {
        const firstBlock: any = response.content[0];
        if (firstBlock.type === 'text') {
          content = JSON.stringify(firstBlock.text || '');
        }
      }

      return {
        content: content,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem para Anthropic: ${error}`);
    }
  }

  async sendStructuredMessage(params: SendStructuredMessageParams): Promise<any> {
    try {
      // Para Anthropic, vamos pedir explicitamente um JSON na mensagem
      const structuredMessage = `${params.message}\n\nResponda apenas com um JSON válido no seguinte formato: ${JSON.stringify(params.schema)}`;
      
      const response = await this.client.messages.create({
        model: this.model,
        messages: [{ role: 'user', content: structuredMessage }],
        temperature: params.temperature,
        max_tokens: params.maxTokens || 1024
      });

      const content = response.content[0]?.text || '{}';
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Erro ao enviar mensagem estruturada para Anthropic: ${error}`);
    }
  }

  supportsTools(): boolean {
    return true;
  }

  supportsStreaming(): boolean {
    return true;
  }

  private convertMessagesToAnthropicFormat(messages: any[]): any[] {
    // Anthropic não suporta system messages diretamente, então vamos convertê-las
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        // Converter role 'tool' para 'user' se necessário
        if (msg.role === 'tool') {
          return { role: 'user', content: msg.content };
        }
        return { role: msg.role, content: msg.content };
      });
  }
}