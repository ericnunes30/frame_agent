// examples/basic-usage.ts - Exemplo básico de uso do SDK

import { ChatAgent } from '../src/index';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
  // Criar um agente com configurações básicas
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil que responde em português.",
    provider: "openai-generic" // ou outro provider suportado
  });

  try {
    // Enviar uma mensagem e obter resposta
    const response = await agent.sendMessage("Olá, qual é o seu nome?");
    console.log('Usuário: Olá, qual é o seu nome?');
    console.log('Assistente:', response);

    // Enviar outra mensagem (com contexto da conversa anterior)
    const response2 = await agent.sendMessage("Qual foi a minha primeira pergunta?");
    console.log('\nUsuário: Qual foi a minha primeira pergunta?');
    console.log('Assistente:', response2);
  } catch (error) {
    console.error('Erro:', error);
  }
}

main().catch(console.error);