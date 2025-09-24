// src/memory-manager.ts
// Gerenciador de memória de contexto para o agente

// Interface para mensagens de chat
interface ChatMessage {
  role: string;
  content: string;
}

// Interface para estratégias de gerenciamento de memória
interface ContextMemoryStrategy {
  addMessage(message: ChatMessage): void;
  getContext(): ChatMessage[];
  clear(): void;
  replaceMessages(messages: ChatMessage[]): void;
}

// Estratégia de janela de contexto fixa
class FixedWindowMemory implements ContextMemoryStrategy {
  private messages: ChatMessage[] = [];
  private windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    if (this.messages.length > this.windowSize) {
      this.messages.shift(); // Remove a mensagem mais antiga
    }
  }

  getContext(): ChatMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  replaceMessages(messages: ChatMessage[]): void {
    this.messages = [...messages];
    // Garantir que não ultrapasse o tamanho da janela
    while (this.messages.length > this.windowSize) {
      this.messages.shift();
    }
  }
}

// Estratégia de janela de contexto dinâmica
class DynamicWindowMemory implements ContextMemoryStrategy {
  private messages: ChatMessage[] = [];
  private maxTokens: number;
  private tokenizer: SimpleTokenizer;

  constructor(maxTokens: number = 4096) {
    this.maxTokens = maxTokens;
    this.tokenizer = new SimpleTokenizer();
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.pruneToFit();
  }

  private pruneToFit(): void {
    while (this.getTokenCount() > this.maxTokens && this.messages.length > 1) {
      this.messages.shift();
    }
  }

  private getTokenCount(): number {
    return this.messages.reduce((total, msg) => 
      total + this.tokenizer.countTokens(msg.content), 0);
  }

  getContext(): ChatMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  replaceMessages(messages: ChatMessage[]): void {
    this.messages = [...messages];
    this.pruneToFit();
  }
}

// Tokenizer simples para contagem de tokens
class SimpleTokenizer {
  countTokens(text: string): number {
    // Implementação simples: aproximadamente 4 caracteres por token
    return Math.ceil(text.length / 4);
  }
}

// Sistema de variáveis de contexto
class ContextVariables {
  private variables: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.variables.set(key, value);
  }

  get(key: string): any {
    return this.variables.get(key);
  }

  has(key: string): boolean {
    return this.variables.has(key);
  }

  delete(key: string): boolean {
    return this.variables.delete(key);
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.variables) {
      result[key] = value;
    }
    return result;
  }

  clear(): void {
    this.variables.clear();
  }
}

// Classe principal do gerenciador de memória
class MemoryManager {
  private contextMemory: ContextMemoryStrategy;
  private contextVariables: ContextVariables;

  constructor(
    contextMemory: ContextMemoryStrategy = new DynamicWindowMemory()
  ) {
    this.contextMemory = contextMemory;
    this.contextVariables = new ContextVariables();
  }

  // Gerenciamento de mensagens
  addMessage(message: ChatMessage): void {
    this.contextMemory.addMessage(message);
  }

  getMessages(): ChatMessage[] {
    return this.contextMemory.getContext();
  }

  // Gerenciamento de variáveis
  setVariable(key: string, value: any): void {
    this.contextVariables.set(key, value);
  }

  getVariable(key: string): any {
    return this.contextVariables.get(key);
  }

  getAllVariables(): Record<string, any> {
    return this.contextVariables.getAll();
  }

  hasVariable(key: string): boolean {
    return this.contextVariables.has(key);
  }

  deleteVariable(key: string): boolean {
    return this.contextVariables.delete(key);
  }

  // Limpeza
  clear(): void {
    this.contextMemory.clear();
    this.contextVariables.clear();
  }

  // Serialização para persistência
  serialize(): string {
    return JSON.stringify({
      messages: this.contextMemory.getContext(),
      variables: this.contextVariables.getAll()
    });
  }

  // Desserialização
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.contextMemory.replaceMessages(parsed.messages || []);
    Object.entries(parsed.variables || {}).forEach(([key, value]) => {
      this.contextVariables.set(key, value);
    });
  }
}

export { 
  MemoryManager, 
  type ContextMemoryStrategy, 
  FixedWindowMemory, 
  DynamicWindowMemory,
  ContextVariables
};