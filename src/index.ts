// src/index.ts - Ponto de entrada principal do SDK

export { ChatAgent } from './chat-agent-core';
export type { AgentConfig, ProviderType } from './chat-agent-core';
export type { ChatMessage } from '../baml_client/types';
export type { Tool, ToolParameter, ToolParameters } from './tools';
export { ToolRegistry } from './tools';
export { 
  MemoryManager, 
  FixedWindowMemory, 
  DynamicWindowMemory,
  ContextVariables 
} from './memory-manager';

// Re-export BAML client for convenience
export { b } from '../baml_client';