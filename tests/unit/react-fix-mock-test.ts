import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool, ProviderAdapter } from '../../src/adapters/provider-adapter';

// Mock do provider adapter para testes
class MockProviderAdapter implements ProviderAdapter {
  sendMessage(params: any): Promise<any> {
    // const { messages } = params;
    const lastMessage = params.messages[params.messages.length - 1];
    
    console.log('\n=== CHAMADA PARA PROVIDER MOCK ===');
    console.log('Mensagem recebida:', lastMessage);
    
    // Simular resposta do modelo com base no conteúdo da mensagem
    if (lastMessage.content.includes('Responda APENAS com um JSON com status success e action file_create')) {
      // Com a correção, o modelo deve seguir o formato ReAct
      return Promise.resolve({ content: 'Thought: O usuário quer que eu use a ferramenta file_create. Vou executar essa ação.\nAction: file_create\nAction Input: {"filename": "teste.txt", "content": "Conteúdo de teste"}' });
    }
    
    if (lastMessage.content.includes('Thought:')) {
      // Simular uma resposta de thought/action
      return Promise.resolve({ content: 'Thought: Vou usar a ferramenta file_create para criar o arquivo solicitado.\nAction: file_create\nAction Input: {"filename": "output.json", "content": "{\\"status\\": \\"success\\", \\"action\\": \\"file_create\\"}"}' });
    }
    
    // Resposta padrão
    return Promise.resolve({ content: 'Thought: Não tenho certeza do que fazer.\nAction: final_answer\nAction Input: {"message": "Não consegui entender a solicitação."}' });
  }
  
  sendStructuredMessage(params: any): Promise<any> {
    return Promise.resolve({ content: JSON.stringify({ status: 'success' }) });
  }
  
  supportsTools(): boolean {
    return true;
  }
  
  supportsStreaming(): boolean {
    return false;
  }
}

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
    console.log(`\n=== EXECUTANDO TOOL: file_create ===`);
    console.log(`Criando arquivo ${args.filename} com conteúdo: ${args.content}`);
    return { status: 'success', filename: args.filename, message: `Arquivo ${args.filename} criado com sucesso` };
  }
};

// Subclasse do ChatAgent para usar o mock
class MockChatAgent extends ChatAgent {
  constructor(config: any) {
    super(config);
    // Substituir o provider adapter pelo mock
    (this as any).providerAdapter = new MockProviderAdapter();
  }
}

async function testReActMode() {
  console.log('=== TESTANDO CORREÇÃO DO MODO REACT COM MOCK ===');
  
  // Criar agente com modo ReAct e mock provider
  const agent: any = new MockChatAgent({
    name: "Test Agent",
    instructions: "Você é um assistente que usa o framework ReAct.",
    provider: "openai-generic",
    mode: "react",
    temperature: 0.7
  });
  
  // Registrar a tool
  agent.registerTool(fileCreateTool);
  
  console.log('Agente criado com modo ReAct e mock provider');
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  // Testar com o prompt problemático
  const task = "Responda APENAS com um JSON com status success e action file_create";
  
  console.log('\n=== ENVIANDO TAREFA ===');
  console.log('Tarefa:', task);
  
  try {
    const response = await agent.sendMessage(task);
    console.log('\n=== RESPOSTA FINAL DO AGENTE ===');
    console.log(response);
    
    // Verificar se o processo ReAct foi armazenado
    const processKeys = Object.keys(agent.memoryManager.getAllVariables()).filter(key => key.startsWith('react_process_'));
    if (processKeys.length > 0) {
      const processId = processKeys[0];
      const process = agent.memoryManager.getVariable(processId);
      console.log('\n=== PROCESSO REACT ===');
      console.log('Status:', process.status);
      console.log('Número de passos:', process.steps.length);
      console.log('Passos:');
      process.steps.forEach((step: any, index: number) => {
        console.log(`  ${index + 1}. Thought: ${step.thought}`);
        if (step.action) {
          console.log(`     Action: ${step.action.name} ${JSON.stringify(step.action.input)}`);
        }
        if (step.observation) {
          console.log(`     Observation: ${JSON.stringify(step.observation)}`);
        }
      });
    }
  } catch (error) {
    console.error('\n=== ERRO ===');
    console.error(error);
  }
}

// Executar o teste
testReActMode().catch(console.error);