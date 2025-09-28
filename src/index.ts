// src/index.ts - Ponto de entrada principal do SDK

export { ChatAgent } from './core/chat-agent-core';
export { HybridAgent } from './core/hybrid-agent-core';
export { OpenAIAdapter } from './adapters/openai-adapter';
export { AnthropicAdapter } from './adapters/anthropic-adapter';
export type { AgentConfig, ProviderType } from './core/chat-agent-core';
export type { Tool, ToolParameter, ToolParameters } from './tools/tools';
export { ToolRegistry } from './tools/tools';
export { 
  MemoryManager, 
  FixedWindowMemory, 
  DynamicWindowMemory,
  ContextVariables 
} from './memory/memory-manager';