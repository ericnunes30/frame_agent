import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/adapters/provider-adapter';

// Função mock para simular o provedor
async function mockProviderFunction(message: string): Promise<string> {
  // Simular diferentes respostas do LLM com base na mensagem
  if (message.includes('looping_tool')) {
    // Simular que o LLM continua executando a mesma ferramenta com o mesmo input, causando loop
    return `Thought: Vou executar a ferramenta novamente
Action: looping_tool
Action Input: {"input": "teste_loop"}`;
  } else if (message.includes('ReAct') && message.includes('ATENÇÃO')) {
    // Simular que o LLM responde após receber aviso de loop
    return `Thought: Recebi aviso de loop, vou tentar uma abordagem diferente
Action: mock_tool
Action Input: {"input": "nova_abordagem"}`;
  } else {
    // Simular uma resposta inicial do LLM no formato ReAct
    return `Thought: Preciso testar o mecanismo de detecção de loops
Action: looping_tool
Action Input: {"input": "teste_loop"}`;
  }
}

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

async function testReActLoopDetectionWithMock() {
  console.log('=== Teste de detecção de loop no modo ReAct (com mock) ===\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Test Agent',
    instructions: 'Você é um assistente para testar detecção de loops.',
    mode: 'react'
  });
  
  // Registrar as ferramentas
  agent.registerTool(mockTool);
  agent.registerTool(loopingTool);
  
  // Substituir a função de chamada ao provedor por uma função mock
  // Isso simula o comportamento do LLM que entra em loop
  const originalCallProvider = (agent as any).callProviderFunction;
  (agent as any).callProviderFunction = async (message: string) => {
    console.log(`[MOCK] Mensagem para LLM: ${message.substring(0, 100)}...`);
    return mockProviderFunction(message);
  };
  
  // Simular uma tarefa que poderia causar loop
  console.log('Iniciando teste de detecção de loop...\n');
  
  try {
    // Enviar mensagem que pode levar a um loop
    const response = await agent.sendMessage('Por favor, execute a ferramenta looping_tool com input "teste_loop"');
    console.log('\nResposta final do agente:', response);
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
  
  console.log('\n=== Teste concluído ===');
}

// Executar o teste
testReActLoopDetectionWithMock().catch(console.error);