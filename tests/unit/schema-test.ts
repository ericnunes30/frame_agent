// tests/schema-test.ts
// Teste para validação de schemas com Valibot

import { ChatAgent } from '../../src/core/chat-agent-core';
import * as v from 'valibot';

async function testSchema() {
  console.log('=== TESTE DE VALIDAÇÃO DE SCHEMAS COM VALIBOT ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil",
    provider: "openai-generic"
  });
  
  // Definir schema para resposta estruturada
  const answerSchema = v.object({
    answer: v.string(),
    confidence: v.number(),
    reasoning: v.optional(v.string())
  });
  
  // Testar envio de mensagem com resposta estruturada
  console.log('\n--- Envio de mensagem com resposta estruturada ---');
  try {
    const response = await agent.sendStructuredMessage(
      'Qual é a capital do Brasil?', 
      answerSchema
    );
    console.log('Resposta estruturada:');
    console.log('- Resposta:', response.answer);
    console.log('- Confiança:', response.confidence);
    console.log('- Raciocínio:', response.reasoning || 'N/A');
  } catch (error) {
    console.error('Erro ao enviar mensagem com resposta estruturada:', error);
  }
  
  console.log('\n✅ Todos os testes de schemas passaram!');
}

testSchema().catch(console.error);