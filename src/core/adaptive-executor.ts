import { ChatMessage, ProviderAdapter } from '../adapters/provider-adapter';
import { Tool } from '../adapters/provider-adapter';
import { debugLog, conditionalLog, infoLog } from '../utils/debug-logger';

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
    debugLog(`AdaptiveExecutor.executeAdaptive`);
    debugLog(`  State: ${state}`);
    debugLog(`  Messages count: ${messages.length}`);
    debugLog(`  Tools count: ${tools.length}`);
    
    if (state === 'react') {
      // Execução ReAct: parsing e execução de ações
      debugLog(`Executing ReAct mode`);
      return await this.executeReact(adapter, messages, tools);
    } else {
      // Execução conversacional normal
      debugLog(`Executing chat mode`);
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
    const responseObj = await adapter.sendMessage({
      messages
    });

    // Verificar se a resposta contém estrutura ReAct
    if (this.containsReActStructure(responseObj.content)) {
      // A IA decidiu iniciar modo ReAct, então mudamos o estado
      return { response: responseObj.content, newState: 'react' };
    }

    return { response: responseObj.content, newState: 'chat' };
  }

  /**
   * Executa no modo ReAct com parsing e execução de ações
   */
  private async executeReact(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[]
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    // Copiar mensagens para não modificar o array original
    let currentMessages = [...messages];
    let iterationCount = 0;
    
    // Armazenar histórico de execução para retorno
    let executionHistory: string[] = [];
    
    // Executar ciclo ReAct completo indefinidamente até receber final_answer
    while (true) {
      debugLog(`Iteração ReAct ${iterationCount + 1}`);
      
      // Chama o provedor para obter resposta formatada ReAct
      const responseObj = await adapter.sendMessage({
        messages: currentMessages
      });

      debugLog(`Resposta LLM: ${responseObj.content.substring(0, 200)}...}`);

      // Armazenar resposta para histórico de execução
      executionHistory.push(responseObj.content);
      
      // Verificar se a resposta contém estrutura ReAct (Thought/Action/Observation)
      if (this.containsReActStructure(responseObj.content)) {
        const { thought, action, actionInput } = this.parseReActResponse(responseObj.content);
        
        debugLog(`Estrutura ReAct detectada:`);
        debugLog(`  Thought: ${thought ? thought.substring(0, 100) + '...' : 'null'}`);
        debugLog(`  Action: ${action}`);
        debugLog(`  Action Input: ${actionInput ? JSON.stringify(actionInput).substring(0, 100) + '...' : 'null'}`);
        
        // Exibir pensamento se houver
        if (thought) {
          conditionalLog(`[Pensamento] ${thought}`);
        }
        
        if (action && actionInput) {
          // Verificar se é final_answer
          if (this.containsFinalAnswer(responseObj.content)) {
            debugLog(`Final answer detectada, encerrando ciclo`);
            // Detecta final_answer e retorna resposta final
            return { response: responseObj.content, newState: 'chat' };
          }
          
          // Executar ação usando as ferramentas
          infoLog(`=== TOOL EXECUTION ===`);
          infoLog(`Tool: ${action}`);
          infoLog(`${JSON.stringify(actionInput, null, 2)}`);
          infoLog(`====================`);
          
          const toolResult = await this.executeTool(action, actionInput, tools);
          
          infoLog(`=== TOOL RESULT ===`);
          infoLog(`${JSON.stringify(toolResult, null, 2)}`);
          infoLog(`==================`);
          
          // Adicionar observação ao histórico de mensagens
          const observationMessage = `Observation: ${JSON.stringify(toolResult)}`;
          currentMessages.push({ role: 'assistant', content: responseObj.content });
          currentMessages.push({ role: 'user', content: observationMessage });
          
          // Adicionar observação ao histórico de execução
          executionHistory.push(observationMessage);
          
          // Incrementar contador de iterações
          iterationCount++;
          
          // Continuar ciclo com novo estado
          continue;
        } else {
          debugLog(`Ação ou input ausente, continuando ciclo`);
        }
      } else {
        debugLog(`Estrutura ReAct não detectada`);
        // Não contém estrutura ReAct - pode ser resposta final
        if (this.containsFinalAnswer(responseObj.content)) {
          debugLog(`Final answer detectada (sem estrutura ReAct), encerrando ciclo`);
          return { response: responseObj.content, newState: 'chat' };
        }
        
        // Adicionar resposta ao histórico e continuar
        currentMessages.push({ role: 'assistant', content: responseObj.content });
        iterationCount++;
      }
    }
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