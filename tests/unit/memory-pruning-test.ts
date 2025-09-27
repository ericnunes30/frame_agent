// tests/memory-pruning-test.ts
// Teste para verificar o funcionamento da poda com mensagens fixas

import { ChatAgent } from '../../src/core/chat-agent-core';

async function testMemoryPruningWithFixedMessages() {
  console.log('=== TESTE DE PODA COM MENSAGENS FIXAS ===');
  
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
    
    // Simular envio de muitas mensagens para forçar poda
    console.log('\n--- Simulando envio de muitas mensagens ---');
    // Vamos acessar diretamente a memória para simular isso
    const memoryManager = (agent as any).memoryManager;
    const contextMemory = (memoryManager as any).contextMemory;
    
    // Reduzir o limite de tokens para testar poda
    (contextMemory as any).maxTokens = 100; // Limite baixo para testar
    (contextMemory as any).tokenizer = { countTokens: (text: string) => text.length }; // Mock simples
    
    // Adicionar muitas mensagens diretamente
    for (let i = 0; i < 20; i++) {
      contextMemory.addMessage({ 
        role: 'user', 
        content: `Mensagem ${i} com conteúdo longo o suficiente para forçar poda` 
      });
    }
    
    // Verificar mensagens após poda
    messages = contextMemory.getContext();
    console.log('Mensagens após poda:');
    messages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content.substring(0, 30)}...`);
    });
    
    // Verificar se as mensagens fixas ainda estão presentes
    const systemMessage = messages.find((msg: any) => msg.role === 'system');
    const firstUserMessage = messages.find((msg: any, index: number) => 
      msg.role === 'user' && index === 1); // Primeira mensagem do usuário
    
    if (systemMessage && firstUserMessage) {
      console.log('✅ MENSAGENS FIXAS MANTIDAS APÓS PODA!');
      console.log('   Mensagem do sistema:', systemMessage.content);
      console.log('   Primeira mensagem do usuário:', firstUserMessage.content);
    } else {
      console.log('❌ MENSAGENS FIXAS FORAM REMOVIDAS!');
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testMemoryPruningWithFixedMessages();