// tests/chat-agent-memory-test.ts
// Teste para verificar o funcionamento da memória no ChatAgent com mensagens fixas

import { ChatAgent } from '../../src/core/chat-agent-core';
import { DynamicWindowMemory } from '../../src/memory/memory-manager';

function testChatAgentMemory() {
  console.log('=== TESTE DE MEMÓRIA NO CHAT AGENT ===');
  
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
    const initialMessages = agent.getHistory();
    console.log('Mensagens iniciais:');
    initialMessages.forEach((msg, index) => {
      console.log(`  ${index}. ${msg.role}: ${msg.content}`);
    });
    
    // Verificar se a memória é DynamicWindowMemory e se tem mensagens fixas
    const memoryManager = (agent as any).memoryManager;
    const contextMemory = (memoryManager as any).contextMemory;
    
    if (contextMemory instanceof DynamicWindowMemory) {
      console.log('✅ Usando DynamicWindowMemory');
      console.log('Mensagens fixas:', Array.from((contextMemory as any).fixedMessages));
    } else {
      console.log('❌ Não está usando DynamicWindowMemory');
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testChatAgentMemory();