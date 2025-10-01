import { ChatMessage, ProviderAdapter } from '../adapters/provider-adapter';
import { Tool } from '../adapters/provider-adapter';
import { debugLog, conditionalLog, infoLog } from '../utils/debug-logger';

export class AdaptiveExecutor {
  /**
   * Executa a lÃ³gica adaptativa baseada no estado detectado
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
      // ExecuÃ§Ã£o ReAct: parsing e execuÃ§Ã£o de aÃ§Ãµes
      debugLog(`Executing ReAct mode`);
      return await this.executeReact(adapter, messages, tools);
    } else {
      // ExecuÃ§Ã£o conversacional normal
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
    // No modo chat, ainda precisamos verificar se a resposta contÃ©m
    // comandos ReAct que precisam ser detectados
    const responseObj = await adapter.sendMessage({
      messages
    });

    // Verificar se a resposta contÃ©m estrutura ReAct
    if (this.containsReActStructure(responseObj.content)) {
      // A IA respondeu com estrutura ReAct, entÃ£o devemos executar as ferramentas
      // em vez de apenas mudar o estado e retornar
      return await this.executeReactFromChatResponse(adapter, messages, tools, responseObj.content);
    }

    return { response: responseObj.content, newState: 'chat' };
  }

  /**
   * Executa ReAct a partir de uma resposta do modo chat
   * Quando o LLM responde com formato ReAct em modo chat, processamos as ferramentas
   */
  private async executeReactFromChatResponse(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[],
    initialResponse: string
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    // Copiar mensagens para nÃ£o modificar o array original
    let currentMessages = [...messages];
    
    // Adiciona a resposta inicial do LLM como parte do histÃ³rico
    currentMessages.push({ role: 'assistant', content: initialResponse });
    
    // Parse e executa a primeira aÃ§Ã£o da resposta inicial
    const { thought, action, actionInput } = this.parseReActResponse(initialResponse);
    
    debugLog(`Estrutura ReAct detectada na resposta inicial:`);
    debugLog(`  Thought: ${thought ? thought.substring(0, 100) + '...' : 'null'}`);
    debugLog(`  Action: ${action}`);
    debugLog(`  Action Input: ${actionInput ? JSON.stringify(actionInput).substring(0, 100) + '...' : 'null'}`);
    
    if (action && actionInput) {
      // Exibir pensamento se houver
      if (thought) {
        conditionalLog(`[Pensamento] ${thought}`);
      }
      
      // Exibir a resposta do LLM primeiro (com o formato ReAct)
      console.log(initialResponse);
      // Indicar que a resposta jÃ¡ foi exibida para evitar duplicaÃ§Ã£o
      process.env.RESPONSE_ALREADY_DISPLAYED = 'true';
      
      // Verificar se o actionInput contÃ©m referÃªncia indevida a final_answer
      if (this.hasFinalAnswerInActionInput(actionInput) && action !== 'final_answer') {
        // O LLM estÃ¡ tentando incluir final_answer dentro dos parÃ¢metros de outra ferramenta
        const errorFeedback = `ERROR: You cannot include "final_answer" as a parameter in another tool's input. The "final_answer" must be used as a separate Action when you're ready to provide the final response. Please use the correct format.`;
        
        // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
        currentMessages.push({ role: 'assistant', content: initialResponse });
        currentMessages.push({ role: 'user', content: errorFeedback });
        
        // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
        if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
          currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
        }
        
        // Neste caso especÃ­fico (resposta inicial), retornamos ao modo chat
        // pois nÃ£o hÃ¡ loop interno para continuar
        return { response: errorFeedback, newState: 'chat' };
      }
      
      // Executar aÃ§Ã£o usando as ferramentas
      infoLog(`=== TOOL EXECUTION ===`);
      infoLog(`Tool: ${action}`);
      infoLog(`${JSON.stringify(actionInput, null, 2)}`);
      infoLog(`====================`);
      
      const toolResult = await this.executeTool(action, actionInput, tools);
      
      // Verificar se Ã© a ferramenta final_answer - precisa ser feito APÃ“S a execuÃ§Ã£o da ferramenta
      if (action === 'final_answer') {
        debugLog(`Final answer tool executado na resposta inicial, encerrando ciclo`);
        // Detecta final_answer apÃ³s execuÃ§Ã£o e retorna resposta final
        return { response: initialResponse, newState: 'chat' };
      }
      
      infoLog(`=== TOOL RESULT ===`);
      infoLog(`${JSON.stringify(toolResult, null, 2)}`);
      infoLog(`==================`);
      
      // Adicionar observaÃ§Ã£o ao histÃ³rico de mensagens
      const observationMessage = `Observation: ${JSON.stringify(toolResult)}`;
      currentMessages.push({ role: 'assistant', content: initialResponse });
      currentMessages.push({ role: 'user', content: observationMessage });
      
      // VariÃ¡vel para contar iteraÃ§Ãµes no ciclo ReAct
      let reactIterationCount = 0;
      
      // Continuar ciclo ReAct completo indefinidamente atÃ© receber final_answer
      while (true) {
        debugLog(`Continuing ReAct cycle after tool execution - iteration ${reactIterationCount + 1}`);
        
        // Chama o provedor para obter prÃ³xima resposta formatada ReAct
        const responseObj = await adapter.sendMessage({
          messages: currentMessages
        });

        debugLog(`Nova resposta LLM: ${responseObj.content.substring(0, 200)}...}`);

        // Exibir pensamento se houver
        if (this.containsReActStructure(responseObj.content)) {
          const { thought: newThought, action: newAction, actionInput: newActionInput } = this.parseReActResponse(responseObj.content);
          
          debugLog(`Nova estrutura ReAct detectada:`);
          debugLog(`  Thought: ${newThought ? newThought.substring(0, 100) + '...' : 'null'}`);
          debugLog(`  Action: ${newAction}`);
          debugLog(`  Action Input: ${newActionInput ? JSON.stringify(newActionInput).substring(0, 100) + '...' : 'null'}`);
          
          // Validar se o parsing foi bem-sucedido e se temos os componentes necessÃ¡rios
          if (!newAction || !newActionInput) {
            // O parsing falhou ou nÃ£o temos os componentes necessÃ¡rios
            const errorFeedback = `ERROR: Your ReAct response was malformed. You must provide both "Action:" and "Action Input:" in the correct format. Please try again.`;
            
            // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
            currentMessages.push({ role: 'assistant', content: responseObj.content });
            currentMessages.push({ role: 'user', content: errorFeedback });
            
            // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
            if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
              currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
            }
            
            // Incrementar contador de iteraÃ§Ãµes
            reactIterationCount++;
            
            // Continuar o loop para dar oportunidade ao LLM de corrigir
            continue;
          }
          
          // Exibir pensamento se houver
          if (newThought) {
            conditionalLog(`[Pensamento] ${newThought}`);
          }
          
          // Exibir a resposta do LLM primeiro (com o formato ReAct)
          console.log(responseObj.content);
          
          if (newAction && newActionInput) {
            // Verificar se o actionInput contÃ©m referÃªncia indevida a final_answer
            if (this.hasFinalAnswerInActionInput(newActionInput) && newAction !== 'final_answer') {
              // O LLM estÃ¡ tentando incluir final_answer dentro dos parÃ¢metros de outra ferramenta
              const errorFeedback = `ERROR: You cannot include "final_answer" as a parameter in another tool's input. The "final_answer" must be used as a separate Action when you're ready to provide the final response. Please use the correct format.`;
              
              // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
              currentMessages.push({ role: 'assistant', content: responseObj.content });
              currentMessages.push({ role: 'user', content: errorFeedback });
              
              // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
              if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
                currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
              }
              
              // Incrementar contador de iteraÃ§Ãµes
              reactIterationCount++;
              
              // Continuar o loop para dar oportunidade ao LLM de corrigir
              continue;
            }
            
            // Executar aÃ§Ã£o usando as ferramentas
            infoLog(`=== TOOL EXECUTION ===`);
            infoLog(`Tool: ${newAction}`);
            infoLog(`${JSON.stringify(newActionInput, null, 2)}`);
            infoLog(`====================`);
            
            const newToolResult = await this.executeTool(newAction, newActionInput, tools);
            
            // Verificar se Ã© a ferramenta final_answer - precisa ser feito APÃ“S a execuÃ§Ã£o da ferramenta
            if (newAction === 'final_answer') {
              debugLog(`Final answer tool executado, encerrando ciclo`);
              // Detecta final_answer apÃ³s execuÃ§Ã£o e retorna resposta final
              return { response: responseObj.content, newState: 'chat' };
            }
            
            infoLog(`=== TOOL RESULT ===`);
            infoLog(`${JSON.stringify(newToolResult, null, 2)}`);
            infoLog(`==================`);
            
            // Adicionar observaÃ§Ã£o ao histÃ³rico de mensagens
            const newObservationMessage = `Observation: ${JSON.stringify(newToolResult)}`;
            currentMessages.push({ role: 'assistant', content: responseObj.content });
            currentMessages.push({ role: 'user', content: newObservationMessage });
            
            // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
            if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
              currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
            }
            
            // Incrementar contador de iteraÃ§Ãµes
            reactIterationCount++;
            
            // Continuar ciclo
            continue;
          }
        } else {
          debugLog(`Estrutura ReAct nÃ£o detectada na nova resposta`);
          
          // O LLM respondeu sem estrutura ReAct - precisamos dar feedback
          // para que ele saiba que precisa usar o formato correto
          const errorFeedback = `ERROR: Your response did not follow the required ReAct format. You must respond with: "Thought:", "Action:", and "Action Input:" in the correct format. Please try again with the proper structure.`;
          
          // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
          currentMessages.push({ role: 'assistant', content: responseObj.content });
          currentMessages.push({ role: 'user', content: errorFeedback });
          
          // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
          if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
            currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
          }
          
          // Incrementar contador de iteraÃ§Ãµes
          reactIterationCount++;
          
          // Continuar o loop para dar oportunidade ao LLM de corrigir
          continue;
        }
        
        // Incrementar contador de iteraÃ§Ãµes
        reactIterationCount++;
        
        // Se chegou atÃ© aqui sem retornar, significa que nÃ£o temos mais aÃ§Ãµes para executar
        // e nÃ£o Ã© resposta final, entÃ£o encerramos o ciclo ReAct e voltamos ao modo chat
        return { response: responseObj.content, newState: 'chat' };
      }
    }
    
    // Se nÃ£o houver aÃ§Ã£o ou input vÃ¡lidos, retornar normalmente
    // Mas ainda exibir a resposta do LLM se tiver estrutura ReAct (pode ser uma resposta final sem aÃ§Ã£o)
    if (this.containsReActStructure(initialResponse)) {
      console.log(initialResponse);
    }
    return { response: initialResponse, newState: 'react' };
  }

  /**
   * Executa no modo ReAct com parsing e execuÃ§Ã£o de aÃ§Ãµes
   */
  private async executeReact(
    adapter: ProviderAdapter,
    messages: ChatMessage[],
    tools: Tool[]
  ): Promise<{ response: string; newState: 'chat' | 'react' }> {
    // Copiar mensagens para nÃ£o modificar o array original
    let currentMessages = [...messages];
    let iterationCount = 0;
    
    // Armazenar histÃ³rico de execuÃ§Ã£o para retorno
    let executionHistory: string[] = [];
    
    // Executar ciclo ReAct completo indefinidamente atÃ© receber final_answer
    while (true) {
      debugLog(`IteraÃ§Ã£o ReAct ${iterationCount + 1}`);
      
      // Chama o provedor para obter resposta formatada ReAct
      const responseObj = await adapter.sendMessage({
        messages: currentMessages
      });

      // Armazenar resposta para histÃ³rico de execuÃ§Ã£o
      executionHistory.push(responseObj.content);
      
      // Verificar se a resposta contÃ©m estrutura ReAct (Thought/Action/Observation)
      if (this.containsReActStructure(responseObj.content)) {
        const { thought, action, actionInput } = this.parseReActResponse(responseObj.content);
        
        debugLog(`Estrutura ReAct detectada:`);
        debugLog(`  Thought: ${thought ? thought.substring(0, 100) + '...' : 'null'}`);
        debugLog(`  Action: ${action}`);
        debugLog(`  Action Input: ${actionInput ? JSON.stringify(actionInput).substring(0, 100) + '...' : 'null'}`);
        
        // Validar se o parsing foi bem-sucedido e se temos os componentes necessÃ¡rios
        if (!action || !actionInput) {
          // O parsing falhou ou nÃ£o temos os componentes necessÃ¡rios
          const errorFeedback = `ERROR: Your ReAct response was malformed. You must provide both "Action:" and "Action Input:" in the correct format. Please try again.`;
          
          // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
          currentMessages.push({ role: 'assistant', content: responseObj.content });
          currentMessages.push({ role: 'user', content: errorFeedback });
          
          // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
          if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
            currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
          }
          
          // Incrementar contador de iteraÃ§Ãµes
          iterationCount++;
          
          //Continuar o loop para dar oportunidade ao LLM de corrigir
          continue;
        }
        
        // Exibir pensamento se houver
        if (thought) {
          conditionalLog(`[Pensamento] ${thought}`);
        }
        
        // Exibir a resposta do LLM primeiro (com o formato ReAct)
        console.log(responseObj.content);
        
        if (action && actionInput) {
          // Verificar se o actionInput contÃ©m referÃªncia indevida a final_answer
          if (this.hasFinalAnswerInActionInput(actionInput) && action !== 'final_answer') {
            // O LLM estÃ¡ tentando incluir final_answer dentro dos parÃ¢metros de outra ferramenta
            const errorFeedback = `ERROR: You cannot include "final_answer" as a parameter in another tool's input. The "final_answer" must be used as a separate Action when you're ready to provide the final response. Please use the correct format.`;
            
            // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
            currentMessages.push({ role: 'assistant', content: responseObj.content });
            currentMessages.push({ role: 'user', content: errorFeedback });
            
            // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
            if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
              currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
            }
            
            // Incrementar contador de iteraÃ§Ãµes
            iterationCount++;
            
            // Continuar o loop para dar oportunidade ao LLM de corrigir
            continue;
          }
          
          // Executar aÃ§Ã£o usando as ferramentas
          infoLog(`=== TOOL EXECUTION ===`);
          infoLog(`Tool: ${action}`);
          infoLog(`${JSON.stringify(actionInput, null, 2)}`);
          infoLog(`====================`);
          
          const toolResult = await this.executeTool(action, actionInput, tools);
          
          // Verificar se Ã© a ferramenta final_answer - precisa ser feito APÃ“S a execuÃ§Ã£o da ferramenta
          if (action === 'final_answer') {
            debugLog(`Final answer tool executado, encerrando ciclo`);
            // Detecta final_answer apÃ³s execuÃ§Ã£o e retorna resposta final
            return { response: responseObj.content, newState: 'chat' };
          }
          
          infoLog(`=== TOOL RESULT ===`);
          infoLog(`${JSON.stringify(toolResult, null, 2)}`);
          infoLog(`==================`);
          
          // Adicionar observaÃ§Ã£o ao histÃ³rico de mensagens
          const observationMessage = `Observation: ${JSON.stringify(toolResult)}`;
          currentMessages.push({ role: 'assistant', content: responseObj.content });
          currentMessages.push({ role: 'user', content: observationMessage });
          
          // Adicionar observaÃ§Ã£o ao histÃ³rico de execuÃ§Ã£o
          executionHistory.push(observationMessage);
          
          // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
          if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
            currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
          }
          
          // Incrementar contador de iteraÃ§Ãµes
          iterationCount++;
          
          // Continuar ciclo com novo estado
          continue;
        } else {
          debugLog(`AÃ§Ã£o ou input ausente, continuando ciclo`);
        }
      } else {
        debugLog(`Estrutura ReAct nÃ£o detectada`);
        
        // O LLM respondeu sem estrutura ReAct - precisamos dar feedback
        // para que ele saiba que precisa usar o formato correto
        const errorFeedback = `ERROR: Your response did not follow the required ReAct format. You must respond with: "Thought:", "Action:", and "Action Input:" in the correct format. Please try again with the proper structure.`;
        
        // Adicionar a resposta do assistente e o feedback de erro ao histÃ³rico
        currentMessages.push({ role: 'assistant', content: responseObj.content });
        currentMessages.push({ role: 'user', content: errorFeedback });
        
        // Limpar histÃ³rico se for muito longo para evitar uso excessivo de memÃ³ria
        if (currentMessages.length > 120) { // Manter apenas as Ãºltimas 120 mensagens
          currentMessages = currentMessages.slice(-100); // Manter as Ãºltimas 100 mensagens
        }
        
        iterationCount++;
        
        // Continuar o loop para dar oportunidade ao LLM de corrigir
        continue;
      }
    }
  }

  /**
   * Verifica se a resposta contÃ©m estrutura ReAct
   */
  private containsReActStructure(response: string): boolean {
    return response.includes('Thought:') && 
           (response.includes('Action:') || response.includes('Action Input:'));
  }

  /**
   * Verifica se a resposta contÃ©m final_answer
   */
  private containsFinalAnswer(response: string): boolean {
    // Procura especificamente por 'Action: final_answer' para verificar se o LLM 
    // estÃ¡ tentando executar a ferramenta final_answer
    return /Action:\\s*final_answer/i.test(response);
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
   * Executa uma ferramenta especÃ­fica
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
      // Executar a ferramenta com os parÃ¢metros fornecidos
      return await tool.execute(actionInput);
     } catch (error: any) {
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
        // Remover ```json e ``` do inÃ­cio e fim se existirem
        let cleanStr = jsonStr.replace(/```json\n?/, '').replace(/```/, '').trim();
        return JSON.parse(cleanStr);
      } catch (error2) {
        console.error('Failed to parse JSON:', error2);
        return null;
      }
    }
  }

  /**
   * Verifica se o input de ação contém referência indevida a final_answer
   */
  private hasFinalAnswerInActionInput(actionInput: any): boolean {
    if (!actionInput || typeof actionInput !== 'object') {
      return false;
    }
    
    // Verificar se a propriedade 'final_answer' existe diretamente
    if (actionInput.hasOwnProperty('final_answer')) {
      return true;
    }
    
    // Verificar recursivamente em objetos e arrays aninhados
    for (const key in actionInput) {
      if (actionInput.hasOwnProperty(key)) {
        const value = actionInput[key];
        
        if (typeof value === 'object' && value !== null) {
          if (this.hasFinalAnswerInActionInput(value)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
}

