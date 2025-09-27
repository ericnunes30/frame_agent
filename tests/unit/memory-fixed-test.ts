// tests/memory-fixed-test.ts
// Teste para verificar o funcionamento da memória com mensagens fixas

import { ChatAgent } from '../../src/core/chat-agent-core';
import { DynamicWindowMemory } from '../../src/memory/memory-manager';

async function testFixedMessagesInMemory() {
  console.log('=== TESTE DE MENSAGENS FIXAS NA MEMÓRIA ===');
  
  try {
    // Teste 1: Verificar DynamicWindowMemory diretamente
    console.log('\n--- Teste 1: DynamicWindowMemory com mensagens fixas ---');
    const dynamicMemory = new DynamicWindowMemory(50); // Limite baixo para testar poda
    (dynamicMemory as any).tokenizer = { countTokens: (text: string) => text.length }; // Mock para contagem de tokens
    
    // Adicionar mensagens
    dynamicMemory.addMessage({ role: 'system', content: 'Instruções do sistema' });
    dynamicMemory.addMessage({ role: 'user', content: 'Primeira mensagem do usuário' });
    dynamicMemory.addMessage({ role: 'assistant', content: 'Resposta do assistente' });
    
    // Marcar mensagens do sistema e primeira do usuário como fixas
    (dynamicMemory as any).setFixedMessages([0, 1]);
    
    console.log('Mensagens antes da poda:');
    const initialMessages = dynamicMemory.getContext();
    initialMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content}`);
    });
    
    // Adicionar muitas mensagens para forçar a poda
    for (let i = 0; i < 20; i++) {
      dynamicMemory.addMessage({ role: 'user', content: `Mensagem ${i} ` + 'a'.repeat(10) });
    }
    
    console.log('\nMensagens após poda:');
    const finalMessages = dynamicMemory.getContext();
    finalMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 30)}...`);
    });
    
    // Verificar se as mensagens fixas ainda estão presentes
    const systemMessage = finalMessages.find(msg => msg.role === 'system');
    const firstUserMessage = finalMessages.find((msg, index) => msg.role === 'user' && index === 0);
    
    if (systemMessage && firstUserMessage) {
      console.log('✅ MENSAGENS FIXAS MANTIDAS APÓS PODA!');
    } else {
      console.log('❌ MENSAGENS FIXAS FORAM REMOVIDAS!');
    }
    
    // Teste 2: Verificar com ChatAgent
    console.log('\n--- Teste 2: ChatAgent com mensagens fixas ---');
    const agent = new ChatAgent({
      name: "Test Agent",
      instructions: "Instruções do sistema fixas",
      provider: "openai-generic",
      mode: "chat"
    });
    
    // Verificar mensagens iniciais
    const initialAgentMessages = agent.getHistory();
    console.log('Mensagens iniciais do agente:');
    initialAgentMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content}`);
    });
    
    // Enviar primeira mensagem do usuário
    await agent.sendMessage("Primeira mensagem do usuário");
    
    // Verificar mensagens após primeira interação
    const afterFirstMessage = agent.getHistory();
    console.log('\nMensagens após primeira interação:');
    afterFirstMessage.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 30)}...`);
    });
    
    console.log('\n✅ TESTE DE MENSAGENS FIXAS CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste de mensagens fixas:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testFixedMessagesInMemory().catch(console.error);