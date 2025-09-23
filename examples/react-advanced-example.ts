// examples/react-advanced-example.ts
// Exemplo avançado do modo ReAct com múltiplas ferramentas

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from './example-tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function reactAdvancedExample() {
  console.log('=== EXEMPLO AVANÇADO DO MODO REACT ===');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: "Assistente ReAct Avançado",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas com múltiplas etapas.",
    provider: "openai-generic", // Usará a API genérica configurada
    mode: "react"
  });
  
  // Registrar todas as tools disponíveis
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Agente ReAct configurado com tools:', agent.listTools().map(t => t.name));
  
  // Exemplo de tarefas complexas que requerem múltiplas etapas
  const tasks = [
    "Qual é a hora atual? Some 100 a essa hora e me diga o resultado.",
    "Calcule a soma de 25 e 75, depois multiplique o resultado por 2.",
    "Qual é a hora atual e qual é o clima em São Paulo?",
    "Calcule quantas horas faltam até o final do dia e me diga qual será a data amanhã."
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
  
  console.log('\n=== FIM DO EXEMPLO AVANÇADO ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  reactAdvancedExample().catch(console.error);
}

export { reactAdvancedExample };