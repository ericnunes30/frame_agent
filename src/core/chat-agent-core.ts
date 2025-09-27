// src/chat-agent-core.ts
// Interface para mensagens de chat
interface ChatMessage {
  role: string;
  content: string;
}
import { ProviderAdapter, ProviderType, Tool } from '../adapters/provider-adapter';
import { OpenAIAdapter } from '../adapters/openai-adapter';
import { ToolRegistry } from '../tools/tools';
import { MemoryManager, DynamicWindowMemory } from '../memory/memory-manager';
import { PromptBuilder } from './prompt-builder';
import * as v from 'valibot';

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
  private providerAdapter: ProviderAdapter;

constructor(config: AgentConfig) {
    // Definir OpenAI Generic como provider padrão se nenhum for especificado
    // Definir 'chat' como modo padrão se nenhum for especificado
    this.config = {
      provider: 'openai-generic',
      mode: 'chat',
      ...config
    };
    const dynamicMemory = new DynamicWindowMemory(4096); // 4096 tokens de limite
    this.memoryManager = new MemoryManager(dynamicMemory);
    
    // Adicionar instruções como mensagem do sistema
    if (this.config.instructions) {
      this.memoryManager.addMessage({ role: 'system', content: this.config.instructions });
    }
    
    // Marcar mensagens do sistema como fixas
    const fixedIndices: number[] = [];
    const currentMessages = this.memoryManager.getMessages();
    currentMessages.forEach((msg, index) => {
      if (msg.role === 'system') {
        fixedIndices.push(index);
      }
    });
    
    // Se estiver usando DynamicWindowMemory, definir mensagens fixas
    if (dynamicMemory.setFixedMessages) {
      dynamicMemory.setFixedMessages(fixedIndices);
    }
    
    // Inicializar provider adapter
    this.providerAdapter = this.createProviderAdapter(this.config.provider || 'openai-generic');
  }
  
  private createProviderAdapter(provider: ProviderType): ProviderAdapter {
    switch (provider) {
      case 'openai-gpt-4o':
        return new OpenAIAdapter('gpt-4o', process.env.OPENAI_API_KEY);
      case 'openai-gpt-4o-mini':
        return new OpenAIAdapter('gpt-4o-mini', process.env.OPENAI_API_KEY);
      case 'openai-generic':
        return new OpenAIAdapter(
          process.env.MODEL || 'gpt-4o-mini',
          process.env.OPENAI_API_KEY,
          process.env.OPENAI_BASE_URL
        );
      // case 'anthropic-sonnet':
      //   return new AnthropicAdapter('claude-3-5-sonnet-20241022', process.env.ANTHROPIC_API_KEY);
      // case 'anthropic-haiku':
      //   return new AnthropicAdapter('claude-3-haiku-20240307', process.env.ANTHROPIC_API_KEY);
      default:
        // Default para OpenAI Generic
        return new OpenAIAdapter(
          process.env.MODEL || 'gpt-4o-mini',
          process.env.OPENAI_API_KEY,
          process.env.OPENAI_BASE_URL
        );
    }
  }

