# Documentação de Configuração Dinâmica

## Visão Geral

A configuração dinâmica permite ajustar os parâmetros do modelo LLM em tempo de execução, como temperatura, topP, maxTokens, etc. Isso proporciona maior flexibilidade e controle sobre o comportamento do agente durante diferentes tipos de interações.

## Interface de Configuração

### AgentConfig

Configuração estática do agente:

```typescript
interface AgentConfig {
  name: string;
  instructions: string;
  provider: ProviderType;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}
```

### DynamicConfig

Configuração dinâmica por chamada:

```typescript
interface DynamicConfig {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}
```

## Parâmetros Configuráveis

### temperature

Controla a aleatoriedade da saída do modelo. Valores entre 0 e 2.
- 0: Saída mais determinística
- 1: Comportamento padrão
- 2: Saída mais aleatória

### topP

Controla a diversidade da saída usando nucleus sampling. Valores entre 0 e 1.
- 0: Mais restritivo
- 1: Menos restritivo

### maxTokens

Limite máximo de tokens na resposta do modelo.

### presencePenalty

Penalidade por repetição de tokens já presentes na resposta. Valores entre -2 e 2.

### frequencyPenalty

Penalidade por frequência de tokens na resposta. Valores entre -2 e 2.

## Uso

### Configuração Estática

```typescript
const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000
});
```

### Atualização de Configuração

```typescript
agent.setConfig({
  temperature: 0.9,
  maxTokens: 1500
});

console.log(agent.getConfig());
```

### Configuração Dinâmica por Chamada

```typescript
// Enviar mensagem com configuração específica
const response = await agent.sendMessage(
  'Escreva uma história criativa', 
  { 
    temperature: 1.2, 
    maxTokens: 200 
  }
);
```

## Exemplo Completo

```typescript
import { ChatAgent } from './chat-agent-core';

// Criar agente com configuração padrão
const agent = new ChatAgent({
  name: "Assistente Criativo",
  instructions: "Você é um assistente criativo e imaginativo",
  provider: "openai-gpt-4o-mini",
  temperature: 0.7
});

// Atualizar configuração para respostas mais determinísticas
agent.setConfig({
  temperature: 0.3,
  maxTokens: 500
});

// Enviar mensagem com configuração específica para criatividade
const creativeResponse = await agent.sendMessage(
  'Escreva um poema sobre tecnologia', 
  { 
    temperature: 1.0, 
    maxTokens: 300 
  }
);

// Enviar mensagem com configuração padrão atualizada
const factualResponse = await agent.sendMessage(
  'Qual é a capital do Brasil?'
);
```

## Considerações

1. Nem todos os provedores suportam todos os parâmetros
2. Os valores padrão variam por provedor
3. A configuração dinâmica tem precedência sobre a estática
4. Alguns parâmetros podem não ser suportados por todas as funções BAML