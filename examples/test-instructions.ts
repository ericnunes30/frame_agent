// examples/test-instructions.ts
// Teste para verificar se as instruções personalizadas estão sendo aplicadas

import { ChatAgent } from '../src/core/chat-agent-core';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testInstructions() {
  console.log('=== TESTE DE INSTRUÇÕES PERSONALIZADAS ===');
  
  // Criar agente com instruções personalizadas
  const agent = new ChatAgent({
    name: "Assistente de Teste",
    instructions: "Você é um assistente especializado em testes de software. Sempre que responder, inclua a palavra 'TESTE' no início da sua resposta.",
    provider: "openai-generic",
    mode: "chat"
  });
  
  console.log('Agente criado com instruções personalizadas');
  
  try {
    // Testar se as instruções estão sendo aplicadas
    const response = await agent.sendMessage("Qual é a sua especialidade?");
    console.log('Pergunta: Qual é a sua especialidade?');
    console.log('Resposta:', response);
    
    // Verificar histórico
    console.log('\nHistórico de mensagens:');
    const history = agent.getHistory();
    history.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
    });
    
    // Verificar se a resposta contém a palavra "TESTE" (indicando que as instruções foram aplicadas)
    if (response.includes('TESTE')) {
      console.log('\n✅ INSTRUÇÕES PERSONALIZADAS FORAM APLICADAS CORRETAMENTE!');
    } else {
      console.log('\n⚠️  INSTRUÇÕES PERSONALIZADAS PODEM NÃO TER SIDO APLICADAS.');
      console.log('A resposta não contém a palavra "TESTE" como especificado nas instruções.');
    }
  } catch (error) {
    console.error('Erro ao testar instruções:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  testInstructions().catch(console.error);
}

export { testInstructions };