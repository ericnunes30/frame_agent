// examples/planning-example.ts
// Exemplo do modo Planning para tarefas complexas

import { ChatAgent } from '../src/chat-agent-core';
import { calculatorTool, dateTimeTool, weatherTool } from './example-tools';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function planningExample() {
  console.log('=== EXEMPLO DO MODO PLANNING ===');
  
  // Criar agente com modo Planning
  const agent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas através de planejamento hierárquico.",
    provider: "openai-generic", // Usará a API genérica configurada
    mode: "planning"
  });
  
  // Registrar todas as tools disponíveis
  agent.registerTool(calculatorTool);
  agent.registerTool(dateTimeTool);
  agent.registerTool(weatherTool);
  
  console.log('Agente Planning configurado com tools:', agent.listTools().map(t => t.name));
  
  // Exemplo de tarefas complexas que requerem planejamento
  const tasks = [
    "Planeje minha semana: verifique a data atual, calcule quantos dias faltam para o final do mês e me diga qual será o clima nesses dias.",
    "Analise a tarefa: some 100 à hora atual, multiplique por 2 e me diga qual é o resultado final."
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
  
  console.log('\n=== FIM DO EXEMPLO PLANNING ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  planningExample().catch(console.error);
}

export { planningExample };