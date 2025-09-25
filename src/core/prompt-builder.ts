// src/prompt-builder.ts
import { Tool } from '../adapters/provider-adapter';

export class PromptBuilder {
  buildChatPrompt(messages: any[], tools?: Tool[]): string {
    let prompt = '';
    
    // Adicionar instruções do sistema se houver
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      prompt += `${systemMessage.content}\n\n`;
    }
    
    // Adicionar histórico de mensagens
    const conversationHistory = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    prompt += conversationHistory;
    
    // Adicionar informações sobre tools se disponíveis
    if (tools && tools.length > 0) {
      prompt += '\n\nAvailable tools:\n';
      prompt += tools.map(tool => 
        `${tool.name}: ${tool.description}${tool.parameters ? 
          ` Parameters: ${JSON.stringify(tool.parameters)}` : ''}`
      ).join('\n');
    }
    
    return prompt;
  }
  
  buildToolPrompt(tool: Tool): string {
    return `Tool: ${tool.name}\nDescription: ${tool.description}\n${tool.parameters ? 
      `Parameters: ${JSON.stringify(tool.parameters)}` : 'No parameters'}`;
  }
  
  buildStructuredPrompt(schema: any): string {
    return `Please provide a response in the following JSON format:\n${JSON.stringify(schema, null, 2)}`;
  }
  
  buildReActPrompt(
    task: string, 
    toolsDescription: string, 
    steps: any[],
    history: any[]
  ): string {
    // Construir histórico de passos ReAct
    const stepsHistory = steps.map(step => 
      `Thought ${step.stepNumber}: ${step.thought}\n` +
      (step.action ? 
        `Action ${step.stepNumber}: ${step.action.name}[${JSON.stringify(step.action.input)}]\n` : '') +
      (step.observation ? 
        `Observation ${step.stepNumber}: ${JSON.stringify(step.observation)}\n` : '')
    ).join('\n');
    
    // Formatar o scratchpad
    const formattedScratchpad = stepsHistory ? 'Previous steps:\n' + stepsHistory : 'Start!';
    
    return `You are an intelligent agent designed to solve user tasks by thinking step-by-step and using a set of available tools.

Your operational framework is the ReAct (Reasoning and Acting) loop. You MUST strictly follow this format for every turn:

Thought: Reason about the user's request, your progress, and decide on the next immediate action to take. Do not plan multiple steps ahead; focus only on the very next action.
Action: Output a single JSON object representing the tool you want to use and its input. The JSON should have 'name' for the tool and 'input' for its parameters. If you have gathered enough information to provide a final answer, use the tool named 'final_answer' with the user-facing response as the input.

You have access to the following tools:
${toolsDescription}

Begin the task by thinking about your first step. Do not output any preamble or introductory text. Start directly with "Thought:".

Here is the history of your work on this task so far:
${formattedScratchpad}

Current Task: "${task}"

Your turn. Start with "Thought:".`;
  }
}