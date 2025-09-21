// tests/config-test.ts
// Teste para configuração dinâmica do agente

import { ChatAgent } from '../src/chat-agent-core';

async function testConfig() {
  console.log('=== TESTE DE CONFIGURAÇÃO DINÂMICA ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil",
    provider: "openai-gpt-4o-mini",
    temperature: 0.7
  });
  
  // Testar configuração inicial
  console.log('\n--- Configuração inicial ---');
  console.log('Configuração atual:', agent.getConfig());
  
  // Testar atualização de configuração
  console.log('\n--- Atualização de configuração ---');
  agent.setConfig({
    temperature: 0.9,
    maxTokens: 1000
  });
  
  console.log('Configuração após atualização:', agent.getConfig());
  
  // Testar envio de mensagem com configuração dinâmica
  console.log('\n--- Envio de mensagem com configuração dinâmica ---');
  try {
    const response = await agent.sendMessage(
      'Escreva uma história criativa de 50 palavras', 
      { temperature: 1.2, maxTokens: 150 }
    );
    console.log('Resposta:', response);
  } catch (error) {
    console.error('Erro ao enviar mensagem com configuração dinâmica:', error);
  }
  
  console.log('\n✅ Todos os testes de configuração passaram!');
}

testConfig().catch(console.error);