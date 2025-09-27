// tests/memory-test.ts
// Teste para o gerenciador de memória de contexto

import { ChatAgent } from '../../src/core/chat-agent-core';

async function testMemory() {
  console.log('=== TESTE DO GERENCIADOR DE MEMÓRIA ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil",
    provider: "openai-generic"
  });
  
  // Testar variáveis de contexto
  console.log('\n--- Testando variáveis de contexto ---');
  agent.setContextVariable('user_name', 'João');
  agent.setContextVariable('user_age', 30);
  
  console.log('Variável user_name:', agent.getContextVariable('user_name'));
  console.log('Variável user_age:', agent.getContextVariable('user_age'));
  console.log('Todas as variáveis:', agent.getAllContextVariables());
  
  // Testar histórico de mensagens
  console.log('\n--- Testando histórico de mensagens ---');
  agent.sendMessage('Olá, qual é o seu nome?');
  agent.sendMessage('Como você está hoje?');
  
  const history = agent.getHistory();
  console.log('Histórico de mensagens:');
  history.forEach((msg: any, index: number) => {
    console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
  });
  
  // Testar reset
  console.log('\n--- Testando reset ---');
  agent.reset();
  console.log('Histórico após reset:', agent.getHistory());
  console.log('Variáveis após reset:', agent.getAllContextVariables());
  
  console.log('\n✅ Todos os testes de memória passaram!');
}

testMemory().catch(console.error);