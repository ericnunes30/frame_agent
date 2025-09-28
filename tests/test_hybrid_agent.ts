import { HybridAgent } from '../src/core/hybrid-agent-core';
import { OpenAIAdapter } from '../src/adapters/openai-adapter';

// Teste de integração para o modelo híbrido adaptativo
async function testHybridAgent() {
  console.log('Testando o novo modelo híbrido adaptativo...');

  // Cria um adaptador (usando OpenAI como exemplo)
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  const adapter = new OpenAIAdapter({
    apiKey,
    model: 'gpt-4o-mini',
  });

  // Cria o agente híbrido
  const agent = new HybridAgent(adapter);

  // Registro de uma ferramenta de exemplo
  agent.registerTool({
    name: 'get_current_time',
    description: 'Get the current time',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (args: any) => {
      return { time: new Date().toISOString() };
    },
  });

  console.log('\\n--- Teste 1: Conversa inicial (modo chat) ---');
  const response1 = await agent.sendMessage('Olá, como você está?');
  console.log('Resposta:', response1);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 2: Pedido que requer ferramentas (deve entrar em modo ReAct) ---');
  const response2 = await agent.sendMessage('Que horas são agora?');
  console.log('Resposta:', response2);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 3: Continuação da conversa após uso de ferramenta ---');
  const response3 = await agent.sendMessage('Obrigado pela informação!');
  console.log('Resposta:', response3);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 4: Tarefa complexa (modo ReAct) ---');
  const response4 = await agent.sendMessage('Por favor, crie um arquivo com uma saudação em português');
  console.log('Resposta:', response4);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 5: Conversa após tarefa complexa ---');
  const response5 = await agent.sendMessage('Agora posso considerar esta tarefa concluída?');
  console.log('Resposta:', response5);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 6: Internacionalização (modo chat em inglês) ---');
  const response6 = await agent.sendMessage('Hello! Can you tell me about yourself?');
  console.log('Resposta:', response6);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\n--- Teste 7: Internacionalização (modo ReAct em francês/alemão) ---');
  const response7 = await agent.sendMessage('Quelle heure est-il?');
  console.log('Resposta:', response7);
  console.log('Estado híbrido:', agent.getHybridState());

  console.log('\\nTeste de modelo híbrido adaptativo concluído!');
}

// Executa o teste
testHybridAgent().catch(console.error);