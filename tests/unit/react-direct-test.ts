// tests/react-direct-test.ts
// Teste direto do modo ReAct com prompts específicos

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
      const result = eval(args.expression);
      return { result: Number(result.toFixed(2)), operation: args.expression };
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

async function testReActWithDirectPrompt() {
  console.log('=== TESTE DIRETO DO MODO REACT ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas. Use as tools disponíveis quando necessário.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  try {
    // Teste 1: Data e hora
    console.log('\n--- Teste 1: Obter data e hora ---');
    const response1 = await agent.sendMessage("Use a tool get_current_datetime para obter a data e hora atual.");
    console.log('Resposta 1:', response1);
    
    // Teste 2: Cálculo simples
    console.log('\n--- Teste 2: Cálculo simples ---');
    const response2 = await agent.sendMessage("Use a tool calculate para calcular 12 + 8.");
    console.log('Resposta 2:', response2);
    
    // Teste 3: Tarefa combinada
    console.log('\n--- Teste 3: Tarefa combinada ---');
    const response3 = await agent.sendMessage("Primeiro, obtenha a data atual. Depois, calcule quantos dias faltam para o final do ano 2025.");
    console.log('Resposta 3:', response3);
  } catch (error) {
    console.error('❌ Erro no teste ReAct:', error);
  }
}

async function testReActWithExplicitInstructions() {
  console.log('\n=== TESTE DO MODO REACT COM INSTRUÇÕES EXPLÍCITAS ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: `Você é um assistente que usa o framework ReAct (Reasoning + Action) para resolver tarefas. 
Siga este formato exato:

Thought: Seu raciocínio sobre a tarefa
Action: nome_da_tool[{"parâmetro": "valor"}]
Observation: Resultado da tool
Thought: Continuação do raciocínio
Final Answer: Resposta final

Tools disponíveis:
- calculate: Realiza operações matemáticas básicas
- get_current_datetime: Obtém a data e hora atual`,
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  try {
    console.log('\n--- Teste com instruções explícitas ---');
    const response = await agent.sendMessage("Calcule 15 + 25 usando a tool calculate.");
    console.log('Resposta:', response);
  } catch (error) {
    console.error('❌ Erro no teste com instruções explícitas:', error);
  }
}

async function main() {
  await testReActWithDirectPrompt();
  await testReActWithExplicitInstructions();
}

main().catch(console.error);