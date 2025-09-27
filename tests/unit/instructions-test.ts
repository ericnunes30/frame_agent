// tests/instructions-test.ts
// Teste para verificar se as instruções estão sendo utilizadas corretamente

import { ChatAgent } from '../../src/core/chat-agent-core';
import { calculatorTool, dateTimeTool } from '../../examples/example-tools';

async function testInstructionsInReActMode() {
  console.log('=== TESTE DE INSTRUÇÕES NO MODO REACT ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente especializado em matemática. Sempre que fizer cálculos, explique seu raciocínio passo a passo.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  try {
    console.log('\n--- Testando modo ReAct com instruções personalizadas ---');
    const task = "Calcule 15 + 25 e explique como você chegou ao resultado.";
    
    console.log(`Tarefa: ${task}`);
    const result = await agent.sendMessage(task);
    console.log('Resultado:', result);
    
    // Verificar histórico
    const history = agent.getHistory();
    console.log('\nHistórico de mensagens:');
    history.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
    });
    
    console.log('\n✅ Teste de instruções no modo ReAct concluído!');
  } catch (error) {
    console.error('❌ Erro no teste de instruções no modo ReAct:', error);
  }
}

async function testInstructionsInPlanningMode() {
  console.log('\n=== TESTE DE INSTRUÇÕES NO MODO PLANNING ===');
  
  const agent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente especializado em planejamento de tarefas. Sempre que planejar, divida as tarefas em etapas claras e bem definidas.",
    provider: "openai-generic",
    mode: "planning"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  try {
    console.log('\n--- Testando modo Planning com instruções personalizadas ---');
    const task = "Planeje como calcular a soma de 100 + 200.";
    
    console.log(`Tarefa: ${task}`);
    const result = await agent.sendMessage(task);
    console.log('Resultado:', result);
    
    console.log('\n✅ Teste de instruções no modo Planning concluído!');
  } catch (error) {
    console.error('❌ Erro no teste de instruções no modo Planning:', error);
  }
}

async function testInstructionsInChatMode() {
  console.log('\n=== TESTE DE INSTRUÇÕES NO MODO CHAT ===');
  
  const agent = new ChatAgent({
    name: "Assistente Chat",
    instructions: "Você é um assistente especializado em programação. Sempre que responder, use uma linguagem técnica e precisa.",
    provider: "openai-generic",
    mode: "chat"
  });
  
  try {
    console.log('\n--- Testando modo Chat com instruções personalizadas ---');
    const task = "Explique o que é uma variável em programação.";
    
    console.log(`Tarefa: ${task}`);
    const result = await agent.sendMessage(task);
    console.log('Resultado:', result);
    
    console.log('\n✅ Teste de instruções no modo Chat concluído!');
  } catch (error) {
    console.error('❌ Erro no teste de instruções no modo Chat:', error);
  }
}

async function main() {
  await testInstructionsInChatMode();
  await testInstructionsInReActMode();
  await testInstructionsInPlanningMode();
}

if (require.main === module) {
  main().catch(console.error);
}

export { testInstructionsInReActMode, testInstructionsInPlanningMode, testInstructionsInChatMode };