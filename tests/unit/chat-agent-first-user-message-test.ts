// tests/chat-agent-first-user-message-test.ts
// Teste para verificar se a primeira mensagem do usuário é marcada como fixa

import { ChatAgent } from '../../src/core/chat-agent-core';

async function testFirstUserMessageFixed() {
  console.log('=== TESTE DE PRIMEIRA MENSAGEM DO USUÁRIO FIXA ===');
  
  try {
    // Criar agente com instruções
    console.log('\n--- Criando agente com instruções ---');
    const agent = new ChatAgent({
      name: "Test Agent",
      instructions: "Instruções do sistema",
      provider: "openai-generic",
      mode: "chat"
    });
    
    // Verificar mensagens iniciais
    let messages = agent.getHistory();
    console.log('Mensagens iniciais:');
    messages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content}`);
    });
    
    // Verificar mensagens fixas iniciais
    const memoryManager = (agent as any).memoryManager;
    const contextMemory = (memoryManager as any).contextMemory;
    console.log('Mensagens fixas iniciais:', Array.from((contextMemory as any).fixedMessages));
    
    // Enviar primeira mensagem do usuário
    console.log('\n--- Enviando primeira mensagem do usuário (simulado) ---');
    // Vamos simular o envio de mensagem sem chamar a API
    const userMessage = "Primeira mensagem do usuário";
    agent.sendMessage(userMessage).catch(() => {
      // Ignorar erro de API, só queremos testar a memória
    });
    
    // Esperar um pouco para o processamento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar mensagens após adicionar a primeira do usuário
    messages = agent.getHistory();
    console.log('Mensagens após primeira do usuário:');
    messages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 30)}...`);
    });
    
    // Verificar mensagens fixas após adicionar a primeira do usuário
    console.log('Mensagens fixas após primeira do usuário:', Array.from((contextMemory as any).fixedMessages));
    
    // Verificar se a primeira mensagem do usuário está marcada como fixa
    const fixedMessages = Array.from((contextMemory as any).fixedMessages);
    const firstUserMessageIndex = messages.findIndex((msg: any) => msg.role === 'user');
    
    if (fixedMessages.includes(firstUserMessageIndex)) {
      console.log('✅ PRIMEIRA MENSAGEM DO USUÁRIO MARCADA COMO FIXA!');
    } else {
      console.log('⚠️  PRIMEIRA MENSAGEM DO USUÁRIO NÃO ESTÁ MARCADA COMO FIXA');
      console.log('Índice da primeira mensagem do usuário:', firstUserMessageIndex);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testFirstUserMessageFixed();