// Método para enviar uma mensagem e obter uma resposta
  async sendMessage(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    try {
      // Verificar se é a primeira mensagem do usuário
      const currentMessages = this.memoryManager.getMessages();
      const hasUserMessage = currentMessages.some(msg => msg.role === 'user');
      
      // Adicionar a mensagem do usuário ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });
      
      // Se for a primeira mensagem do usuário, marcar como fixa
      if (!hasUserMessage) {
        // Atualizar índices das mensagens fixas
        const memoryStrategy = (this.memoryManager as any).contextMemory;
        if (memoryStrategy.setFixedMessages) {
          const updatedMessages = this.memoryManager.getMessages();
          const fixedIndices: number[] = [];
          
          // Marcar mensagens do sistema como fixas
          updatedMessages.forEach((msg, index) => {
            if (msg.role === 'system') {
              fixedIndices.push(index);
            }
          });
          
          // Marcar a primeira mensagem do usuário como fixa
          const firstUserIndex = updatedMessages.findIndex(msg => msg.role === 'user');
          if (firstUserIndex !== -1) {
            fixedIndices.push(firstUserIndex);
          }
          
          memoryStrategy.setFixedMessages(fixedIndices);
        }
      }

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
  async sendStructuredMessage(message: string, schema: any): Promise<any> {
    try {
      // Adicionar a mensagem do usuário ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });

      // Chamar o provider para resposta estruturada
      const response = await this.providerAdapter.sendStructuredMessage({
        message,
        schema,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });

      // Validar resposta com Valibot se schema for fornecido
      let validatedResponse = response;
      if (schema) {
        try {
          // Se a resposta for uma string, tentar parsear como JSON primeiro
          let parsedResponse = response;
          if (typeof response === 'string') {
            try {
              parsedResponse = JSON.parse(response);
            } catch (parseError) {
              // Se não conseguir parsear, usar a resposta como está
              parsedResponse = response;
            }
          }
          
          validatedResponse = v.parse(schema, parsedResponse);
        } catch (error: any) {
          throw new Error(`Validação da resposta estruturada falhou: ${error.message}`);
        }
      }

      // Adicionar a resposta do assistente ao histórico
      this.memoryManager.addMessage({ 
        role: 'assistant', 
        content: JSON.stringify(validatedResponse)
      });

      return validatedResponse;
    } catch (error) {
      console.error('Erro ao enviar mensagem estruturada:', error);
      throw error;
    }
  }

// Método privado para chamar o provider apropriado
  private async callProviderFunction(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
    // Obter histórico de mensagens
    const history = this.memoryManager.getMessages();
    
    // Adicionar a nova mensagem do usuário
    const messages = [...history, { role: 'user', content: message }];
    
    // Obter tools registradas
    const availableTools = this.toolRegistry.list();
    
    // Configurar parâmetros
    const params: any = {
      messages,
      tools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      })),
      temperature: dynamicConfig?.temperature ?? this.config.temperature,
      maxTokens: dynamicConfig?.maxTokens ?? this.config.maxTokens,
      topP: dynamicConfig?.topP ?? this.config.topP,
      presencePenalty: dynamicConfig?.presencePenalty ?? this.config.presencePenalty,
      frequencyPenalty: dynamicConfig?.frequencyPenalty ?? this.config.frequencyPenalty
    };
    
    // Chamar o provider adapter
    const response = await this.providerAdapter.sendMessage(params);
    
    return response.content;
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
        return await this.callProviderFunction(message, dynamicConfig);
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
      
