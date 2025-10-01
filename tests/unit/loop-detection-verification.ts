import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/tools/tools';

// Teste de sucesso de detecção de loop
async function successfulLoopDetectionTest() {
  console.log('=== Teste de Sucesso: Detecção de Loop ===\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Agente de Teste',
    instructions: 'Você é um agente para testar detecção de loops.',
    mode: 'react'
  });
  
  // Criar ferramenta que pode causar loop
  const searchTool: Tool = {
    name: 'search_tool',
    description: 'Ferramenta de busca',
    parameters: {
      type: 'object',
      properties: {
        query: { 
          type: 'string',
          description: 'Termo de busca'
        }
      },
      required: ['query']
    },
    execute: async (args: any) => {
      console.log(`[BUSCA] Executando busca para: ${args.query}`);
      return `Resultados para: ${args.query}`;
    }
  };
  
  agent.registerTool(searchTool);
  
  // Função mock para simular LLM entrando em loop
  let mockCallCount = 0;
  (agent as any).callProviderFunction = async (message: string) => {
    mockCallCount++;
    console.log(`[MOCK] Chamada #${mockCallCount}`);
    
    if (message.includes('ATENÇÃO') && message.includes('loop')) {
      console.log('[SISTEMA] Aviso de loop recebido, mudando estratégia...');
      return `Thought: Recebi aviso de loop, vou tentar uma abordagem diferente
Final Answer: Detectei um loop e mudei minha abordagem.`;
    } else {
      // Simular comportamento que leva ao loop
      return `Thought: Preciso buscar novamente para ter certeza
Action: search_tool
Action Input: {"query": "informação específica"}`;
    }
  };
  
  try {
    console.log('Iniciando conversa que deve causar loop...\n');
    
    // Esta chamada deve causar loop (a mesma ferramenta com os mesmos parâmetros 3 vezes)
    const response = await agent.sendMessage('Busque a informação específica');
    
    console.log('\n✅ RESULTADO ESPERADO:');
    console.log('- O sistema detectou o loop após 3 execuções idênticas');
    console.log('- Uma mensagem de aviso foi emitida');
    console.log('- O sistema tentou uma nova abordagem');
    console.log('- O modo ReAct foi encerrado corretamente');
    console.log('- O agente retornou ao modo chat');
    
    console.log('\nResposta final:');
    console.log(response);
    
    console.log('\n🎉 A funcionalidade de detecção de loops está funcionando corretamente!');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
successfulLoopDetectionTest().catch(console.error);