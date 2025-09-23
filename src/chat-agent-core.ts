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

// Tipos de modos de agente
type AgentMode = 'chat' | 'react' | 'planning';

// Interfaces para o modo ReAct
interface ReActAction {
  name: string;
  input: any;
}

interface ReActStep {
  stepNumber: number;
  thought: string;
  action?: ReActAction;
  observation?: any;
  timestamp: Date;
}

interface ReActProcess {
  taskId: string;
  taskDescription: string;
  steps: ReActStep[];
  finalAnswer?: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

// Interface para a configuração do agente
interface AgentConfig {
  name: string;
  instructions: string;
  provider?: ProviderType;
  mode?: AgentMode;
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
    // Definir 'chat' como modo padrão se nenhum for especificado
    this.config = {
      provider: 'openai-generic',
      mode: 'chat',
      ...config
    };
    this.memoryManager = new MemoryManager(new DynamicWindowMemory(4096)); // 4096 tokens de limite
  }

  // Método para enviar uma mensagem e obter uma resposta
  async sendMessage(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    try {
      // Adicionar a mensagem do usuário ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });

      // Chamar a função apropriada com base no modo do agente
      const response: string = await this.callAgentModeFunction(message, dynamicConfig);

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

  // Método privado para chamar a função apropriada com base no modo do agente
  private async callAgentModeFunction(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    switch (this.config.mode) {
      case 'react':
        return await this.executeReactMode(message, dynamicConfig);
      case 'planning':
        return await this.executePlanningMode(message, dynamicConfig);
      case 'chat':
      default:
        // Default para modo chat
        return await this.callBamlFunction(message, dynamicConfig);
    }
  }

  // Método para executar o modo ReAct
  private async executeReactMode(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    const processId = `react_${Date.now()}`;
    const reactProcess: ReActProcess = {
      taskId: processId,
      taskDescription: message,
      steps: [],
      status: 'running',
      startTime: new Date()
    };
    
    try {
      // Obter tools registradas
      const availableTools = this.toolRegistry.list();
      
      // Gerar descrição das tools para o prompt
      const toolsDescription = this.generateToolsDescription(availableTools);
      
      // Obter histórico de mensagens
      const history = this.memoryManager.getMessages();
      
      // Executar ciclo ReAct (máximo de 10 passos)
      for (let step = 0; step < 10; step++) {
        // Criar prompt ReAct com contexto atual
        const reactPrompt = this.generateReActPrompt(
          message, 
          toolsDescription, 
          reactProcess.steps,
          history
        );
        
        // Chamar LLM para gerar próximo passo
        const llmResponse = await this.callBamlFunction(reactPrompt, dynamicConfig);
        
        // Parse da resposta para extrair Thought/Action
        const parsedResponse = this.parseReActResponse(llmResponse);
        
        // Adicionar passo ao processo
        const reactStep: ReActStep = {
          stepNumber: step + 1,
          thought: parsedResponse.thought,
          action: parsedResponse.action,
          timestamp: new Date()
        };
        
        reactProcess.steps.push(reactStep);
        
        // Executar ação se houver
        if (parsedResponse.action) {
          try {
            const observation = await this.executeTool(
              parsedResponse.action.name, 
              parsedResponse.action.input
            );
            reactStep.observation = observation;
          } catch (error: any) {
            reactStep.observation = { error: error.message };
          }
        }
        
        // Verificar se é a resposta final
        if (parsedResponse.isFinalAnswer) {
          reactProcess.finalAnswer = parsedResponse.finalAnswer;
          reactProcess.status = 'completed';
          reactProcess.endTime = new Date();
          break;
        }
        
        // Verificar se atingiu o limite de passos
        if (step === 9) {
          reactProcess.status = 'failed';
          reactProcess.endTime = new Date();
          reactProcess.finalAnswer = "Não foi possível encontrar uma resposta após 10 passos.";
        }
      }
      
      // Armazenar processo na memória
      this.memoryManager.setVariable(`react_process_${processId}`, reactProcess);
      
      return reactProcess.finalAnswer || "Não foi possível determinar uma resposta final.";
      
    } catch (error) {
      reactProcess.status = 'failed';
      reactProcess.endTime = new Date();
      this.memoryManager.setVariable(`react_process_${processId}`, reactProcess);
      throw error;
    }
  }
  
  // Método para gerar descrição das tools para o prompt
  private generateToolsDescription(tools: Tool[]): string {
    if (tools.length === 0) {
      return "Nenhuma ferramenta disponível.";
    }
    
    return tools.map(tool => 
      `${tool.name}: ${tool.description}${tool.parameters ? 
        ` Parâmetros: ${JSON.stringify(tool.parameters.properties)}` : ''}`
    ).join('\n');
  }
  
  // Método para gerar prompt ReAct
  private generateReActPrompt(
    task: string, 
    toolsDescription: string, 
    steps: ReActStep[],
    history: ChatMessage[]
  ): string {
    // Construir histórico de passos ReAct
    const stepsHistory = steps.map(step => 
      `Thought ${step.stepNumber}: ${step.thought}\n` +
      (step.action ? 
        `Action ${step.stepNumber}: ${step.action.name}[${JSON.stringify(step.action.input)}]\n` : '') +
      (step.observation ? 
        `Observation ${step.stepNumber}: ${JSON.stringify(step.observation)}\n` : '')
    ).join('\n');
    
    return `Use o framework ReAct (Reasoning + Action) para resolver a tarefa a seguir. Pense passo a passo, e quando precisar reunir informações ou realizar cálculos, use as ferramentas disponíveis.

Ferramentas disponíveis:
${toolsDescription}

Histórico da conversa:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Tarefa: ${task}

Use o seguinte formato:
Thought: Seu raciocínio sobre a tarefa e o próximo passo
Action: A ferramenta a ser usada (deve ser uma das: ${this.toolRegistry.list().map(t => t.name).join(', ')})
Action Input: A entrada para a ferramenta (formato JSON)
Observation: O resultado da execução da ferramenta
... (repita Thought/Action/Action Input/Observation conforme necessário)
Thought: Agora sei a resposta final
Final Answer: A resposta completa para a tarefa original

${stepsHistory ? 'Passos anteriores:\n' + stepsHistory : 'Comece!'}
`;
  }
  
  // Método para parsear resposta ReAct
  private parseReActResponse(response: string): {
    thought: string;
    action?: ReActAction;
    isFinalAnswer: boolean;
    finalAnswer?: string;
  } {
    // Esta é uma implementação simplificada
    // Em produção, você pode querer usar uma abordagem mais robusta com regex ou parsing
    
    const lines = response.split('\n');
    let thought = '';
    let action: ReActAction | undefined;
    let isFinalAnswer = false;
    let finalAnswer = '';
    
    // Extrair Thought (primeira linha que começa com "Thought:")
    const thoughtLine = lines.find(line => line.trim().startsWith('Thought:'));
    if (thoughtLine) {
      thought = thoughtLine.replace('Thought:', '').trim();
    }
    
    // Verificar se é resposta final
    const finalAnswerLine = lines.find(line => line.trim().startsWith('Final Answer:'));
    if (finalAnswerLine) {
      isFinalAnswer = true;
      finalAnswer = finalAnswerLine.replace('Final Answer:', '').trim();
    } else {
      // Extrair Action se não for resposta final
      const actionLine = lines.find(line => line.trim().startsWith('Action:'));
      const actionInputLine = lines.find(line => line.trim().startsWith('Action Input:'));
      
      if (actionLine && actionInputLine) {
        const actionName = actionLine.replace('Action:', '').trim();
        try {
          const actionInput = JSON.parse(actionInputLine.replace('Action Input:', '').trim());
          action = { name: actionName, input: actionInput };
        } catch (e) {
          // Se não conseguir parsear JSON, usar string simples
          action = { name: actionName, input: actionInputLine.replace('Action Input:', '').trim() };
        }
      }
    }
    
    return { thought, action, isFinalAnswer, finalAnswer };
  }

  // Método para executar o modo de Planejamento com modelos de thinking
  private async executePlanningMode(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    // Definir interfaces locais para o modo Planning
    interface PlanningSubtask {
      id: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      dependencies: string[]; // IDs das subtasks que precisam ser concluídas primeiro
      result?: any;
      thoughtProcess?: string; // Registro do processo de pensamento
    }

    interface PlanningTask {
      id: string;
      description: string;
      subtasks: PlanningSubtask[];
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      createdAt: Date;
      completedAt?: Date;
      thoughtProcess?: string; // Registro do processo de pensamento geral
    }

    const taskId = `planning_${Date.now()}`;
    const planningTask: PlanningTask = {
      id: taskId,
      description: message,
      subtasks: [],
      status: 'pending',
      createdAt: new Date()
    };
    
    try {
      // Obter tools registradas
      const availableTools = this.toolRegistry.list();
      
      // Gerar descrição das tools para o prompt
      const toolsDescription = this.generateToolsDescription(availableTools);
      
      // Obter histórico de mensagens
      const history = this.memoryManager.getMessages();
      
      // Etapa 1: Planejamento Hierárquico - Gerar plano de execução com modelos de thinking
      const planningPrompt = this.generatePlanningPrompt(message, toolsDescription, history);
      const planningResponse = await this.callBamlFunction(planningPrompt, dynamicConfig);
      
      // Parse do plano gerado
      const parsedPlan = this.parsePlanningResponse(planningResponse);
      planningTask.subtasks = parsedPlan.subtasks;
      planningTask.status = 'in-progress';
      planningTask.thoughtProcess = parsedPlan.thoughtProcess;
      
      // Etapa 2: Execução Reflexiva - Executar subtasks com capacidades reflexivas
      for (const subtask of planningTask.subtasks) {
        // Verificar dependências
        const dependenciesMet = subtask.dependencies.every(depId => {
          const dep = planningTask.subtasks.find(st => st.id === depId);
          return dep && dep.status === 'completed';
        });
        
        if (!dependenciesMet) {
          subtask.status = 'failed';
          continue;
        }
        
        subtask.status = 'in-progress';
        
        try {
          // Se a subtask requer uma tool, executá-la
          if (subtask.description.includes('usar ferramenta') || subtask.description.includes('tool')) {
            // Extrair nome da tool e parâmetros do texto (simulação)
            const toolMatch = subtask.description.match(/ferramenta\s+(\w+)/) || 
                             subtask.description.match(/tool\s+(\w+)/);
            
            if (toolMatch && toolMatch[1]) {
              const toolName = toolMatch[1];
              // Parâmetros simulados - em produção seria extraído do texto
              const toolArgs = { input: subtask.description };
              
              const result = await this.executeTool(toolName, toolArgs);
              subtask.result = result;
            }
          }
          
          // Simular processo de pensamento reflexivo
          subtask.thoughtProcess = `Analisando subtask: ${subtask.description}\n` +
                                  `Dependências verificadas: ${dependenciesMet}\n` +
                                  `Resultado obtido: ${JSON.stringify(subtask.result)}`;
          
          subtask.status = 'completed';
        } catch (error: any) {
          subtask.status = 'failed';
          subtask.result = { error: error.message };
          subtask.thoughtProcess = `Erro ao executar subtask: ${error.message}`;
        }
      }
      
      // Verificar se todas as subtasks foram concluídas
      const allCompleted = planningTask.subtasks.every(st => st.status === 'completed');
      planningTask.status = allCompleted ? 'completed' : 'failed';
      planningTask.completedAt = new Date();
      
      // Etapa 3: Síntese Adaptativa - Gerar resposta final com base nos resultados e feedback
      const synthesisPrompt = this.generateSynthesisPrompt(message, planningTask, history);
      const finalResponse = await this.callBamlFunction(synthesisPrompt, dynamicConfig);
      
      // Armazenar tarefa na memória
      this.memoryManager.setVariable(`planning_task_${taskId}`, planningTask);
      
      return finalResponse;
      
    } catch (error) {
      planningTask.status = 'failed';
      planningTask.completedAt = new Date();
      this.memoryManager.setVariable(`planning_task_${taskId}`, planningTask);
      throw error;
    }
  }
  
  // Método para gerar prompt de planejamento com modelos de thinking
  private generatePlanningPrompt(
    task: string, 
    toolsDescription: string, 
    history: ChatMessage[]
  ): string {
    return `Você é um assistente avançado com capacidades de thinking (raciocínio profundo). Sua tarefa é decompor a solicitação do usuário em subtasks menores e executáveis, usando um processo de pensamento analítico profundo.

Arquitetura Dual-Process:
- Modo Rápido (System 1): Respostas imediatas para tarefas simples
- Modo Lento (System 2): Processamento analítico profundo para tarefas complexas

Ferramentas disponíveis:
${toolsDescription}

Histórico da conversa:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Tarefa principal: ${task}

Instruções:
1. Analise a complexidade da tarefa para determinar se requer pensamento rápido ou lento
2. Se for complexa, use processamento analítico profundo para decompor em subtasks
3. Identifique dependências entre as subtasks (quais precisam ser concluídas antes de outras)
4. Para cada subtask, especifique se ela requer o uso de uma ferramenta específica
5. Documente seu processo de pensamento para transparência
6. Retorne um plano estruturado em formato JSON

Formato de resposta esperado:
{
  "thoughtProcess": "Descreva seu processo de análise e raciocínio",
  "subtasks": [
    {
      "id": "string",
      "description": "string",
      "dependencies": ["string"] // IDs das subtasks que devem ser concluídas primeiro
    }
  ]
}

Responda apenas com o JSON do plano, sem explicações adicionais.`;
  }
  
  // Método para parsear resposta de planejamento
  private parsePlanningResponse(response: string): { subtasks: any[]; thoughtProcess?: string } {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { 
          subtasks: parsed.subtasks || [],
          thoughtProcess: parsed.thoughtProcess || ''
        };
      }
    } catch (e) {
      // Se falhar, criar subtasks simples baseadas nas linhas
      const lines = response.split('\n').filter(line => line.trim() !== '');
      const subtasks: any[] = lines.map((line, index) => ({
        id: `step_${index + 1}`,
        description: line.trim(),
        status: 'pending',
        dependencies: []
      }));
      return { subtasks };
    }
    
    // Default fallback
    return { subtasks: [] };
  }
  
