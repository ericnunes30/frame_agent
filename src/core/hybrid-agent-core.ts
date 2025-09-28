import { ProviderAdapter, ChatMessage, Tool } from '../adapters/provider-adapter';
import { HybridPromptBuilder } from './hybrid-prompt-builder';
import { ToolDetectionEngine } from './tool-detection-engine';
import { AdaptiveExecutor } from './adaptive-executor';

/**
 * Agente híbrido adaptativo que combina conversação fluida com execução estruturada de ações
 * Operando com um único modelo que se adapta dinamicamente baseado na necessidade
 */
export class HybridAgent {
  private provider: ProviderAdapter;
  private toolRegistry: Map<string, Tool>;
  private history: ChatMessage[];
  private hybridState: 'chat' | 'react';
  
  // Componentes para o modelo híbrido
  private hybridPromptBuilder: HybridPromptBuilder;
  private toolDetectionEngine: ToolDetectionEngine;
  private adaptiveExecutor: AdaptiveExecutor;

  constructor(provider: ProviderAdapter) {
    this.provider = provider;
    this.toolRegistry = new Map();
    this.history = [];
    this.hybridState = 'chat';
    
    // Inicializar componentes do modelo híbrido
    this.hybridPromptBuilder = new HybridPromptBuilder();
    this.toolDetectionEngine = new ToolDetectionEngine();
    this.adaptiveExecutor = new AdaptiveExecutor();
  }

  /**
   * Registra uma ferramenta no agente
   */
  registerTool(tool: Tool): void {
    this.toolRegistry.set(tool.name, tool);
  }

  /**
   * Envia uma mensagem e recebe resposta adaptativa
   */
  async sendMessage(message: string, options: { stream?: boolean } = {}): Promise<any> {
    // Adiciona a mensagem do usuário ao histórico
    this.history.push({ role: 'user', content: message });
    
    // Detecta se é necessário transicionar para modo ReAct
    const tools = Array.from(this.toolRegistry.values());
    const transitionState = this.toolDetectionEngine.detectTransitionState(
      message, 
      tools, 
      this.history
    );
    
    // Atualiza o estado conforme necessário
    if (transitionState === 'enter-react') {
      this.hybridState = 'react';
    }

    // Constroi o prompt híbrido com base no estado atual
    const toolsDescription = this.buildToolsDescription(tools);
    const prompt = this.hybridPromptBuilder.buildHybridPrompt(
      message,
      toolsDescription,
      this.hybridState,
      this.history
    );

    // Cria mensagem do sistema com o prompt híbrido
    const systemMessage: ChatMessage = { role: 'system', content: prompt };
    
    // Prepara as mensagens para o provedor
    // No modelo híbrido, usamos o prompt completo como mensagem do sistema
    const messagesForProvider: ChatMessage[] = [
      systemMessage,
      { role: 'user', content: message }
    ];
    
    // Executa usando o executor adaptativo
    const result = await this.adaptiveExecutor.executeAdaptive(
      this.provider,
      messagesForProvider,
      tools,
      this.hybridState
    );

    // Atualiza o estado híbrido com base no resultado
    this.hybridState = result.newState;
    
    // Adiciona a resposta do assistente ao histórico
    this.history.push({ role: 'assistant', content: result.response });

    // Retorna a resposta
    return result.response;
  }

  /**
   * Constrói descrição das ferramentas para inclusão no prompt
   */
  private buildToolsDescription(tools: Tool[]): string {
    if (tools.length === 0) {
      return "No tools available.";
    }

    return tools.map(tool => 
      `${tool.name}: ${tool.description}${tool.parameters ? 
        ` Parameters: ${JSON.stringify(tool.parameters)}` : ''}`
    ).join('\n');
  }

  /**
   * Limpa o histórico do agente
   */
  clearHistory(): void {
    this.history = [];
    this.hybridState = 'chat';
  }

  /**
   * Obtém o histórico de mensagens
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Define o estado híbrido explicitamente (para controle fino)
   */
  setHybridState(state: 'chat' | 'react'): void {
    this.hybridState = state;
  }

  /**
   * Obtém o estado híbrido atual
   */
  getHybridState(): 'chat' | 'react' {
    return this.hybridState;
  }
}