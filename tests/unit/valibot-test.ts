// tests/valibot-test.ts
// Teste para validação com Valibot

import * as v from 'valibot';
import { ChatAgent } from '../../src/core/chat-agent-core';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Schema para teste
const TestSchema = v.object({
  name: v.string(),
  age: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(120)
  ),
  email: v.optional(v.string())
});

async function testValibot() {
  console.log('=== TESTE DE VALIDAÇÃO COM VALIBOT ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil",
    provider: "openai-generic"
  });
  
  try {
    // Testar sendStructuredMessage com schema
    const response = await agent.sendStructuredMessage(
      "Crie um objeto JSON com as seguintes propriedades: name='João', age=25, email='joao@example.com'. Retorne apenas o JSON válido.",
      TestSchema
    );
    
    console.log('Resposta estruturada:', response);
    console.log('Tipo da resposta:', typeof response);
    console.log('Propriedades:', Object.keys(response));
    
    // Verificar se a resposta tem as propriedades esperadas
    if (response.name && response.age) {
      console.log('✅ Validação bem-sucedida!');
    } else {
      console.log('❌ Validação falhou - propriedades ausentes');
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

testValibot().catch(console.error);