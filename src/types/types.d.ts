// src/types.d.ts
// Arquivo de declaração de tipos para resolver problemas de importação

declare module '@anthropic-ai/sdk' {
  export class Anthropic {
    constructor(options: { apiKey: string });
    messages: {
      create(params: any): Promise<any>;
    };
  }
}

declare module 'openai' {
  export default class OpenAI {
    constructor(options: { apiKey: string; baseURL?: string });
    chat: {
      completions: {
        create(params: any): Promise<any>;
      };
    };
  }
}