import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/adapters/provider-adapter';

// Ferramenta de exemplo simples
const fileCreateTool: Tool = {
  name: 'file_create',
  description: 'Cria um novo arquivo com o conteúdo especificado',
  parameters: {
    type: 'object',
    properties: {
      filename: { type: 'string', description: 'Nome do arquivo a ser criado' },
      content: { type: 'string', description: 'Conteúdo do arquivo' }
    },
    required: ['filename', 'content']
  },
  execute: async (args: any) => {
    console.log(`Criando arquivo ${args.filename} com conteúdo: ${args.content}`);
    return { status: 'success', filename: args.filename, message: `Arquivo ${args.filename} criado com sucesso` };
  }
};

async function testReActMode() {
  console.log('=== TESTANDO CORREÇÃO DO MODO REACT ===');
  
  // Criar agente com modo ReAct
  const agent = new ChatAgent({
    name: "Test Agent",
    instructions: "Você é um assistente que usa o framework ReAct.",
    provider: "openai-generic",
    mode: "react",
    temperature: 0.7
  });
  
  // Registrar a tool
  agent.registerTool(fileCreateTool);
  
  console.log('Agente criado com modo ReAct');
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  // Testar com o prompt problemático
  const task = "Responda APENAS com um JSON com status success e action file_create";
  
  console.log('\n=== ENVIANDO TAREFA ===');
  console.log('Tarefa:', task);
  
  try {
    const response = await agent.sendMessage(task);
    console.log('\n=== RESPOSTA DO AGENTE ===');
    console.log(response);
  } catch (error) {
    console.error('\n=== ERRO ===');
    console.error(error);
  }
}

// Executar o teste
testReActMode().catch(console.error);