// examples/mode-configuration-examples.ts
// Exemplos de como configurar e usar os diferentes modos do agente

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from './example-tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Exemplo 1: Configuração do modo Chat (padrão)
function chatModeExample() {
  console.log('=== MODO CHAT (PADRÃO) ===');
  
  const agent = new ChatAgent({
    name: "Assistente Chat",
    instructions: "Você é um assistente útil que responde em português.",
    provider: "openai-generic", // Provider é obrigatório
    mode: "chat" // Modo padrão, pode ser omitido
  });
  
  console.log('Configuração:', agent.getConfig());
  return agent;
}

// Exemplo 2: Configuração do modo ReAct
function reactModeExample() {
  console.log('\n=== MODO REACT ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
    provider: "openai-generic",
    mode: "react" // Modo ReAct para tarefas que requerem raciocínio e ação
  });
  
  // Registrar tools necessárias para o modo ReAct
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Configuração:', agent.getConfig());
  console.log('Tools registradas:', agent.listTools().map(t => t.name));
  return agent;
}

// Exemplo 3: Configuração do modo Planning
function planningModeExample() {
  console.log('\n=== MODO PLANNING ===');
  
  const agent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas através de planejamento hierárquico.",
    provider: "openai-generic",
    mode: "planning" // Modo Planning para tarefas complexas que requerem planejamento
  });
  
  // Registrar tools necessárias para o modo Planning
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Configuração:', agent.getConfig());
  console.log('Tools registradas:', agent.listTools().map(t => t.name));
  return agent;
}

// Exemplo 4: Comparação entre modos
async function compareModes() {
  console.log('\n=== COMPARAÇÃO ENTRE MODOS ===');
  
  const task = "Qual é a hora atual e qual é o clima em São Paulo?";
  
  // Modo Chat
  const chatAgent = chatModeExample();
  console.log('\n--- Modo Chat ---');
  try {
    const chatResponse = await chatAgent.sendMessage(task);
    console.log('Resposta Chat:', chatResponse);
  } catch (error) {
    console.error('Erro no modo Chat:', error);
  }
  
  // Modo ReAct
  const reactAgent = reactModeExample();
  console.log('\n--- Modo ReAct ---');
  try {
    const reactResponse = await reactAgent.sendMessage(task);
    console.log('Resposta ReAct:', reactResponse);
  } catch (error) {
    console.error('Erro no modo ReAct:', error);
  }
  
  // Modo Planning
  const planningAgent = planningModeExample();
  console.log('\n--- Modo Planning ---');
  try {
    const planningResponse = await planningAgent.sendMessage(task);
    console.log('Resposta Planning:', planningResponse);
  } catch (error) {
    console.error('Erro no modo Planning:', error);
  }
}

// Função principal para demonstrar todas as configurações
async function main() {
  console.log('=== EXEMPLOS DE CONFIGURAÇÃO DE MODOS ===');
  
  // Demonstrar configurações individuais
  chatModeExample();
  reactModeExample();
  planningModeExample();
  
  // Comparar modos com uma tarefa específica
  await compareModes();
  
  console.log('\n=== FIM DOS EXEMPLOS DE CONFIGURAÇÃO ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { chatModeExample, reactModeExample, planningModeExample, compareModes, main };