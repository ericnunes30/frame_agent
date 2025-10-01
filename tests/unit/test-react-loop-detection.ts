import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/adapters/provider-adapter';

// Tool simulada para testes
const mockTool: Tool = {
  name: 'mock_tool',
  description: 'A mock tool for testing',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  execute: async (args: any) => {
    console.log(`Executando mock_tool com input: ${args.input}`);
    return `Resultado: ${args.input}`;
  }
};

// Tool que simula um loop infinito
const loopingTool: Tool = {
  name: 'looping_tool',
  description: 'A tool that causes infinite loops',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  execute: async (args: any) => {
    console.log(`Executando looping_tool com input: ${args.input}`);
    return `Resultado: ${args.input}`;
  }
};

async function testReActLoopDetection() {
  console.log('=== Teste de detecção de loop no modo ReAct ===\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Test Agent',
    instructions: 'Você é um assistente para testar detecção de loops.',
    mode: 'react'
  });
  
  // Registrar as ferramentas
  agent.registerTool(mockTool);
  agent.registerTool(loopingTool);
  
  // Simular uma tarefa que poderia causar loop
  console.log('Iniciando teste de detecção de loop...\n');
  
  try {
    // Enviar mensagem que pode levar a um loop
    const response = await agent.sendMessage('Por favor, execute a ferramenta looping_tool com o mesmo input três vezes consecutivas: {"input": "teste_loop"}');
    console.log('\nResposta final do agente:', response);
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
  
  console.log('\n=== Teste concluído ===');
}

// Executar o teste
testReActLoopDetection().catch(console.error);