// Executar ciclo ReAct (sem limite fixo de passos)
      let step = 0;
      const maxSteps = 50; // Limite máximo de segurança
      while (step < maxSteps) {
        // Verificar se há loops nas ações recentes
        if (reactProcess.steps.length >= 3 && this.detectActionLoop(reactProcess.steps)) {
          // Forçar reavaliação quando loop é detectado
          console.log('[Loop Detectado] Forçando reavaliação da estratégia...');
          // Adicionar instrução especial para re-pensar
          const reThinkPrompt = this.generateReActPrompt(
            message, 
            toolsDescription, 
            reactProcess.steps,
            history
          );
          
          // Chamar LLM para reavaliar
          const reThinkResponse = await this.callProviderFunction(reThinkPrompt, dynamicConfig);
          const reThinkParsed = this.parseReActResponse(reThinkResponse);
          
          // Adicionar passo de reavaliação
          const reThinkStep: ReActStep = {
            stepNumber: step + 1,
            thought: `[Reavaliação] ${reThinkParsed.thought}`,
            action: reThinkParsed.action,
            timestamp: new Date()
          };
          
          reactProcess.steps.push(reThinkStep);
          
          // Se ainda houver ação após reavaliação, continuar normalmente
          if (reThinkParsed.action) {
            // Log do pensamento de reavaliação
            console.log(`[Reavaliação] ${reThinkParsed.thought}`);
          }
        }
        // Criar prompt ReAct com contexto atual
        const reactPrompt = this.generateReActPrompt(
          message, 
          toolsDescription, 
          reactProcess.steps,
          history
        );
        
// Chamar LLM para gerar próximo passo
        const llmResponse = await this.callProviderFunction(reactPrompt, dynamicConfig);
        
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
        
// Incrementar contador de passos
        step++;
}

      // Se atingiu o limite máximo de passos
      if (step >= maxSteps) {
        reactProcess.status = 'failed';
        reactProcess.endTime = new Date();
        reactProcess.finalAnswer = `Não foi possível encontrar uma resposta após ${maxSteps} passos.`;
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
  
// Método para detectar loops em ações recentes
  private detectActionLoop(steps: ReActStep[]): boolean {
    // Verificar se temos pelo menos 3 passos
    if (steps.length < 3) {
      return false;
    }
    
    // Verificar os últimos 3 passos
    const recentSteps = steps.slice(-3);
    
    // Verificar se todos têm a mesma action
    if (recentSteps[0].action && recentSteps[1].action && recentSteps[2].action) {
      const action1 = recentSteps[0].action;
      const action2 = recentSteps[1].action;
      const action3 = recentSteps[2].action;
      
      // Verificar se é a mesma action com os mesmos parâmetros
      if (action1.name === action2.name && action2.name === action3.name) {
        // Comparar parâmetros (simplificado)
        const input1 = JSON.stringify(action1.input);
        const input2 = JSON.stringify(action2.input);
        const input3 = JSON.stringify(action3.input);
        
        if (input1 === input2 && input2 === input3) {
          return true; // Loop detectado
        }
      }
    }
    
    return false; // Nenhum loop detectado
  }

  // Método para gerar descrição das tools para o prompt
  private generateToolsDescription(tools: Tool[]): string {
    if (tools.length === 0) {
      return "Nenhuma ferramenta disponível.";
    }
    
    return tools.map(tool => 
      `${tool.name}: ${tool.description}${tool.parameters ? 
        ` Parâmetros: ${this.getToolParametersDescription(tool.parameters)}` : ''}`
    ).join('\n');
  }
  
  // Método para obter descrição dos parâmetros da tool
  private getToolParametersDescription(parameters: any): string {
    // Se for um schema do Valibot, retornar uma descrição genérica
    if (parameters && typeof parameters === 'object' && 'type' in parameters) {
      return "Schema validado com Valibot";
    }
    
    // Se for ToolParameters, extrair propriedades
    if (parameters && parameters.properties) {
      return JSON.stringify(parameters.properties);
    }
    
    return "Parâmetros desconhecidos";
  }
  
// Método para gerar prompt ReAct
  private generateReActPrompt(
    task: string, 
    toolsDescription: string, 
    steps: ReActStep[],
    history: ChatMessage[]
  ): string {
    // Usar PromptBuilder para gerar o prompt
    const promptBuilder = new PromptBuilder();
    return promptBuilder.buildReActPrompt(task, toolsDescription, steps, history);
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
      const planningResponse = await this.callProviderFunction(planningPrompt, dynamicConfig);
      
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
      const finalResponse = await this.callProviderFunction(synthesisPrompt, dynamicConfig);
      
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
    // Obter instruções do sistema do histórico, se existirem
    const systemMessage = history.find(msg => msg.role === 'system');
    const systemInstructions = systemMessage ? 
      `System Instructions: ${systemMessage.content}\n\n` : '';
    
    return `${systemInstructions}Você é um assistente avançado com capacidades de thinking (raciocínio profundo). Sua tarefa é decompor a solicitação do usuário em subtasks menores e executáveis, usando um processo de pensamento analítico profundo.

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
      // Validar parâmetros usando Valibot
      const validatedArgs = this.toolRegistry.validateParameters(toolName, args);

      // Executar tool com timeout
      const timeout = 30000; // 30 segundos
      const result = await Promise.race([
        tool.execute(validatedArgs),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na execução da tool')), timeout)
        )
      ]);

      return result;
    } catch (error: any) {
      throw new Error(`Erro ao executar tool '${toolName}': ${error.message}`);
    }
  }
}

export { ChatAgent, type AgentConfig, type ProviderType };