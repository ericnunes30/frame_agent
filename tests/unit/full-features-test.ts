// tests/full-features-test.ts
// Teste completo das funcionalidades do SDK

import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/adapters/provider-adapter';
import * as v from 'valibot';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Tool de calculadora
const calculatorTool: Tool = {
  name: "calculate",
  description: "Realiza operações matemáticas básicas",
  parameters: v.object({
    expression: v.string()
  }),
  execute: async (args: { expression: string }) => {
    try {
      // Em produção, usar um parser seguro em vez de eval
      const result = eval(args.expression);
      return { result: Number(result.toFixed(2)) };
    } catch (error) {
      throw new Error(`Não foi possível calcular: ${args.expression}`);
    }
  }
};

// Tool de data e hora
const dateTimeTool: Tool = {
  name: "get_current_datetime",
  description: "Obtém a data e hora atual",
  parameters: v.object({
    timezone: v.optional(v.string())
  }),
  execute: async (args: { timezone?: string }) => {
    const now = new Date();
    return {
      datetime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timezone: args.timezone || 'UTC'
    };
  }
};

async function testFullFeatures() {
  console.log('=== TESTE COMPLETO DAS FUNCIONALIDADES ===');
  
  // Testar modo chat básico
  console.log('\n--- MODO CHAT BÁSICO ---');
  const chatAgent = new ChatAgent({
    name: "Assistente Chat",
    instructions: "Você é um assistente útil que responde em português.",
    provider: "openai-generic"
  });
  
  try {
    const chatResponse = await chatAgent.sendMessage("Qual é a capital do Brasil?");
    console.log('Resposta Chat:', chatResponse);
  } catch (error) {
    console.error('Erro no modo chat:', error);
  }
  
  // Testar modo ReAct com tools
  console.log('\n--- MODO REACT COM TOOLS ---');
  const reactAgent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  reactAgent.registerTool(calculatorTool);
  reactAgent.registerTool(dateTimeTool);
  
  console.log('Tools registradas:', reactAgent.listTools().map((t: any) => t.name));
  
  try {
    const reactResponse = await reactAgent.sendMessage("Qual é a data e hora atual? E qual é o resultado de 10 + 5?");
    console.log('Resposta ReAct:', reactResponse);
  } catch (error) {
    console.error('Erro no modo ReAct:', error);
  }
  
  // Testar modo Planning
  console.log('\n--- MODO PLANNING ---');
  const planningAgent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas através de planejamento hierárquico.",
    provider: "openai-generic",
    mode: "planning"
  });
  
  // Registrar as mesmas tools
  planningAgent.registerTool(calculatorTool);
  planningAgent.registerTool(dateTimeTool);
  
  try {
    const planningResponse = await planningAgent.sendMessage("Planeje uma tarefa simples: verifique a data atual e some 100 a ela.");
    console.log('Resposta Planning:', planningResponse);
  } catch (error) {
    console.error('Erro no modo Planning:', error);
  }
  
  // Testar validação com schemas
  console.log('\n--- VALIDAÇÃO COM SCHEMAS ---');
  const structuredAgent = new ChatAgent({
    name: "Assistente Estruturado",
    instructions: "Você é um assistente que responde com dados estruturados.",
    provider: "openai-generic"
  });
  
  // Schema para resposta estruturada
  const UserSchema = v.object({
    name: v.string(),
    age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
    city: v.string()
  });
  
  try {
    const structuredResponse = await structuredAgent.sendStructuredMessage(
      "Crie um usuário com nome 'Maria', idade 28 e cidade 'São Paulo'",
      UserSchema
    );
    console.log('Resposta Estruturada:', structuredResponse);
  } catch (error) {
    console.error('Erro na resposta estruturada:', error);
  }
  
  // Testar gerenciamento de contexto
  console.log('\n--- GERENCIAMENTO DE CONTEXTO ---');
  const contextAgent = new ChatAgent({
    name: "Assistente Contexto",
    instructions: "Você é um assistente que lembra informações importantes.",
    provider: "openai-generic"
  });
  
  // Definir variáveis de contexto
  contextAgent.setContextVariable('user_name', 'João');
  contextAgent.setContextVariable('user_preference', 'tecnologia');
  
  console.log('Variáveis de contexto:', contextAgent.getAllContextVariables());
  
  try {
    const contextResponse = await contextAgent.sendMessage("Qual é o nome do usuário e qual sua preferência?");
    console.log('Resposta Contexto:', contextResponse);
  } catch (error) {
    console.error('Erro no contexto:', error);
  }
  
  console.log('\n✅ Todos os testes completos foram executados!');
}

testFullFeatures().catch(console.error);