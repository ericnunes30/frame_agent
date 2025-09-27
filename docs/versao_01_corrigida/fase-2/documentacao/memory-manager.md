# Documentação do Gerenciador de Memória

## Visão Geral

O gerenciador de memória (`MemoryManager`) é responsável por gerenciar o contexto das conversas, incluindo o histórico de mensagens e variáveis de contexto. Ele permite que os agentes mantenham informações relevantes entre interações e gerenciem eficientemente o uso de tokens.

## Componentes

### ContextMemoryStrategy

Interface para estratégias de gerenciamento de memória de contexto.

```typescript
interface ContextMemoryStrategy {
  addMessage(message: ChatMessage): void;
  getContext(): ChatMessage[];
  clear(): void;
  replaceMessages(messages: ChatMessage[]): void;
}
```

### FixedWindowMemory

Estratégia de janela de contexto fixa que mantém um número máximo de mensagens.

```typescript
class FixedWindowMemory implements ContextMemoryStrategy {
  constructor(windowSize: number = 10)
}
```

### DynamicWindowMemory

Estratégia de janela de contexto dinâmica que mantém um número máximo de tokens.

```typescript
class DynamicWindowMemory implements ContextMemoryStrategy {
  constructor(maxTokens: number = 4096)
}
```

### ContextVariables

Sistema de variáveis de contexto para armazenar informações persistentes.

```typescript
class ContextVariables {
  set(key: string, value: any): void;
  get(key: string): any;
  has(key: string): boolean;
  delete(key: string): boolean;
  getAll(): Record<string, any>;
  clear(): void;
}
```

## MemoryManager

Classe principal do gerenciador de memória.

### Construtor

```typescript
constructor(contextMemory: ContextMemoryStrategy = new DynamicWindowMemory())
```

### Métodos

- `addMessage(message: ChatMessage)`: Adiciona uma mensagem ao histórico
- `getMessages(): ChatMessage[]`: Obtém todas as mensagens do histórico
- `setVariable(key: string, value: any)`: Define uma variável de contexto
- `getVariable(key: string): any`: Obtém uma variável de contexto
- `getAllVariables(): Record<string, any>`: Obtém todas as variáveis de contexto
- `hasVariable(key: string): boolean`: Verifica se uma variável existe
- `deleteVariable(key: string): boolean`: Remove uma variável
- `clear()`: Limpa todo o contexto
- `serialize(): string`: Serializa o contexto para string
- `deserialize(data: string)`: Desserializa o contexto de string

## Uso

```typescript
import { ChatAgent } from './chat-agent-core';

const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-gpt-4o-mini"
});

// Definir variáveis de contexto
agent.setContextVariable('user_name', 'João');
agent.setContextVariable('user_age', 30);

// Obter variáveis de contexto
console.log(agent.getContextVariable('user_name'));
console.log(agent.getAllContextVariables());

// O histórico de mensagens é gerenciado automaticamente
await agent.sendMessage('Olá, qual é o seu nome?');
await agent.sendMessage('Como você está hoje?');

const history = agent.getHistory();
console.log(history);

// Limpar contexto
agent.reset();
```

## Estratégias de Gerenciamento

### Janela Fixa

Mantém um número fixo de mensagens no histórico, removendo as mais antigas quando o limite é atingido.

### Janela Dinâmica

Mantém mensagens até que o limite de tokens seja atingido, removendo as mais antigas conforme necessário.

## Serialização

O contexto pode ser serializado e desserializado para persistência:

```typescript
// Serializar
const serialized = agent.memoryManager.serialize();

// Desserializar
agent.memoryManager.deserialize(serialized);
```