  // Método para gerar prompt de síntese com capacidades reflexivas
  private generateSynthesisPrompt(
    originalTask: string,
    planningTask: any,
    history: ChatMessage[]
  ): string {
    const completedSubtasks = planningTask.subtasks.filter((st: any) => st.status === 'completed');
    const failedSubtasks = planningTask.subtasks.filter((st: any) => st.status === 'failed');
    
    return `Com base no plano executado, forneça uma resposta final para a tarefa original do usuário, incorporando capacidades reflexivas e adaptativas.

Capacidades Reflexivas:
- Auto-avaliação do processo de planejamento e execução
- Adaptação com base em feedback dos resultados
- Aprendizado contínuo para melhorias futuras

Tarefa original: ${originalTask}

Processo de pensamento geral:
${planningTask.thoughtProcess || 'Nenhum processo registrado'}

Subtasks concluídas:
${completedSubtasks.map((st: any) => `- ${st.description}\n  Resultado: ${JSON.stringify(st.result)}\n  Pensamento: ${st.thoughtProcess || 'Nenhum processo registrado'}`).join('\n')}

Subtasks falhas:
${failedSubtasks.map((st: any) => `- ${st.description}\n  Erro: ${st.result?.error || 'Falha desconhecida'}\n  Pensamento: ${st.thoughtProcess || 'Nenhum processo registrado'}`).join('\n')}

Histórico da conversa:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Instruções:
- Forneça uma resposta completa e útil para a tarefa original
- Considere os resultados de todas as subtasks concluídas
- Se houver subtasks falhas que impedem uma resposta completa, mencione isso
- Inclua insights do processo de pensamento para transparência
- Seja conciso mas abrangente`;
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

export { ChatAgent, type AgentConfig, type ProviderType };