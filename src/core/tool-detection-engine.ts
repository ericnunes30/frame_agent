import { Tool } from '../adapters/provider-adapter';

export class ToolDetectionEngine {
  /**
   * Detecta inteligentemente quando usar ferramentas baseado na análise semântica
   * e intenção da mensagem do usuário
   */
  detectToolUsageIntent(userMessage: string, availableTools: Tool[]): boolean {
    // Análise semântica da mensagem para detectar necessidade de ações
    const hasActionKeywords = this.hasActionKeywords(userMessage);
    const hasToolRelatedIntent = this.hasToolRelatedIntent(userMessage);
    const complexityScore = this.assessComplexity(userMessage);
    const toolRelevance = this.calculateToolRelevance(userMessage, availableTools);
    
    // Combinação de fatores para decisão
    const shouldUseTools = 
      (hasActionKeywords && toolRelevance > 0.3) || 
      (hasToolRelatedIntent && complexityScore > 0.6) || 
      toolRelevance > 0.7;
    
    return shouldUseTools;
  }

  /**
   * Detecta se a mensagem contém palavras-chave relacionadas a ações
   */
  private hasActionKeywords(message: string): boolean {
    const actionWords = [
      'create', 'generate', 'make', 'build', 'write', 'find', 'search', 
      'get', 'fetch', 'read', 'open', 'execute', 'run', 'perform', 
      'do', 'complete', 'implement', 'develop', 'design', 'analyze',
      'check', 'verify', 'test', 'update', 'modify', 'change', 'delete',
      'remove', 'send', 'post', 'put', 'patch', 'upload', 'download'
    ];
    
    const lowerMessage = message.toLowerCase();
    return actionWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Verifica se há intenção relacionada a ferramentas
   */
  private hasToolRelatedIntent(message: string): boolean {
    const toolRelatedPhrases = [
      'can you help me', 'i need to', 'i want to', 'could you', 'would you',
      'please', 'could you create', 'i need you to', 'can you make',
      'i want you to', 'how can i', 'what can i', 'use tool',
      'with the tool', 'using', 'by using'
    ];
    
    const lowerMessage = message.toLowerCase();
    return toolRelatedPhrases.some(phrase => lowerMessage.includes(phrase));
  }

  /**
   * Avalia a complexidade da tarefa solicitada
   */
  private assessComplexity(message: string): number {
    // Avalia complexidade com base no comprimento e estrutura da frase
    const words = message.trim().split(/\s+/);
    const clauses = message.split(/[.,;!?]+/);
    
    // Complexidade baseada em número de palavras e cláusulas
    const lengthFactor = Math.min(1.0, words.length / 20);  // Normalizado de 0 a 1
    const structureFactor = Math.min(1.0, clauses.length / 5); // Normalizado de 0 a 1
    
    return (lengthFactor * 0.6 + structureFactor * 0.4);
  }

  /**
   * Calcula a relevância das ferramentas disponíveis para a mensagem
   */
  private calculateToolRelevance(message: string, tools: Tool[]): number {
    if (tools.length === 0) {
      return 0;
    }
    
    let maxRelevance = 0;
    
    for (const tool of tools) {
      // Calcula relevância baseada em nome e descrição da ferramenta
      const nameRelevance = this.calculateTextRelevance(message, tool.name);
      const descRelevance = tool.description ? 
        this.calculateTextRelevance(message, tool.description) : 0;
      
      const toolRelevance = Math.max(nameRelevance, descRelevance);
      maxRelevance = Math.max(maxRelevance, toolRelevance);
    }
    
    return maxRelevance;
  }

  /**
   * Calcula a relevância entre uma mensagem e um texto de ferramenta
   */
  private calculateTextRelevance(message: string, text: string): number {
    const messageWords = message.toLowerCase().split(/\W+/);
    const textWords = text.toLowerCase().split(/\W+/);
    
    // Calcula interseção de palavras
    const commonWords = messageWords.filter(word => 
      textWords.includes(word) && word.length > 2  // Ignora palavras curtas
    );
    
    // Normaliza pela média dos tamanhos
    const avgLength = (messageWords.length + textWords.length) / 2;
    return avgLength > 0 ? commonWords.length / avgLength : 0;
  }

  /**
   * Detecta o estado de transição necessário com base na última resposta
   */
  detectTransitionState(
    userMessage: string, 
    availableTools: Tool[], 
    currentContext: any[]
  ): 'continue-chat' | 'enter-react' | 'exit-react' {
    
    // Verifica se o usuário solicitou uma ação que requer ferramentas
    if (this.detectToolUsageIntent(userMessage, availableTools)) {
      return 'enter-react';
    }
    
    // Verifica se a conversa está retornando a um estado conversacional
    if (currentContext.length > 0 && this.isConversationalResponse(userMessage)) {
      return 'continue-chat';
    }
    
    // Caso contrário, mantém o estado atual
    return 'continue-chat';
  }
  
  /**
   * Detecta se uma resposta contém final_answer para encerrar modo ReAct
   */
  detectFinalAnswer(response: string): boolean {
    return response.includes('Action: final_answer') || 
           (response.includes('final_answer') && response.includes('Action Input:'));
  }

  /**
   * Verifica se uma resposta é conversacional (não estruturada ReAct)
   */
  private isConversationalResponse(response: string): boolean {
    // Verifica se a resposta segue formato ReAct ou é conversacional
    const hasReActStructure = 
      response.includes('Thought:') && 
      (response.includes('Action:') || response.includes('Action Input:'));
    
    return !hasReActStructure;
  }
}