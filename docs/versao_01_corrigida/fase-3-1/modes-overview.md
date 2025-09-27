# Visão Geral dos Modos de Operação

O agente suporta diferentes modos de operação para lidar com diferentes tipos de tarefas e complexidades.

## 1. Modo Chat (Padrão)

O modo chat é o modo padrão do agente, adequado para interações diretas e conversacionais simples.

### Características:
- Interações diretas com o modelo
- Uso de histórico de conversa para contexto
- Respostas imediatas sem etapas intermediárias

### Quando usar:
- Perguntas e respostas simples
- Conversas diretas
- Tarefas que não requerem ferramentas externas

### Exemplo:
```typescript
const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil.",
  provider: "openai-generic"
  // mode: "chat" (padrão, pode ser omitido)
});
```

## 2. Modo ReAct (Reasoning + Action)

O modo ReAct implementa o framework Reasoning + Action, onde o agente pensa (reasoning) e age (action) em ciclos para resolver tarefas complexas.

### Características:
- Ciclo de pensamento e ação
- Uso de tools/ferramentas registradas
- Raciocínio passo a passo
- Até 10 passos por tarefa

### Quando usar:
- Tarefas que requerem uso de ferramentas
- Problemas que precisam de etapas intermediárias
- Cálculos e consultas a dados externos

### Exemplo:
```typescript
const agent = new ChatAgent({
  name: "Assistente ReAct",
  instructions: "Você é um assistente que usa o framework ReAct.",
  provider: "openai-generic",
  mode: "react"
});

// Registrar tools necessárias
agent.registerTool(calculatorTool);
agent.registerTool(dateTimeTool);
```

## 3. Modo Planning

O modo Planning é projetado para tarefas complexas que requerem planejamento hierárquico e decomposição em subtasks.

### Características:
- Planejamento de tarefas complexas
- Decomposição em subtasks
- Execução sequencial com dependências
- Síntese de resultados

### Quando usar:
- Tarefas complexas e multifacetadas
- Projetos que requerem planejamento
- Tarefas com múltiplas dependências

### Exemplo:
```typescript
const agent = new ChatAgent({
  name: "Assistente Planning",
  instructions: "Você é um assistente que usa o modo Planning.",
  provider: "openai-generic",
  mode: "planning"
});

// Registrar tools necessárias
agent.registerTool(calculatorTool);
agent.registerTool(weatherTool);
```

## Comparação entre Modos

| Característica | Chat | ReAct | Planning |
|----------------|------|-------|----------|
| Complexidade | Baixa | Média | Alta |
| Uso de Tools | Não | Sim | Sim |
| Etapas | 1 | Múltiplas | Múltiplas |
| Planejamento | Não | Sim | Sim |
| Dependências | Não | Sim | Sim |

## Escolhendo o Modo Certo

- Use **Chat** para interações simples e diretas
- Use **ReAct** para tarefas que requerem raciocínio e uso de ferramentas
- Use **Planning** para tarefas complexas que requerem decomposição e planejamento