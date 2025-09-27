// tests/planning-instructions-verification.ts
// Verificação de processamento de instruções no modo Planning

import { ChatAgent } from '../../src/core/chat-agent-core';

async function verifyPlanningInstructionsProcessing() {
  console.log('=== VERIFICAÇÃO DE PROCESSAMENTO DE INSTRUÇÕES NO MODO PLANNING ===');
  
  // Teste 1: Criar agente com instruções e verificar histórico
  console.log('\n--- Teste 1: Instruções como mensagem do sistema no modo Planning ---');
  const agent = new ChatAgent({
    name: "Test Agent",
    instructions: "Você é um assistente especializado em planejamento de tarefas.",
    provider: "openai-generic",
    mode: "planning"
  });
  
  const history = agent.getHistory();
  const systemMessage = history.find(msg => msg.role === 'system');
  
  if (systemMessage) {
    console.log('✅ Instruções adicionadas como mensagem do sistema:');
    console.log('   Conteúdo:', systemMessage.content);
  } else {
    console.log('❌ Instruções NÃO adicionadas como mensagem do sistema');
  }
  
  // Teste 2: Verificar se o método generatePlanningPrompt inclui instruções
  console.log('\n--- Teste 2: Inclusão de instruções no prompt Planning ---');
  const task = "Planeje como calcular a soma de 100 + 200";
  const toolsDescription = "calculate: Realiza operações matemáticas básicas";
  const historyWithInstructions = [
    { role: 'system', content: 'Você é um assistente especializado em planejamento de tarefas.' },
    { role: 'user', content: task }
  ];
  
  // Chamar o método generatePlanningPrompt diretamente
  const prompt = (agent as any)['generatePlanningPrompt'](task, toolsDescription, historyWithInstructions);
  
  if (prompt.includes('System Instructions: Você é um assistente especializado em planejamento de tarefas.')) {
    console.log('✅ Instruções incluídas no prompt Planning');
  } else {
    console.log('❌ Instruções NÃO incluídas no prompt Planning');
  }
  
  // Teste 3: Verificar que o prompt ainda funciona sem instruções
  console.log('\n--- Teste 3: Prompt Planning sem instruções ---');
  const historyWithoutInstructions = [
    { role: 'user', content: task }
  ];
  
  const promptWithoutInstructions = (agent as any)['generatePlanningPrompt'](task, toolsDescription, historyWithoutInstructions);
  
  if (promptWithoutInstructions.includes('Você é um assistente avançado com capacidades de thinking')) {
    console.log('✅ Prompt Planning gerado corretamente sem instruções');
  } else {
    console.log('❌ Prompt Planning NÃO gerado corretamente sem instruções');
  }
  
  console.log('\n=== FIM DA VERIFICAÇÃO ===');
}

verifyPlanningInstructionsProcessing().catch(console.error);