// tests/openai-compat-test.ts
// Teste para verificar o funcionamento do provider OpenAI compatível

import { ChatAgent } from '../../src/core/chat-agent-core';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testOpenAICompat() {
  console.log('=== TESTE DO PROVIDER OPENAI COMPATÍVEL ===');
  
  // Testar com provider openai-generic (compatível)
  const agent = new ChatAgent({
    name: "Assistente Compatível",
    instructions: "Você é um assistente útil que responde em português.",
    provider: "openai-generic"
  });
  
  console.log('Configuração do agente:');
  console.log('- Provider:', agent.getConfig().provider);
  console.log('- Modelo:', process.env.MODEL || 'default');
  console.log('- Base URL:', process.env.OPENAI_BASE_URL || 'default');
  
  try {
    // Testar envio de mensagem
    console.log('\n--- Testando envio de mensagem ---');
    const response = await agent.sendMessage("Olá! Qual é o seu nome e qual provider você está usando?");
    console.log('Resposta:', response);
    
    // Testar histórico
    console.log('\n--- Histórico de mensagens ---');
    const history = agent.getHistory();
    history.forEach((msg: any, index: number) => {
      console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
    });
    
    console.log('\n✅ Teste do provider OpenAI compatível concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Também testar com provider específico da OpenAI
async function testOpenAIDirect() {
  console.log('\n=== TESTE DO PROVIDER OPENAI DIRETO ===');
  
  try {
    // Para testar com OpenAI direto, precisamos de uma chave de API real da OpenAI
    console.log('Para testar com OpenAI direto, configure OPENAI_API_KEY com uma chave válida da OpenAI');
    console.log('Atualmente usando chave:', process.env.OPENAI_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      const agent = new ChatAgent({
        name: "Assistente OpenAI",
        instructions: "Você é um assistente útil que responde em português.",
        provider: "openai-gpt-4o-mini"
      });
      
      console.log('Configuração do agente:');
      console.log('- Provider:', agent.getConfig().provider);
      
      const response = await agent.sendMessage("Olá! Esta é uma mensagem de teste para a OpenAI direta.");
      console.log('Resposta:', response);
      
      console.log('\n✅ Teste do provider OpenAI direto concluído com sucesso!');
    } else {
      console.log('⚠️  Chave da OpenAI não configurada ou não é uma chave válida. Pulando teste.');
    }
  } catch (error) {
    console.error('❌ Erro no teste da OpenAI direta:', error);
  }
}

async function main() {
  await testOpenAICompat();
  await testOpenAIDirect();
}

main().catch(console.error);