// tests/instructions-unit-test.ts
// Teste unitário para verificar se as instruções estão sendo processadas corretamente

import { ChatAgent } from '../../src/core/chat-agent-core';
import { PromptBuilder } from '../../src/core/prompt-builder';

describe('Instructions Processing', () => {
  test('should add instructions as system message to memory', () => {
    const agent = new ChatAgent({
      name: "Test Agent",
      instructions: "Você é um assistente especializado em testes.",
      provider: "openai-generic",
      mode: "chat"
    });
    
    const history = agent.getHistory();
    const systemMessage = history.find(msg => msg.role === 'system');
    
    expect(systemMessage).toBeDefined();
    expect(systemMessage?.content).toBe("Você é um assistente especializado em testes.");
  });
  
  test('should include system instructions in ReAct prompt', () => {
    const promptBuilder = new PromptBuilder();
    const task = "Test task";
    const toolsDescription = "test_tool: Test tool description";
    const steps: any[] = [];
    const history = [
      { role: 'system', content: 'Você é um assistente especializado em testes.' },
      { role: 'user', content: 'Test task' }
    ];
    
    const prompt = promptBuilder.buildReActPrompt(task, toolsDescription, steps, history);
    
    // Verificar se as instruções do sistema estão incluídas no prompt
    expect(prompt).toContain('System Instructions: Você é um assistente especializado em testes.');
  });
  
  test('should work without system instructions in ReAct prompt', () => {
    const promptBuilder = new PromptBuilder();
    const task = "Test task";
    const toolsDescription = "test_tool: Test tool description";
    const steps: any[] = [];
    const history = [
      { role: 'user', content: 'Test task' }
    ];
    
    const prompt = promptBuilder.buildReActPrompt(task, toolsDescription, steps, history);
    
    // Verificar que o prompt ainda é gerado mesmo sem instruções do sistema
    expect(prompt).toContain('You are an intelligent agent designed to solve user tasks');
  });
});