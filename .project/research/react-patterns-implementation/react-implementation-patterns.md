# Padrões de Implementação do Modo ReAct (Reasoning + Action) em Agentes de IA

## 1. Estrutura Básica do Ciclo Pensamento-Ação-Observação

O padrão ReAct (Reasoning + Action) segue uma estrutura cíclica fundamental que permite aos agentes alternar entre raciocínio interno e interações com o ambiente externo:

### Ciclo Básico ReAct:
```
[Thought] → [Action] → [Observation] → [Thought] → [Action] → [Observation] → ... → [Final Answer]
```

### Componentes do Ciclo:

1. **Thought (Pensamento)**: 
   - Análise do problema atual
   - Formulação de hipóteses
   - Planejamento da próxima ação
   - Raciocínio baseado no contexto e observações anteriores

2. **Action (Ação)**:
   - Seleção e execução de uma ação específica
   - Interação com ferramentas, APIs ou ambientes externos
   - Chamada a funções/tools registradas

3. **Observation (Observação)**:
   - Resultado da ação executada
   - Dados obtidos de fontes externas
   - Feedback para o próximo ciclo de raciocínio

### Estrutura de Prompt Padrão:
```markdown
Use the following format:

Question: the input question you must answer
Thought: your reasoning about the question and plan
Action: the action to take (e.g., Search[query], Calculate[expression])
Action Input: the input for the action
Observation: the result of the action
... (repeat Thought/Action/Observation as needed)
Thought: I now know the final answer
Final Answer: the final answer to the original question
```

## 2. Formatos de Prompt para o Modo ReAct

### Prompt Básico para ReAct:
```markdown
Solve the following task using the ReAct framework. Think step by step, and when you need to gather information or perform calculations, use the available tools.

Available tools:
{{tools_list}}

Task: {{task}}

Use the following format:
Thought: Your reasoning about what to do next
Action: The tool to use (must be one of: {{tools_names}})
Action Input: The input to the tool
Observation: The result of the tool execution
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I now know the final answer
Final Answer: The complete answer to the original task
```

### Prompt com Exemplos Few-Shot:
```markdown
Solve tasks using the ReAct framework. Here are examples of how to approach different types of tasks:

Example 1:
Question: What is the population of the capital of France raised to the power of 2?
Thought: I need to find the capital of France, then its population, then calculate that number to the power of 2.
Action: Search[capital of France]
Action Input: capital of France
Observation: The capital of France is Paris.
Thought: Now I need to find the population of Paris.
Action: Search[population of Paris]
Action Input: population of Paris
Observation: The population of Paris is approximately 2.161 million.
Thought: Now I need to calculate 2.161 million to the power of 2.
Action: Calculate[2161000^2]
Action Input: 2161000^2
Observation: 4669921000000
Thought: I now know the final answer
Final Answer: The population of the capital of France (Paris) raised to the power of 2 is 4,669,921,000,000.

Now solve this task:
Question: {{task}}
```

## 3. Exemplos de Como Separar Raciocínio de Ações

### Padrão de Separação Clara:

```typescript
// Estrutura de resposta ReAct
interface ReActStep {
  thought: string;
  action?: {
    name: string;
    input: any;
  };
  observation?: any;
}

// Exemplo de processo ReAct
const reactProcess: ReActStep[] = [
  {
    thought: "I need to find the current weather in São Paulo to answer the question.",
    action: {
      name: "get_weather",
      input: { location: "São Paulo" }
    }
  },
  {
    thought: "I've obtained the weather information. Now I can provide a complete answer.",
    observation: {
      location: "São Paulo",
      condition: "Partially cloudy",
      temperature: 22,
      unit: "Celsius"
    }
  }
];
```

### Estratégias de Separação:

1. **Tags Explícitas no Prompt**:
   ```markdown
   [THOUGHT] Analyze what information is needed
   [ACTION] Call the appropriate tool
   [OBSERVATION] Process the tool result
   ```

