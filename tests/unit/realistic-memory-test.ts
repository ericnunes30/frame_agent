// tests/realistic-memory-test.ts
// Teste realista para verificar o funcionamento da memória com mensagens fixas

import { ChatAgent } from '../../src/core/chat-agent-core';

function testRealisticMemory() {
  console.log('=== TESTE REALISTA DE MEMÓRIA ===');
  
  try {
    // Criar agente com instruções
    console.log('\n--- Criando agente com instruções ---');
    const agent = new ChatAgent({
      name: "Test Agent",
      instructions: "Instruções do sistema que devem ser mantidas",
      provider: "openai-generic",
      mode: "chat"
    });
    
    // Verificar mensagens iniciais
    let messages = agent.getHistory();
    console.log('Mensagens iniciais:');
    messages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content}`);
    });
    
    // Acessar a memória diretamente para configurar testes
    const memoryManager = (agent as any).memoryManager;
    const contextMemory = (memoryManager as any).contextMemory;
    
    // Configurar um limite baixo para testar poda
    (contextMemory as any).maxTokens = 200; // Limite baixo
    (contextMemory as any).tokenizer = { countTokens: (text: string) => text.length }; // Mock simples
    
    // Marcar mensagens fixas (simulando o que o ChatAgent faz)
    (contextMemory as any).setFixedMessages([0]); // Apenas a mensagem do sistema
    
    console.log('\n--- Adicionando mensagens para testar poda ---');
    // Adicionar mensagens longas para forçar poda
    for (let i = 0; i < 10; i++) {
      contextMemory.addMessage({ 
        role: 'user', 
        content: `Mensagem ${i} com conteúdo muito longo que vai ultrapassar o limite de tokens permitido para testar a funcionalidade de poda e garantir que as mensagens fixas sejam mantidas corretamente mesmo quando o sistema precisa remover outras mensagens para caber no limite` 
      });
    }
    
    // Verificar mensagens após poda
    messages = contextMemory.getContext();
    console.log('Mensagens após poda:');
    messages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });
    
    console.log(`Total de mensagens: ${messages.length}`);
    console.log(`Mensagens fixas: ${Array.from((contextMemory as any).fixedMessages).join(', ')}`);
    
    // Verificar se a mensagem do sistema ainda está presente
    const systemMessage = messages.find((msg: any) => msg.role === 'system');
    
    if (systemMessage) {
      console.log('✅ MENSAGEM DO SISTEMA MANTIDA APÓS PODA!');
      console.log('   Conteúdo:', systemMessage.content);
    } else {
      console.log('❌ MENSAGEM DO SISTEMA FOI REMOVIDA!');
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testRealisticMemory();