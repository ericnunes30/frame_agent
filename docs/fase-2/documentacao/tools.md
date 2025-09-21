# Documentação do Sistema de Tools

## Visão Geral

O sistema de tools permite que os agentes executem funções específicas durante a interação com o usuário. Cada tool é uma função que pode ser chamada pelo modelo LLM para realizar tarefas específicas, como cálculos matemáticos, obtenção de data/hora, consulta de clima, etc.

## Interface de Tool

```typescript
interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameters;
  execute: (args: any) => Promise<any>;
}
```

### Propriedades

- `name`: Nome único da tool
- `description`: Descrição da tool para o modelo LLM
- `parameters`: Parâmetros esperados pela tool (opcional)
- `execute`: Função assíncrona que executa a tool

## Sistema de Registro de Tools

O `ToolRegistry` é responsável por registrar, listar e gerenciar as tools disponíveis para um agente.

### Métodos

- `register(tool: Tool)`: Registra uma nova tool
- `unregister(name: string)`: Remove uma tool pelo nome
- `get(name: string)`: Obtém uma tool pelo nome
- `list()`: Lista todas as tools registradas
- `has(name: string)`: Verifica se uma tool está registrada
- `clear()`: Remove todas as tools registradas

## Uso

```typescript
import { ChatAgent } from './chat-agent-core';
import { calculatorTool } from './example-tools';

const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-gpt-4o-mini"
});

// Registrar uma tool
agent.registerTool(calculatorTool);

// Listar tools registradas
console.log(agent.listTools());

// Executar uma tool
const result = await agent.executeTool('calculate', { expression: '2 + 2 * 3' });
```

## Exemplos de Tools

### Calculadora

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
      // Em produção, usar um parser seguro em vez de eval
      const result = eval(args.expression);
      return { result: Number(result.toFixed(2)) };
    } catch (error) {
      throw new Error(`Não foi possível calcular: ${args.expression}`);
    }
  }
};
```

### Data e Hora

```typescript
const dateTimeTool: Tool = {
  name: "get_current_datetime",
  description: "Obtém a data e hora atual",
  parameters: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "Fuso horário (ex: 'America/Sao_Paulo')"
      }
    }
  },
  execute: async (args: { timezone?: string }) => {
    const now = new Date();
    return {
      datetime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timezone: args.timezone || 'UTC'
    };
  }
};
```