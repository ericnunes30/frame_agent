import { ChatMessage, ProviderAdapter } from '../adapters/provider-adapter';
import { Tool } from '../adapters/provider-adapter';

export class AdaptiveExecutor {
  /**
   * Executa a lógica adaptativa baseada no estado detectado
   */
  async executeAdaptive(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[],
    state: 'chat' | 'react'
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    if (state === 'react') {
      // Execução ReAct: parsing e execução de ações
      return await this.executeReact(adapter, messages, tools);
    } else {
      // Execução conversacional normal
      return await this.executeChat(adapter, messages, tools);
    }
  }

  /**
   * Executa no modo conversacional
   */
  private async executeChat(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[]
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    // No modo chat, ainda precisamos verificar se a resposta contém
    // comandos ReAct que precisam ser detectados
    const response = await adapter.callProviderFunction({
      messages,
      stream: false
    });

    // Verificar se a resposta contém estrutura ReAct
    if (this.containsReActStructure(response)) {
      // A IA decidiu iniciar modo ReAct, então mudamos o estado
      return { response, newState: 'react' };
    }

    return { response, newState: 'chat' };
  }

  /**
   * Executa no modo ReAct com parsing e execução de ações
   */
  private async executeReact(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[]
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    // Chama o provedor para obter resposta formatada ReAct
    const response = await adapter.callProviderFunction({
      messages,
      stream: false
    });

    // Verificar se a resposta contém estrutura ReAct (Thought/Action/Observation)
    if (this.containsReActStructure(response)) {
      const { thought, action, actionInput } = this.parseReActResponse(response);
      
      if (action && actionInput) {
        // Executar a ação usando as ferramentas
        const toolResult = await this.executeTool(action, actionInput, tools);
        
        // Retornar resposta com nova mensagem de observação
        return { 
          response: response + `\nObservation: ${JSON.stringify(toolResult)}`, 
          newState: 'react' 
        };
      } else if (this.containsFinalAnswer(response)) {
        // Detecta final_answer e retorna para modo chat
        return { response, newState: 'chat' };
      }
    }

    // Se não contém estrutura ReAct ou é final_answer, retornar para chat
    return { response, newState: 'chat' };
  }

  /**
   * Verifica se a resposta contém estrutura ReAct
   */
  private containsReActStructure(response: string): boolean {
    return response.includes('Thought:') && 
           (response.includes('Action:') || response.includes('Action Input:'));
  }

  /**
   * Verifica se a resposta contém final_answer
   */
  private containsFinalAnswer(response: string): boolean {
    return response.includes('Action: final_answer') || 
           (response.includes('final_answer') && response.includes('Action Input:'));
  }

  /**
   * Faz o parsing da resposta ReAct em componentes
   */
  private parseReActResponse(response: string): { 
    thought: string | null; 
    action: string | null; 
    actionInput: any | null 
  } {
    const thoughtMatch = response.match(/Thought:([\s\S]*?)(?=Action:|Action Input:|$)/);
    const actionMatch = response.match(/Action:([^\n\r]*)/);
    const actionInputMatch = response.match(/Action Input:([\s\S]*)/);

    return {
      thought: thoughtMatch ? thoughtMatch[1].trim() : null,
      action: actionMatch ? actionMatch[1].trim() : null,
      actionInput: actionInputMatch ? this.parseJsonSafely(actionInputMatch[1].trim()) : null
    };
  }

  /**
   * Executa uma ferramenta específica
   */
  private async executeTool(
    action: string,
    actionInput: any,
    tools: Tool[]
  ): Promise<any> {
    const tool = tools.find(t => t.name === action);
    
    if (!tool) {
      throw new Error(`Tool ${action} not found`);
    }

    try {
      // Executar a ferramenta com os parâmetros fornecidos
      return await tool.execute(actionInput);
    } catch (error) {
      console.error(`Error executing tool ${action}:`, error);
      return { error: `Failed to execute ${action}`, details: error.message };
    }
  }

  /**
   * Faz parsing de JSON de forma segura
   */
  private parseJsonSafely(jsonStr: string): any {
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      // Se o parsing normal falhar, tenta corrigir e tentar novamente
      try {
        // Remover ```json e ``` do início e fim se existirem
        let cleanStr = jsonStr.replace(/```json\n?/, '').replace(/```/, '').trim();
        return JSON.parse(cleanStr);
      } catch (error2) {
        console.error('Failed to parse JSON:', error2);
        return null;
      }
    }
  }
}