// src/chat-agent-core.ts
import { b } from '../baml_client';
import type { ChatMessage } from '../baml_client/types';

// Tipos de providers suportados
type ProviderType = 
  | 'openai-gpt-4o'
  | 'openai-gpt-4o-mini'
  | 'openai-generic'
  | 'anthropic-sonnet'
  | 'anthropic-haiku';

// Interface para a configuração do agente
interface AgentConfig {
  name: string;
  instructions: string;
  provider: ProviderType;
  temperature?: number;
}

// Classe para representar nosso agente de chat
class ChatAgent {
  private config: AgentConfig;
  private history: ChatMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // Método para enviar uma mensagem e obter uma resposta
  async sendMessage(message: string): Promise<string> {
    try {
      // Adicionar a mensagem do usuário ao histórico
      this.history.push({ role: 'user', content: message });

      // Chamar a função BAML apropriada com base no provider
      const response: string = await this.callBamlFunction(message);

      // Adicionar a resposta do assistente ao histórico
      this.history.push({ role: 'assistant', content: response });

      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Método privado para chamar a função BAML apropriada
  private async callBamlFunction(message: string): Promise<string> {
    switch (this.config.provider) {
      case 'openai-gpt-4o':
        return await b.ChatWithGPT4o(message);
      case 'openai-gpt-4o-mini':
        return await b.ChatWithGPT4oMini(message);
      case 'openai-generic':
        return await b.ChatWithOpenAIGeneric(message);
      case 'anthropic-sonnet':
        return await b.ChatWithClaudeSonnet(message);
      case 'anthropic-haiku':
        return await b.ChatWithClaudeHaiku(message);
      default:
        // Default para GPT-4o-mini
        return await b.ChatWithGPT4oMini(message);
    }
  }

  // Método para resetar o histórico
  reset() {
    this.history = [];
  }

  // Método para obter o histórico atual
  getHistory(): ChatMessage[] {
    return [...this.history]; // Retorna uma cópia para evitar modificações externas
  }
}

// Função para testar o agente de chat
async function testChatAgent() {
  console.log('Testando agente de chat com escolha dinâmica de provider...');
  
  // Testar com diferentes providers
  const providers: ProviderType[] = [
    'openai-gpt-4o-mini',
    'openai-generic',
    'anthropic-haiku'
  ];
  
  for (const provider of providers) {
    console.log(`\n--- Testando com provider: ${provider} ---`);
    
    const agent = new ChatAgent({
      name: "Assistente",
      instructions: "Você é um assistente útil",
      provider: provider
    });
    
    try {
      const response = await agent.sendMessage('Olá, qual é o seu nome?');
      console.log('Usuário: Olá, qual é o seu nome?');
      console.log('Assistente:', response);
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  }
}

// Executar o teste
testChatAgent().catch(console.error);

export { ChatAgent, type AgentConfig, type ProviderType };