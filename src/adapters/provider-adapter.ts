// src/provider-adapter.ts
// Interface para mensagens de chat
export interface ChatMessage {
  role: string;
  content: string;
}

// Interfaces base para adaptadores de providers
export interface ProviderAdapter {
  sendMessage(params: SendMessageParams): Promise<SendMessageResponse>;
  sendStructuredMessage(params: SendStructuredMessageParams): Promise<any>;
  supportsTools(): boolean;
  supportsStreaming(): boolean;
}

// Tipos de providers suportados
export type ProviderType = 
  | 'openai-gpt-4o'
  | 'openai-gpt-4o-mini'
  | 'openai-generic'
  | 'anthropic-sonnet'
  | 'anthropic-haiku';

// Parâmetros para envio de mensagens
export interface SendMessageParams {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Resposta de envio de mensagens
export interface SendMessageResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Parâmetros para mensagens estruturadas
export interface SendStructuredMessageParams {
  message: string;
  schema: any;
  temperature?: number;
  maxTokens?: number;
}

// Definição de tool
export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: any;
}

// Interface para tools
export interface Tool {
  name: string;
  description: string;
  parameters?: any;
  execute: (args: any) => Promise<any>;
}