// src/tools.ts
// Interfaces e tipos para o sistema de tools

// Interface para parâmetros de tools
interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: any[];
  items?: ToolParameter; // Para arrays
  properties?: Record<string, ToolParameter>; // Para objetos
}

interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

// Interface principal para tools
interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameters;
  execute: (args: any) => Promise<any>;
}

// Classe para registro e gerenciamento de tools
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' já registrada`);
    }
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  clear(): void {
    this.tools.clear();
  }
}

export { type Tool, type ToolParameter, type ToolParameters, ToolRegistry };