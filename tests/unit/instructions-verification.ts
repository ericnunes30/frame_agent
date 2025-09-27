// tests/instructions-verification.ts
// Verificação simples para confirmar que as instruções estão sendo processadas

import { ChatAgent } from '../../src/core/chat-agent-core';
import { PromptBuilder } from '../../src/core/prompt-builder';

async function verifyInstructionsProcessing() {
  console.log('=== VERIFICAÇÃO DE PROCESSAMENTO DE INSTRUÇÕES ===');
  
  // Teste 1: Verificar se as instruções são adicionadas como mensagem do sistema
  console.log('\n--- Teste 1: Instruções como mensagem do sistema ---');
  const agent = new ChatAgent({
    name: "Test Agent",
    instructions: "Você é um assistente especializado em testes.",
    provider: "openai-generic",
    mode: "chat"
  });
  
  const history = agent.getHistory();
  const systemMessage = history.find(msg => msg.role === 'system');
  
  if (systemMessage) {
    console.log('✅ Instruções adicionadas como mensagem do sistema:');
    console.log('   Conteúdo:', systemMessage.content);
  } else {
    console.log('❌ Instruções NÃO adicionadas como mensagem do sistema');
  }
  
  // Teste 2: Verificar se o PromptBuilder inclui instruções no prompt ReAct
  console.log('\n--- Teste 2: Inclusão de instruções no prompt ReAct ---');
  const promptBuilder = new PromptBuilder();
  const task = "Test task";
  const toolsDescription = "test_tool: Test tool description";
  const steps: any[] = [];
  const historyWithInstructions = [
    { role: 'system', content: 'Você é um assistente especializado em testes.' },
    { role: 'user', content: 'Test task' }
  ];
  
  const prompt = promptBuilder.buildReActPrompt(task, toolsDescription, steps, historyWithInstructions);
  
  if (prompt.includes('System Instructions: Você é um assistente especializado em testes.')) {
    console.log('✅ Instruções incluídas no prompt ReAct');
  } else {
    console.log('❌ Instruções NÃO incluídas no prompt ReAct');
  }
  
  // Teste 3: Verificar que o prompt ainda funciona sem instruções
  console.log('\n--- Teste 3: Prompt ReAct sem instruções ---');
  const historyWithoutInstructions = [
    { role: 'user', content: 'Test task' }
  ];
  
  const promptWithoutInstructions = promptBuilder.buildReActPrompt(task, toolsDescription, steps, historyWithoutInstructions);
  
  if (promptWithoutInstructions.includes('You are an intelligent agent designed to solve user tasks')) {
    console.log('✅ Prompt ReAct gerado corretamente sem instruções');
  } else {
    console.log('❌ Prompt ReAct NÃO gerado corretamente sem instruções');
  }
  
  console.log('\n=== FIM DA VERIFICAÇÃO ===');
}

verifyInstructionsProcessing().catch(console.error);