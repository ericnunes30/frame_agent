import { ChatMessage } from '../adapters/provider-adapter';

export class HybridPromptBuilder {
  /**
   * Constrói um prompt híbrido que combina instruções de chat e ReAct
   * O prompt sempre contém instruções ReAct para permitir detecção automática
   */
  buildHybridPrompt(
    task: string,
    toolsDescription: string,
    currentState: 'chat' | 'react',
    history: ChatMessage[]
  ): string {
    // Obter instruções do sistema do histórico, se existirem
    const systemMessage = history.find(msg => msg.role === 'system');
    const systemInstructions = systemMessage ? 
      `System Instructions: ${systemMessage.content}\\n\\n` : '';

    if (currentState === 'react') {
      // Modo ReAct: incluir formato estruturado completo
      const stepsHistory = this.formatStepsFromHistory(history);
      const formattedScratchpad = stepsHistory ? 'Previous steps:\\n' + stepsHistory : 'Start!';
      
      return `${systemInstructions}You are an intelligent agent designed to solve user tasks by thinking step-by-step and using a set of available tools.\\n\\nYour operational framework is the ReAct (Reasoning and Acting) loop. You MUST strictly follow this format for every turn:\\n\\nThought: Reason about the user's request, your progress, and decide on the next immediate action to take. Do not plan multiple steps ahead; focus only on the very next action. If you notice you are repeating the same action with the same parameters, stop and reconsider your approach.\\nAction: Output the name of a single tool to use from the available tools. CRITICAL: When you have gathered enough information to provide a final response OR when you recognize that all tasks and actions have been completed/finished/terminated, you MUST use the 'final_answer' tool immediately - it should be used separately and never combined with other tools in the same turn. The 'final_answer' tool signals the end of the interaction and should contain only your complete response to the user.\\nAction Input: A JSON object with the parameters for the action. If using 'final_answer', this should contain ONLY the final user-facing response as the input - no other information, just the answer to the user's request.\\n\\nYou have access to the following tools:\\n${toolsDescription}\\n\\nExample format:\\nThought: I need to create a React component file.\\nAction: file_create\\nAction Input: {\"filePath\": \"HelloWorld.js\", \"content\": \"import React from 'react';\\\\n\\\\nfunction HelloWorld() {\\\\n  return <div>Hello, world</div>;\\\\n}\\\\n\\\\nexport default HelloWorld;\"}\\n\\nBegin the task by thinking about your first step. Do not output any preamble or introductory text. Start directly with \"Thought:\".\\n\\nHere is the history of your work on this task so far:\\n${formattedScratchpad}\\n\\nCurrent Task: \"${task}\"\\n\\nYour turn. Start with \"Thought:\".`;
    } else {
      // Modo Chat com instruções ReAct disponíveis
      const conversationHistory = this.formatConversationHistory(history);
      
      // Incluir instruções ReAct de forma que o LLM entenda que pode usar ferramentas se necessário
      return `${systemInstructions}You are a helpful assistant. You can have conversations and perform actions using available tools when needed.\\n\\n${this.buildAdaptiveInstructions(toolsDescription, currentState)}\\n\\n${conversationHistory}\\n\\nUser: ${task}\\n\\nAssistant:`;
    }
  }

  /**
   * Cria instruções adaptativas que permitem ao LLM decidir quando usar ferramentas
   */
  buildAdaptiveInstructions(toolsDescription: string, currentState: 'chat' | 'react'): string {
    if (currentState === 'react') {
      return `You are currently in ReAct mode. Follow the Thought/Action/Observation format using these tools:\\n${toolsDescription}`;
    } else {
      return `You have access to these tools that you can use when necessary to complete tasks:\\n${toolsDescription}\\n\\nIf the user's request requires you to perform specific actions, think about whether you need to use one of these tools. Only transition to using tools when you determine it's necessary for the task. When you need to use a tool, start with \"Thought:\" and follow the format: \"Thought: [your reasoning]\\nAction: [tool name]\\nAction Input: [parameters in JSON format]\".`;
    }
  }

  /**
   * Formata o histórico de conversa para inclusão no prompt
   */
  private formatConversationHistory(history: ChatMessage[]): string {
    return history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\\n');
  }

  /**
   * Formata os passos ReAct do histórico
   */
  private formatStepsFromHistory(history: ChatMessage[]): string {
    // Extrai e formata os passos ReAct do histórico
    const steps = [];
    for (const msg of history) {
      if (msg.role === 'assistant') {
        // Tenta identificar padrões ReAct (Thought:, Action:, Observation:)
        const lines = msg.content.split('\\n');
        let stepContent = '';
        for (const line of lines) {
          if (line.startsWith('Thought:') || line.startsWith('Action:') || line.startsWith('Action Input:')) {
            stepContent += line + '\\n';
          }
        }
        if (stepContent.trim()) {
          steps.push(stepContent.trim());
        }
      }
    }
    return steps.join('\\n');
  }
}