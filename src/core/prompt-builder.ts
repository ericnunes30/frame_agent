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
    
    return `Use the ReAct framework (Reasoning + Action) to solve the following task. Think step by step, and when you need to gather information or perform calculations, use the available tools.
    
Available tools:
${toolsDescription}

Conversation history:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Task: ${task}

Use the following format:
Thought: Your reasoning about the task and the next step
Action: The tool to use (must be one of: ${steps.length > 0 ? steps[0].availableTools?.map((t: any) => t.name).join(', ') : 'no tools available'})
Action Input: The input to the tool (JSON format)
Observation: The result of executing the tool
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I now know the final answer
Final Answer: The complete answer to the original task

${stepsHistory ? 'Previous steps:\n' + stepsHistory : 'Start!'}
`;
  }
}