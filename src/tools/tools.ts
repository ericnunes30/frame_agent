// src/tools.ts
// Interfaces e tipos para o sistema de tools
import * as v from 'valibot';

// Interface para parâmetros de tools usando Valibot
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
  parameters?: v.GenericSchema | ToolParameters;
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

  // Método para validar parâmetros usando Valibot
  validateParameters(toolName: string, args: any): any {
    const tool = this.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' não encontrada`);
    }

    // Verificar se parameters é um schema do Valibot
    if (tool.parameters && typeof tool.parameters === 'object' && 'type' in tool.parameters) {
      try {
        // @ts-ignore - Ignorar erro de tipagem temporariamente
        return v.parse(tool.parameters, args);
      } catch (error: any) {
        throw new Error(`Validação falhou para tool '${toolName}': ${error.message}`);
      }
    }

    return args;
  }
}

export { type Tool, type ToolParameter, type ToolParameters, ToolRegistry };