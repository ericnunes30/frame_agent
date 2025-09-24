// tests/tools-execution-test.ts
// Teste específico para execução de tools

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

async function testDirectToolExecution() {
  console.log('=== TESTE DE EXECUÇÃO DIRETA DE TOOLS ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil.",
    provider: "openai-generic"
  });
  
  // Registrar tools
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  try {
    // Testar execução direta de tool
    console.log('\n--- Testando execução direta da calculadora ---');
    const calcResult = await agent.executeTool('calculate', { expression: '10 + 5' });
    console.log('Resultado da calculadora:', calcResult);
    
    console.log('\n--- Testando execução direta de data/hora ---');
    const dateTimeResult = await agent.executeTool('get_current_datetime', {});
    console.log('Resultado de data/hora:', dateTimeResult);
  } catch (error) {
    console.error('❌ Erro na execução direta de tools:', error);
  }
}

async function testToolWithValidation() {
  console.log('\n=== TESTE DE VALIDAÇÃO DE PARÂMETROS ===');
  
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil.",
    provider: "openai-generic"
  });
  
  // Registrar tool com validação mais estrita
  const strictCalculatorTool: Tool = {
    name: "strict_calculate",
    description: "Realiza operações matemáticas básicas com validação estrita",
    parameters: v.object({
      expression: v.pipe(v.string(), v.minLength(1))
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
  
  agent.registerTool(strictCalculatorTool);
  
  try {
    // Testar com parâmetros válidos
    console.log('\n--- Testando com parâmetros válidos ---');
    const result1 = await agent.executeTool('strict_calculate', { expression: '20 + 30' });
    console.log('Resultado válido:', result1);
    
    // Testar com parâmetros inválidos
    console.log('\n--- Testando com parâmetros inválidos ---');
    try {
      const result2 = await agent.executeTool('strict_calculate', { expression: '' });
      console.log('Resultado inválido:', result2);
    } catch (error) {
      console.log('✅ Erro esperado na validação:', (error as Error).message);
    }
  } catch (error) {
    console.error('❌ Erro no teste de validação:', error);
  }
}

async function main() {
  await testDirectToolExecution();
  await testToolWithValidation();
}

main().catch(console.error);