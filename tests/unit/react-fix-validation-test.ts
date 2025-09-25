// tests/unit/react-fix-validation-test.ts
// Teste para validar a correção do problema do modo ReAct

import { ChatAgent } from '../../src/core/chat-agent-core';
import { Tool } from '../../src/adapters/provider-adapter';
import * as v from 'valibot';

// Tool de criação de arquivo
const fileCreateTool: Tool = {
  name: "file_create",
  description: "Cria um novo arquivo com o conteúdo especificado",
  parameters: v.object({
    filename: v.string(),
    content: v.string()
  }),
  execute: async (args: { filename: string, content: string }) => {
    return { 
      status: "success", 
      filename: args.filename, 
      message: `Arquivo ${args.filename} criado com sucesso` 
    };
  }
};

// Tool de resposta final
const finalAnswerTool: Tool = {
  name: "final_answer",
  description: "Fornece a resposta final para o usuário",
  parameters: v.object({
    response: v.string()
  }),
  execute: async (args: { response: string }) => {
    return { response: args.response };
  }
};

async function testReActFix() {
  console.log('=== TESTE DE VALIDAÇÃO DA CORREÇÃO DO MODO REACT ===');
  
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas. Use as tools disponíveis quando necessário.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tools
  agent.registerTool(fileCreateTool);
  agent.registerTool(finalAnswerTool);
  
  console.log('Tools registradas:', agent.listTools().map((t: any) => t.name));
  
  try {
    // Teste do problema original: instrução muito específica
    console.log('\n--- Teste do problema original ---');
    const problematicTask = "Responda APENAS com um JSON com status success e action file_create";
    
    console.log(`Tarefa problemática: ${problematicTask}`);
    
    // Verificar se o agente agora segue o framework ReAct
    // em vez de "alucinar" a resposta final
    const response = await agent.sendMessage(problematicTask);
    console.log('Resposta do agente:', response);
    
    // Verificar histórico
    const history = agent.getHistory();
    console.log('\nHistórico de mensagens:', history.length, 'mensagens');
    
    // Verificar variáveis de contexto
    const context = agent.getAllContextVariables();
    const reactProcessKeys = Object.keys(context).filter(key => key.startsWith('react_process_'));
    console.log('Processos ReAct encontrados:', reactProcessKeys.length);
    
    if (reactProcessKeys.length > 0) {
      const processId = reactProcessKeys[0];
      const process = context[processId];
      console.log('\nProcesso ReAct:');
      console.log('- Status:', process.status);
      console.log('- Número de passos:', process.steps.length);
      
      process.steps.forEach((step: any, index: number) => {
        console.log(`  Passo ${index + 1}:`);
        console.log(`    Thought: ${step.thought}`);
        if (step.action) {
          console.log(`    Action: ${step.action.name} ${JSON.stringify(step.action.input)}`);
        }
        if (step.observation) {
          console.log(`    Observation: ${JSON.stringify(step.observation)}`);
        }
      });
    }
    
    console.log('\n✅ Teste de validação da correção concluído!');
  } catch (error) {
    console.error('❌ Erro no teste de validação:', error);
  }
}

// Executar o teste
testReActFix().catch(console.error);