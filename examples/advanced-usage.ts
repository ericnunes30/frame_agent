// examples/advanced-usage.ts - Exemplo avançado de uso do SDK com tools

import { ChatAgent, Tool } from '../src/index';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Definir uma tool de exemplo
const getCurrentWeather: Tool = {
  name: "get_current_weather",
  description: "Obtém a temperatura atual para uma localização",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "A cidade e estado, por exemplo: São Paulo, SP"
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "A unidade de temperatura"
      }
    },
    required: ["location"]
  },
  execute: async (args: any) => {
    // Simulação de chamada a API de clima
    const { location, unit } = args;
    const temperature = Math.floor(Math.random() * 30) + 10; // 10-40°C
    const unitSymbol = unit === "fahrenheit" ? "°F" : "°C";
    return `A temperatura atual em ${location} é ${temperature}${unitSymbol}`;
  }
};

async function main() {
  // Criar um agente com configurações avançadas
  const agent = new ChatAgent({
    name: "Assistente",
    instructions: "Você é um assistente útil que pode obter informações sobre o clima.",
    provider: "openai-generic"
  });

  // Registrar a tool
  agent.registerTool(getCurrentWeather);

  try {
    // Enviar uma mensagem que requer uso da tool
    const response = await agent.sendMessage("Qual é a temperatura atual em São Paulo?");
    console.log('Usuário: Qual é a temperatura atual em São Paulo?');
    console.log('Assistente:', response);
  } catch (error) {
    console.error('Erro:', error);
  }
}

main().catch(console.error);