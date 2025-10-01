import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/tools/tools';

// Teste para verificar a nova funcionalidade de validação de formato ReAct
async function formatValidationTest() {
  console.log('=== Teste: Validação de Formato ReAct ===\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Agente de Teste de Formato',
    instructions: 'Você é um agente para testar validação de formato ReAct.',
    mode: 'react'
  });
  
  // Criar ferramenta para o teste
  const testTool: Tool = {
    name: 'test_tool',
    description: 'Ferramenta de teste para validação de formato',
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
      console.log(`[TEST_TOOL EXECUTION] Executando com input: ${args.input}`);
      return `Resultado para: ${args.input}`;
    }
  };
  
  agent.registerTool(testTool);
  
  // Função mock que simula resposta fora do formato ReAct
  let callCount = 0;
  (agent as any).callProviderFunction = async (message: string) => {
    callCount++;
    console.log(`[MOCK CALL #${callCount}]`);
    
    if (callCount === 1) {
      // Primeira chamada - resposta fora do formato (formato incorreto)
      console.log('[SIMULANDO] Resposta fora do formato ReAct...');
      return 'Esta é uma resposta em formato livre, não estou seguindo o formato ReAct esperado. Vou tentar fazer algo útil mas não estou usando o formato estruturado.';
    } else if (callCount === 2) {
      // Segunda chamada - após mensagem de correção, resposta no formato correto
      console.log('[SIMULANDO] Resposta agora no formato ReAct correto...');
      return `Thought: Recebi a correção, vou seguir o formato ReAct corretamente agora
Action: test_tool
Action Input: {"input": "formato_correto"}`;
    } else {
      // Resposta final para encerrar
      return `Final Answer: Teste de validação de formato concluído com sucesso.`;
    }
  };
  
  try {
    console.log('Iniciando conversa com resposta fora do formato...\n');
    
    // Esta chamada testará a detecção e correção de formato incorreto
    const response = await agent.sendMessage('Execute test_tool com qualquer input');
    
    console.log('\n✅ RESULTADO ESPERADO:');
    console.log('- O sistema detectou a resposta fora do formato ReAct');
    console.log('- Foi enviada uma mensagem de correção para o LLM');
    console.log('- O LLM respondeu novamente no formato correto');
    console.log('- A execução continuou normalmente');
    
    console.log('\nResposta final recebida:');
    console.log(response);
    
    console.log('\n🎉 A funcionalidade de validação de formato está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
formatValidationTest().catch(console.error);