2. **Estruturas JSON no Prompt**:
   ```json
   {
     "thought": "Reasoning about the next step",
     "action": {
       "tool": "tool_name",
       "parameters": {"param1": "value1"}
     }
   }
   ```

3. **Blocos de Código Separados**:
   ```markdown
   Thought:
   First, I need to determine what information is required.

   Action:
   get_weather(location="São Paulo")

   Observation:
   {"temperature": 22, "condition": "Partially cloudy"}
   ```

## 4. Padrões para Tratamento de Observações

### Padrões de Processamento de Observações:

1. **Validação de Observações**:
   ```typescript
   function validateObservation(observation: any): boolean {
     // Verificar se a observação contém dados válidos
     return observation !== null && 
            observation !== undefined && 
            Object.keys(observation).length > 0;
   }
   ```

2. **Tratamento de Erros em Observações**:
   ```typescript
   function handleObservationError(error: any): ReActStep {
     return {
       thought: `The previous action failed with error: ${error.message}. I should try a different approach or ask for clarification.`,
       action: undefined,
       observation: undefined
     };
   }
   ```

3. **Agregação de Múltiplas Observações**:
   ```typescript
   class ObservationManager {
     private observations: any[] = [];
     
     addObservation(obs: any): void {
       this.observations.push(obs);
     }
     
     getConsolidatedObservation(): any {
       // Consolidar múltiplas observações em uma visão unificada
       return this.observations.reduce((acc, obs) => ({...acc, ...obs}), {});
     }
   }
   ```

### Padrões de Resposta a Observações:

1. **Confirmação de Dados**:
   ```markdown
   Thought: The observation provides the needed information. I should verify it makes sense before proceeding.
   ```

2. **Solicitação de Informações Adicionais**:
   ```markdown
   Thought: The observation is incomplete. I need to gather more information.
   ```

3. **Detecção de Contradições**:
   ```markdown
   Thought: This observation contradicts previous information. I should investigate further.
   ```

## 5. Integração com Ferramentas/Tools Existentes

### Estrutura de Integração com Tools:

```typescript
// Interface para execução de tools no contexto ReAct
interface ReActToolExecutor {
  executeTool(toolName: string, toolInput: any): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

// Implementação do executor de tools
class ToolExecutor implements ReActToolExecutor {
  private toolRegistry: ToolRegistry;
  
  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }
  
  async executeTool(toolName: string, toolInput: any): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      const tool = this.toolRegistry.get(toolName);
      if (!tool) {
        return {
          success: false,
          error: `Tool '${toolName}' not found`
        };
      }
      
      const result = await tool.execute(toolInput);
      return {
        success: true,
        result: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}
```

### Mapeamento de Tools para Prompt:

```typescript
// Função para gerar descrição de tools para o prompt
function generateToolsDescription(tools: Tool[]): string {
  return tools.map(tool => 
    `${tool.name}: ${tool.description}${tool.parameters ? 
      ` Parameters: ${JSON.stringify(tool.parameters.properties)}` : ''}`
  ).join('\n');
}
```

### Exemplo de Integração Completa:

```typescript
// Processo ReAct completo
async function executeReActProcess(
  task: string, 
  toolRegistry: ToolRegistry,
  maxSteps: number = 10
): Promise<string> {
  const toolExecutor = new ToolExecutor(toolRegistry);
  const steps: ReActStep[] = [];
  
  for (let i = 0; i < maxSteps; i++) {
    // 1. Gerar próximo passo (Thought + Action)
    const step = await generateNextStep(task, steps);
    
    // 2. Executar ação se houver
    if (step.action) {
      const executionResult = await toolExecutor.executeTool(
        step.action.name, 
        step.action.input
      );
      
      if (executionResult.success) {
        step.observation = executionResult.result;
      } else {
        step.observation = { error: executionResult.error };
      }
    }
    
    steps.push(step);
    
    // 3. Verificar se chegamos à resposta final
    if (step.thought.includes("final answer")) {
      return extractFinalAnswer(steps);
    }
  }
  
  return "Maximum steps reached without finding an answer.";
}
```

