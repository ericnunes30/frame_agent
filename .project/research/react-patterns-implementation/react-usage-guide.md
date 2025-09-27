# Guia de Uso do Modo ReAct

## Visão Geral

O modo ReAct (Reasoning + Action) permite que o agente combine raciocínio verbal com ações específicas de tarefas, alternando entre pensar sobre o problema e executar ações usando ferramentas disponíveis.

## Como Funciona

O modo ReAct implementa o ciclo Thought-Action-Observation:

1. **Thought**: O modelo analisa a tarefa e planeja a próxima ação
2. **Action**: O modelo seleciona e executa uma ferramenta disponível
3. **Observation**: O resultado da ação é observado e usado para o próximo raciocínio
4. O ciclo continua até que o modelo determine ter encontrado a resposta final

## Configuração do Agente ReAct

```typescript
import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool } from './example-tools';

// Criar agente com modo ReAct
const agent = new ChatAgent({
  name: "Assistente ReAct",
  instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
  provider: "openai-generic", // Ou qualquer outro provider suportado
  mode: "react" // Ativa o modo ReAct
});

// Registrar ferramentas disponíveis
agent.registerTool(calculatorTool);
agent.registerTool(dateTimeTool);
```

## Tools Suportadas

O modo ReAct trabalha com o sistema de tools existente. Cada tool deve implementar a interface `Tool`:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameters;
  execute: (args: any) => Promise<any>;
}
```

### Exemplo de Tool:

```typescript
const calculatorTool: Tool = {
  name: "calculate",
  description: "Realiza operações matemáticas básicas",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Expressão matemática para calcular (ex: '2 + 2 * 3')"
      }
    },
    required: ["expression"]
  },
  execute: async (args: { expression: string }) => {
    try {
      const result = eval(args.expression); // Em produção, usar parser seguro
      return { result: Number(result.toFixed(2)) };
    } catch (error) {
      throw new Error(`Não foi possível calcular: ${args.expression}`);
    }
  }
};
```

## Uso Básico

```typescript
// Enviar uma tarefa para o agente ReAct
const response = await agent.sendMessage(
  "Qual é a hora atual? Some 100 a essa hora e me diga o resultado."
);

console.log(response);
```

## Estrutura de Resposta ReAct

O processo ReAct é armazenado na memória do agente e pode ser acessado:

```typescript
// Acessar o processo ReAct mais recente
const processId = agent.getContextVariable('last_react_process_id');
const reactProcess = agent.getContextVariable(`react_process_${processId}`);

console.log('Status do processo:', reactProcess.status);
console.log('Número de passos:', reactProcess.steps.length);

// Visualizar passos individuais
reactProcess.steps.forEach(step => {
  console.log(`Passo ${step.stepNumber}:`);
  console.log(`  Thought: ${step.thought}`);
  if (step.action) {
    console.log(`  Action: ${step.action.name}(${JSON.stringify(step.action.input)})`);
  }
  if (step.observation) {
    console.log(`  Observation: ${JSON.stringify(step.observation)}`);
  }
});
```

## Limitações e Considerações

1. **Limite de Passos**: O modo ReAct está configurado para um máximo de 10 passos para evitar loops infinitos
2. **Parsing de Respostas**: A implementação atual usa uma abordagem simplificada para parsear as respostas do modelo
3. **Tratamento de Erros**: Erros em tools são capturados e incluídos como observações no processo
4. **Performance**: Cada passo ReAct requer uma chamada ao LLM, o que pode impactar a performance

## Melhorias Futuras

1. **Parsing Robusto**: Implementar parsing mais robusto usando expressões regulares ou bibliotecas especializadas
2. **Detecção de Loops**: Adicionar mecanismos para detectar e interromper loops de raciocínio
3. **Resumo de Contexto**: Implementar resumo automático de passos antigos para gerenciar o tamanho do contexto
4. **Visualização**: Criar interfaces para visualizar o processo ReAct em tempo real
5. **Controle de Complexidade**: Adicionar métricas para monitorar a complexidade dos processos ReAct

## Exemplo Completo

```typescript
import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool } from './example-tools';

async function exemploReAct() {
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct.",
    provider: "openai-generic",
    mode: "react"
  });

  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);

  const resposta = await agent.sendMessage(
    "Qual é a hora atual? Some 100 a essa hora e me diga o resultado."
  );
  
  console.log('Resposta final:', resposta);
  
  // Acessar detalhes do processo ReAct
  const history = agent.getHistory();
  console.log('Histórico de mensagens:', history.length);
}
```

Com esta implementação, o agente pode resolver tarefas complexas que requerem múltiplas etapas de raciocínio e interação com ferramentas externas, proporcionando maior confiabilidade e interpretabilidade nas respostas.