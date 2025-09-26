// examples/test-react-instructions.ts
// Teste para verificar se as instruções personalizadas estão sendo aplicadas no modo ReAct

import { ChatAgent } from '../src/core/chat-agent-core';
import { calculatorTool } from './example-tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testReActInstructions() {
  console.log('=== TESTE DE INSTRUÇÕES PERSONALIZADAS NO MODO REACT ===');
  
  // Criar agente ReAct com instruções personalizadas
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente especializado em matemática. Sempre que fizer cálculos, explique seu raciocínio passo a passo. Use a tool 'calculate' para todas as operações matemáticas.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tool
  agent.registerTool(calculatorTool);
  
  console.log('Agente ReAct criado com instruções personalizadas');
  console.log('Tools registradas:', agent.listTools().map(t => t.name));
  
  try {
    // Verificar histórico inicial
    console.log('\nHistórico inicial:');
    const initialHistory = agent.getHistory();
    initialHistory.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
    });
    
    // Testar uma tarefa simples
    console.log('\n--- Testando tarefa: Calcule 10 + 5 ---');
    const response = await agent.sendMessage("Calcule 10 + 5");
    console.log('Resposta:', response);
    
    // Verificar histórico após a execução
    console.log('\nHistórico após execução:');
    const history = agent.getHistory();
    history.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
    });
    
    console.log('\n✅ TESTE DO MODO REACT CONCLUÍDO!');
  } catch (error) {
    console.error('❌ Erro no teste do modo ReAct:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  testReActInstructions().catch(console.error);
}

export { testReActInstructions };