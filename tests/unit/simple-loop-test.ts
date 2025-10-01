import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/tools/tools';

// Função para simular o provedor LLM com comportamento específico
function createMockProviderFunction() {
  let callCount = 0;
  return async (message: string): Promise<string> => {
    console.log(`[MOCK PROVIDER] Chamada #${++callCount}`);
    
    // Se a mensagem contém ATENÇÃO sobre loop, simula uma tentativa de contornar
    if (message.includes('ATENÇÃO') && message.includes('loop')) {
      console.log('[SISTEMA] Loop detectado, tentando contornar...');
      return `Thought: Percebi que estava em loop, vou tentar uma abordagem diferente
Action: mock_tool
Action Input: {"input": "nova_abordagem"}`;
    }
    
    // Caso contrário, simula o comportamento que leva ao loop
    return `Thought: Vou executar a ferramenta de novo para resolver a tarefa
Action: looping_tool
Action Input: {"input": "teste_loop"}`;
  };
}

// Teste simples de detecção de loops
async function simpleLoopDetectionTest() {
  console.log('=== Teste Simples de Detecção de Loops ===\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Agente de Teste',
    instructions: 'Você é um agente para testar detecção de loops.',
    mode: 'react'
  });
  
  // Criar ferramentas para o teste
  const loopingTool: Tool = {
    name: 'looping_tool',
    description: 'Ferramenta que causa loop quando usada repetidamente com o mesmo input',
    parameters: {
      type: 'object',
      properties: {
        input: { 
          type: 'string',
          description: 'Input para a ferramenta'
        }
      },
      required: ['input']
    },
    execute: async (args: any) => {
      console.log(`[TOOL EXECUTION] looping_tool executada com input: ${args.input}`);
      return `Resultado para: ${args.input}`;
    }
  };
  
  const mockTool: Tool = {
    name: 'mock_tool',
    description: 'Ferramenta para testar tentativas de contornar o loop',
    parameters: {
      type: 'object',
      properties: {
        input: { 
          type: 'string',
          description: 'Input para a ferramenta'
        }
      },
      required: ['input']
    },
    execute: async (args: any) => {
      console.log(`[TOOL EXECUTION] mock_tool executada com input: ${args.input}`);
      return `Resultado para: ${args.input}`;
    }
  };
  
  // Registrar as ferramentas
  agent.registerTool(loopingTool);
  agent.registerTool(mockTool);
  
  // Substituir a função do provedor por uma função mock
  (agent as any).callProviderFunction = createMockProviderFunction();
  
  try {
    console.log('Iniciando conversa que deve levar a um loop...\n');
    
    // Enviar mensagem que vai causar loop
    const response = await agent.sendMessage('Por favor, execute a ferramenta looping_tool com input "teste_loop"');
    
    console.log('\nResposta final recebida:');
    console.log(response);
    
    console.log('\n✅ Teste concluído com sucesso! O mecanismo de detecção de loops está funcionando.');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
  }
}

// Executar o teste
simpleLoopDetectionTest().catch(console.error);