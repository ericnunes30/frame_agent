// tests/react-mode-test.ts
// Teste para o modo ReAct do agente

import { ChatAgent } from '../../src/core/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from '../../examples/example-tools';

async function testReActMode() {
  console.log('=== TESTE DO MODO REACT ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  // Testar modo ReAct com uma tarefa simples
  try {
    console.log('\n--- Testando modo ReAct ---');
    const task = "Qual é a data e hora atual? Some 100 ao resultado da hora atual e me diga o resultado.";
    
    console.log(`Tarefa: ${task}`);
    const result = await agent.sendMessage(task);
    console.log('Resultado:', result);
    
    // Verificar histórico ReAct
    const history = agent.getHistory();
    console.log('\nHistórico de mensagens:', history.length, 'mensagens');
    
    console.log('\n✅ Teste do modo ReAct concluído!');
  } catch (error) {
    console.error('❌ Erro no teste do modo ReAct:', error);
  }
}

testReActMode().catch(console.error);