## 6. Considerações Específicas para Implementação no Código Atual

### Estrutura de Dados ReAct:

```typescript
// Interface para representar um passo ReAct
interface ReActStep {
  stepNumber: number;
  thought: string;
  action?: {
    name: string;
    input: any;
  };
  observation?: any;
  timestamp: Date;
}

// Interface para o processo ReAct completo
interface ReActProcess {
  taskId: string;
  taskDescription: string;
  steps: ReActStep[];
  finalAnswer?: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}
```

### Integração com o Sistema de Memória:

```typescript
// Extensão do MemoryManager para suportar ReAct
class ReActMemoryManager extends MemoryManager {
  private reactProcesses: Map<string, ReActProcess> = new Map();
  
  // Armazenar processo ReAct
  storeReActProcess(processId: string, process: ReActProcess): void {
    this.reactProcesses.set(processId, process);
  }
  
  // Recuperar processo ReAct
  getReActProcess(processId: string): ReActProcess | undefined {
    return this.reactProcesses.get(processId);
  }
  
  // Obter histórico de passos ReAct
  getReActHistory(processId: string): ReActStep[] {
    const process = this.reactProcesses.get(processId);
    return process ? process.steps : [];
  }
}
```

### Implementação do Método executeReactMode:

Com base na análise do código existente, o método `executeReactMode` na classe `ChatAgent` poderia ser implementado da seguinte forma:

```typescript
// Método para executar o modo ReAct
private async executeReactMode(message: string, dynamicConfig?: DynamicConfig): Promise<string> {
  // Inicializar processo ReAct
  const processId = `react_${Date.now()}`;
  const reactProcess: ReActProcess = {
    taskId: processId,
    taskDescription: message,
    steps: [],
    status: 'running',
    startTime: new Date()
  };
  
  // Obter tools registradas
  const availableTools = this.toolRegistry.list();
  
  // Gerar prompt ReAct com contexto e tools
  const reactPrompt = this.generateReActPrompt(message, availableTools, this.memoryManager.getMessages());
  
  try {
    // Executar ciclo ReAct
    for (let step = 0; step < 10; step++) { // Limite máximo de passos
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
        
        // Atualizar prompt com nova observação
        reactPrompt = this.updateReActPromptWithObservation(reactPrompt, reactStep);
      }
      
      // Verificar se é a resposta final
      if (parsedResponse.isFinalAnswer) {
        reactProcess.finalAnswer = parsedResponse.finalAnswer;
        reactProcess.status = 'completed';
        reactProcess.endTime = new Date();
        break;
      }
    }
    
    // Armazenar processo na memória
    this.memoryManager.setVariable(`react_process_${processId}`, reactProcess);
    
    return reactProcess.finalAnswer || "Could not determine final answer.";
    
  } catch (error) {
    reactProcess.status = 'failed';
    reactProcess.endTime = new Date();
    this.memoryManager.setVariable(`react_process_${processId}`, reactProcess);
    throw error;
  }
}
```

## 7. Melhores Práticas e Considerações de Implementação

### 1. Controle de Complexidade:
- Limitar o número de passos ReAct para evitar loops infinitos
- Implementar mecanismos de detecção de loops
- Estabelecer timeouts para execução de tools

### 2. Tratamento de Erros:
- Implementar estratégias de recuperação de erros em tools
- Fornecer feedback claro quando uma ação falhar
- Permitir que o modelo "replaneje" após falhas

### 3. Otimização de Contexto:
- Usar o DynamicWindowMemory para gerenciar o tamanho do contexto
- Incluir apenas informações relevantes nas observações
- Resumir passos anteriores quando necessário

### 4. Monitoramento e Debug:
- Registrar cada passo do processo ReAct
- Permitir inspeção de processos em andamento
- Fornecer métricas de desempenho

### 5. Segurança:
- Validar entradas para tools
- Implementar rate limiting para chamadas externas
- Sanitizar dados sensíveis nas observações