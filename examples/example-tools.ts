// src/example-tools.ts
// Exemplos de tools para testar o sistema

import { Tool } from '../src/adapters/provider-adapter';
import * as v from 'valibot';

// Calculadora simples
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

// Data e hora atual
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

// Consulta de clima (simulada)
const weatherTool: Tool = {
  name: "get_weather",
  description: "Obtém informações sobre o clima para uma localização",
  parameters: v.object({
    location: v.string()
  }),
  execute: async (args: { location: string }) => {
    // Simulação - em produção, integrar com API real
    const conditions = ["Ensolarado", "Nublado", "Chuvoso", "Parcialmente nublado"];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temperature = Math.floor(Math.random() * 30) + 10; // 10-40°C
    
    return {
      location: args.location,
      condition: condition,
      temperature: temperature,
      unit: "Celsius"
    };
  }
};

export { calculatorTool, dateTimeTool, weatherTool };