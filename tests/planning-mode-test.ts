// tests/planning-mode-test.ts
// Teste para o modo Planning do agente

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from '../examples/example-tools';

async function testPlanningMode() {
  console.log('=== TESTE DO MODO PLANNING ===');
  
  const agent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas.",
    provider: "openai-generic",
    mode: "planning"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Tools registradas:', agent.listTools().map(t => t.name));
  
  // Testar modo Planning com uma tarefa complexa
  try {
    console.log('\n--- Testando modo Planning ---');
    const task = "Planeje uma viagem para Paris nos próximos 30 dias. Verifique a previsão do tempo para Paris, calcule quanto tempo falta até a viagem e me diga se é uma boa época para viajar.";
    
    console.log(`Tarefa: ${task}`);
    const result = await agent.sendMessage(task);
    console.log('Resultado:', result);
    
    // Verificar histórico Planning
    const history = agent.getHistory();
    console.log('\nHistórico de mensagens:', history.length, 'mensagens');
    
    console.log('\n✅ Teste do modo Planning concluído!');
  } catch (error) {
    console.error('❌ Erro no teste do modo Planning:', error);
  }
}

testPlanningMode().catch(console.error);