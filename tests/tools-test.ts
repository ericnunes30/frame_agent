// tests/tools-test.ts
// Teste para o sistema de tools

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from '../examples/example-tools';

async function testTools() {
  console.log('=== TESTE DO SISTEMA DE TOOLS ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil",
    provider: "openai-generic"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Tools registradas:', agent.listTools().map(t => t.name));
  
  // Testar execução de tools
  try {
    console.log('\n--- Testando calculadora ---');
    const calcResult = await agent.executeTool('calculate', { expression: '2 + 2 * 3' });
    console.log('Resultado da calculadora:', calcResult);
    
    console.log('\n--- Testando data/hora ---');
    const dateTimeResult = await agent.executeTool('get_current_datetime', {});
    console.log('Resultado de data/hora:', dateTimeResult);
    
    console.log('\n--- Testando clima ---');
    const weatherResult = await agent.executeTool('get_weather', { location: 'São Paulo' });
    console.log('Resultado do clima:', weatherResult);
    
    console.log('\n✅ Todos os testes de tools passaram!');
  } catch (error) {
    console.error('❌ Erro nos testes de tools:', error);
  }
}

testTools().catch(console.error);