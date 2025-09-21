// src/chat-agent-core.ts
import { b } from '../baml_client';
import type { ChatMessage } from '../baml_client/types';
import type { StructuredResponse } from '../baml_client/types';
import { Tool, ToolRegistry } from './tools';
import { MemoryManager, DynamicWindowMemory } from './memory-manager';

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
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Interface para configuração dinâmica por chamada
interface DynamicConfig {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Classe para representar nosso agente de chat
class ChatAgent {
  private config: AgentConfig;
  private memoryManager: MemoryManager;
  private toolRegistry: ToolRegistry = new ToolRegistry();

  constructor(config: AgentConfig) {
    // Definir OpenAI Generic como provider padrão se nenhum for especificado
    const defaultConfig = {
      provider: 'openai-generic' as ProviderType,
      ...config
    };
    
    this.config = defaultConfig;
    this.memoryManager = new MemoryManager(new DynamicWindowMemory(4096)); // 4096 tokens de limite
  }

  // Método para enviar uma mensagem e obter uma resposta
  async sendMessage(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    try {
      // Adicionar a mensagem do usuário ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });

      // Chamar a função BAML apropriada com base no provider
      const response: string = await this.callBamlFunction(message, dynamicConfig);

      // Adicionar a resposta do assistente ao histórico
      this.memoryManager.addMessage({ role: 'assistant', content: response });

      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Método para enviar uma mensagem e obter uma resposta estruturada
  async sendStructuredMessage(message: string): Promise<StructuredResponse> {
    try {
      // Adicionar a mensagem do usuário ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });

      // Chamar a função BAML para resposta estruturada
      const response: StructuredResponse = await b.GetStructuredResponse(message);

      // Adicionar a resposta do assistente ao histórico
      this.memoryManager.addMessage({ 
        role: 'assistant', 
        content: `${response.answer} (Confiança: ${response.confidence})` 
      });

      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem estruturada:', error);
      throw error;
    }
  }

  // Método privado para chamar a função BAML apropriada
  private async callBamlFunction(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
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
        // Default para OpenAI Generic
        return await b.ChatWithOpenAIGeneric(message);
    }
  }

  // Método para resetar o histórico
  reset() {
    this.memoryManager.clear();
  }

  // Método para obter o histórico atual
  getHistory(): ChatMessage[] {
    return this.memoryManager.getMessages();
  }

  // Métodos para gerenciamento de contexto
  setContextVariable(key: string, value: any): void {
    this.memoryManager.setVariable(key, value);
  }

  getContextVariable(key: string): any {
    return this.memoryManager.getVariable(key);
  }

  getAllContextVariables(): Record<string, any> {
    return this.memoryManager.getAllVariables();
  }

  // Métodos para gerenciamento de configuração
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  setConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Métodos para gerenciamento de tools
  registerTool(tool: Tool): void {
    this.toolRegistry.register(tool);
  }

  unregisterTool(name: string): boolean {
    return this.toolRegistry.unregister(name);
  }

  listTools(): Tool[] {
    return this.toolRegistry.list();
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' não encontrada`);
    }

    try {
      // Validar parâmetros se disponíveis
      if (tool.parameters) {
        this.validateParameters(tool.parameters, args);
      }

      // Executar tool com timeout
      const timeout = 30000; // 30 segundos
      const result = await Promise.race([
        tool.execute(args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na execução da tool')), timeout)
        )
      ]);

      return result;
    } catch (error: any) {
      throw new Error(`Erro ao executar tool '${toolName}': ${error.message}`);
    }
  }

  private validateParameters(schema: any, args: any): void {
    // Implementação de validação de parâmetros
    // Pode usar Zod, Joi, ou validação customizada
    // Por enquanto, vamos deixar como placeholder
    console.log('Validando parâmetros:', schema, args);
  }
}

// Função para testar o agente de chat
async function testChatAgent() {
  console.log('Testando agente de chat com escolha dinâmica de provider...');
  
  // Testar com diferentes providers
  const providers: ProviderType[] = [
    'openai-generic',  // Provider padrão
    'openai-gpt-4o-mini',
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
  
  // Testar com provider padrão (sem especificar provider)
  console.log('\n--- Testando com provider padrão (sem especificar) ---');
  const agentPadrao = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil"
    // Sem especificar provider - deve usar 'openai-generic' como padrão
  });
  
  try {
    const response = await agentPadrao.sendMessage('Olá, qual é o seu nome?');
    console.log('Usuário: Olá, qual é o seu nome?');
    console.log('Assistente:', response);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar o teste
testChatAgent().catch(console.error);

export { ChatAgent, type AgentConfig, type ProviderType };