// tests/dynamic-memory-test.ts
// Teste simples para verificar o funcionamento da DynamicWindowMemory com mensagens fixas

import { DynamicWindowMemory } from '../../src/memory/memory-manager';

function testDynamicMemoryWithFixedMessages() {
  console.log('=== TESTE DE DynamicWindowMemory COM MENSAGENS FIXAS ===');
  
  try {
    // Criar instância com limite baixo para testar poda
    const dynamicMemory = new DynamicWindowMemory(50); // Limite de 50 tokens
    (dynamicMemory as any).tokenizer = { countTokens: (text: string) => text.length }; // Mock simples
    
    console.log('\n--- Adicionando mensagens iniciais ---');
    // Adicionar mensagens
    dynamicMemory.addMessage({ role: 'system', content: 'Sistema' }); // 6 caracteres
    dynamicMemory.addMessage({ role: 'user', content: 'Usuário 1' }); // 9 caracteres
    dynamicMemory.addMessage({ role: 'assistant', content: 'Assistente' }); // 10 caracteres
    
    console.log('Mensagens após adição inicial:');
    const initialMessages = dynamicMemory.getContext();
    initialMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content} (${(dynamicMemory as any).tokenizer.countTokens(msg.content)} tokens)`);
    });
    console.log(`Total de tokens: ${(dynamicMemory as any).getTokenCount()}`);
    
    // Marcar mensagens do sistema e primeira do usuário como fixas
    (dynamicMemory as any).setFixedMessages([0, 1]);
    console.log('Mensagens 0 e 1 marcadas como fixas');
    
    console.log('\n--- Adicionando muitas mensagens para forçar poda ---');
    // Adicionar mensagens que vão ultrapassar o limite
    for (let i = 0; i < 10; i++) {
      dynamicMemory.addMessage({ role: 'user', content: `Mensagem ${i} longa o suficiente para contar tokens` }); // ~40 caracteres
    }
    
    console.log('Mensagens após poda:');
    const finalMessages = dynamicMemory.getContext();
    finalMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 20)}...`);
    });
    console.log(`Total de tokens: ${(dynamicMemory as any).getTokenCount()}`);
    console.log(`Total de mensagens: ${finalMessages.length}`);
    
    // Verificar se as mensagens fixas ainda estão presentes
    const systemMessage = finalMessages[0];
    const firstUserMessage = finalMessages[1];
    
    if (systemMessage && systemMessage.role === 'system' && systemMessage.content === 'Sistema' &&
        firstUserMessage && firstUserMessage.role === 'user' && firstUserMessage.content === 'Usuário 1') {
      console.log('✅ MENSAGENS FIXAS MANTIDAS APÓS PODA!');
    } else {
      console.log('❌ MENSAGENS FIXAS FORAM REMOVIDAS!');
      console.log('Mensagem do sistema:', systemMessage);
      console.log('Primeira mensagem do usuário:', firstUserMessage);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testDynamicMemoryWithFixedMessages();