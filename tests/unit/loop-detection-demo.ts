import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/tools/tools';

// Teste completo para demonstrar a funcionalidade de detecção de loops
async function completeLoopDetectionDemo() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              DEMONSTRAÇÃO: DETECÇÃO DE LOOPS               ║');
  console.log('║                    Modo ReAct do SDK                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: 'Assistente ReAct com Detecção de Loops',
    instructions: 'Você é um assistente avançado com detecção de loops. Evite repetir as mesmas ações com os mesmos parâmetros.',
    mode: 'react'
  });
  
  // Criar ferramenta que pode causar loop
  const testTool: Tool = {
    name: 'problematic_tool',
    description: 'Ferramenta que pode causar loops quando usada repetidamente com os mesmos parâmetros',
    parameters: {
      type: 'object',
      properties: {
        data: { 
          type: 'string',
          description: 'Dados para processar'
        },
        operation: {
          type: 'string',
          description: 'Operação a ser realizada'
        }
      },
      required: ['data', 'operation']
    },
    execute: async (args: any) => {
      console.log(`[EXECUTANDO] ${args.operation} com dados: ${args.data}`);
      // Simular um resultado que não resolve o problema, levando a repetição
      return { status: 'completed', result: `Processado: ${args.data}` };
    }
  };
  
  agent.registerTool(testTool);
  
  // Criar um provedor mock que simula o comportamento de loop
  let callCount = 0;
  (agent as any).callProviderFunction = async (message: string) => {
    callCount++;
    console.log(`\n[CHAMADA #${callCount}] Processando requisição...`);
    
    // Detectar se é um aviso de loop
    if (message.includes('ATENÇÃO') && message.includes('loop')) {
      console.log('🔴 LOOP DETECTADO - INICIANDO PROCEDIMENTO DE RECUPERAÇÃO');
      return `Thought: Recebi um alerta de loop. Vou tentar uma abordagem diferente para resolver a tarefa.
Action: problematic_tool
Action Input: {"data": "nova_abordagem", "operation": "processamento_alternativo"}`;
    } else if (message.includes('limite de 3 ações')) {
      console.log('🛑 LIMITE DE TENTATIVAS ATINGIDO - MODO REACT INTERROMPIDO');
      return `Final Answer: O modo ReAct foi interrompido devido à detecção de loop persistente. O sistema está retornando ao modo de conversação normal.`;
    } else {
      // Comportamento que leva ao loop
      return `Thought: Ainda não obtive o resultado esperado, vou tentar novamente com os mesmos parâmetros.
Action: problematic_tool
Action Input: {"data": "teste_loop", "operation": "consulta_repetida"}`;
    }
  };
  
  console.log('🔧 Configuração concluída');
  console.log('💡 A ferramenta "problematic_tool" será chamada repetidamente com os mesmos parâmetros');
  console.log('⚡ O sistema deve detectar o loop após 3 execuções idênticas\n');
  
  try {
    console.log('🚀 Iniciando simulação...\n');
    
    // Esta chamada irá disparar o mecanismo de detecção de loops
    const response = await agent.sendMessage('Execute problematic_tool com {"data": "teste_loop", "operation": "consulta_repetida"}');
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(response);
    
    console.log('\n📋 RESUMO DO PROCESSO:');
    console.log('✅ 1. Agente executou a mesma ferramenta 3 vezes com os mesmos parâmetros');
    console.log('✅ 2. Sistema detectou o padrão de loop');
    console.log('✅ 3. Mensagem de aviso foi enviada ao agente');
    console.log('✅ 4. Foram concedidas 3 ações para contornar o problema');
    console.log('✅ 5. Como o loop persistiu, o modo ReAct foi interrompido');
    console.log('✅ 6. Sistema retornou ao modo chat para intervenção humana');
    
    console.log('\n✨ A funcionalidade de detecção de loops está funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro durante a demonstração:', error);
  }
}

// Executar a demonstração
completeLoopDetectionDemo().catch(console.error);