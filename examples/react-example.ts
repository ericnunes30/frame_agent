// examples/react-example.ts
// Exemplo de uso do modo ReAct

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool } from './example-tools';

async function reactExample() {
  console.log('=== EXEMPLO DE USO DO MODO REACT ===');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
    provider: "openai-generic", // Usará a API genérica configurada
    mode: "react"
  });
  
  // Registrar tools disponíveis
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  
  console.log('Agente ReAct configurado com tools:', agent.listTools().map(t => t.name));
  
  // Exemplo de tarefa que requer múltiplas etapas
  const tasks = [
    "Qual é a hora atual? Some 100 a essa hora e me diga o resultado.",
    "Calcule a soma de 25 e 75, depois multiplique o resultado por 2."
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
  
  console.log('\n=== FIM DO EXEMPLO ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  reactExample().catch(console.error);
}

export { reactExample };