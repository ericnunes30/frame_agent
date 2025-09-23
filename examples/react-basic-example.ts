// examples/react-basic-example.ts
// Exemplo básico do modo ReAct usando ferramentas simples

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool } from './example-tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function reactBasicExample() {
  console.log('=== EXEMPLO BÁSICO DO MODO REACT ===');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: "Assistente ReAct Básico",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas simples.",
    provider: "openai-generic", // Usará a API genérica configurada
    mode: "react"
  });
  
  // Registrar tools disponíveis
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  console.log('Agente ReAct configurado com tools:', agent.listTools().map(t => t.name));
  
  // Exemplo de tarefa simples que requer uma etapa
  const tasks = [
    "Qual é a hora atual?",
    "Calcule 15 + 25"
  ];
  
  for (const task of tasks) {
    console.log(`\n--- Tarefa: ${task} ---`);
    try {
      const response = await agent.sendMessage(task);
      console.log('Resposta:', response);
      
      // Mostrar histórico de mensagens
      console.log('\nHistórico de mensagens:');
      const history = agent.getHistory();
      history.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
      });
    } catch (error) {
      console.error('Erro ao executar tarefa:', error);
    }
  }
  
  console.log('\n=== FIM DO EXEMPLO BÁSICO ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  reactBasicExample().catch(console.error);
}

export { reactBasicExample };