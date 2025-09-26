// tests/instructions-processing-test.ts
// Teste simples para verificar o processamento de instruções sem chamar a API

import { ChatAgent } from '../../src/core/chat-agent-core';
import { PromptBuilder } from '../../src/core/prompt-builder';

function testInstructionsInChatAgent() {
  console.log('=== TESTE DE PROCESSAMENTO DE INSTRUÇÕES NO CHAT AGENT ===');
  
  // Teste 1: Criar agente com instruções
  console.log('\n--- Teste 1: Criar agente com instruções ---');
  const agent = new ChatAgent({
    name: "Test Agent",
    instructions: "Você é um assistente especializado em testes automatizados.",
    provider: "openai-generic",
    mode: "chat"
  });
  
  // Verificar se as instruções estão no histórico
  const history = agent.getHistory();
  console.log('Histórico de mensagens:', history.length);
  
  const systemMessage = history.find(msg => msg.role === 'system');
  if (systemMessage) {
    console.log('✅ Mensagem do sistema encontrada:');
    console.log('   Conteúdo:', systemMessage.content.substring(0, 50) + '...');
  } else {
    console.log('❌ Mensagem do sistema NÃO encontrada');
  }
  
  // Teste 2: Verificar configuração do agente
  console.log('\n--- Teste 2: Verificar configuração do agente ---');
  const config = agent.getConfig();
  console.log('Configuração do agente:');
  console.log('  Nome:', config.name);
  console.log('  Modo:', config.mode);
  console.log('  Provider:', config.provider);
  console.log('  Instruções definidas:', !!config.instructions);
  
  console.log('\n✅ Teste de processamento de instruções concluído!');
}

function testPromptBuilderWithInstructions() {
  console.log('\n=== TESTE DO PROMPT BUILDER COM INSTRUÇÕES ===');
  
  const promptBuilder = new PromptBuilder();
  
  // Teste 1: Prompt ReAct com instruções
  console.log('\n--- Teste 1: Prompt ReAct com instruções ---');
  const reactPrompt = promptBuilder.buildReActPrompt(
    "Test task",
    "test_tool: Test tool",
    [],
    [
      { role: 'system', content: 'Você é um assistente especializado em testes.' },
      { role: 'user', content: 'Test task' }
    ]
  );
  
  if (reactPrompt.includes('System Instructions: Você é um assistente especializado em testes.')) {
    console.log('✅ Instruções incluídas no prompt ReAct');
  } else {
    console.log('❌ Instruções NÃO incluídas no prompt ReAct');
  }
  
  // Teste 2: Prompt ReAct sem instruções
  console.log('\n--- Teste 2: Prompt ReAct sem instruções ---');
  const reactPromptWithoutInstructions = promptBuilder.buildReActPrompt(
    "Test task",
    "test_tool: Test tool",
    [],
    [
      { role: 'user', content: 'Test task' }
    ]
  );
  
  if (reactPromptWithoutInstructions.includes('You are an intelligent agent')) {
    console.log('✅ Prompt ReAct gerado corretamente sem instruções');
  } else {
    console.log('❌ Prompt ReAct NÃO gerado corretamente sem instruções');
  }
  
  console.log('\n✅ Teste do Prompt Builder concluído!');
}

function testChatAgentWithDifferentModes() {
  console.log('\n=== TESTE DE PROCESSAMENTO DE INSTRUÇÕES EM DIFERENTES MODOS ===');
  
  const modes: any[] = ['chat', 'react', 'planning'];
  
  for (const mode of modes) {
    console.log(`\n--- Testando modo: ${mode} ---`);
    const agent = new ChatAgent({
      name: `${mode} Agent`,
      instructions: `Você é um assistente especializado no modo ${mode}.`,
      provider: "openai-generic",
      mode: mode
    });
    
    const history = agent.getHistory();
    const systemMessage = history.find(msg => msg.role === 'system');
    
    if (systemMessage) {
      console.log(`✅ Instruções adicionadas como mensagem do sistema no modo ${mode}`);
    } else {
      console.log(`❌ Instruções NÃO adicionadas como mensagem do sistema no modo ${mode}`);
    }
  }
  
  console.log('\n✅ Teste de modos concluído!');
}

function main() {
  testInstructionsInChatAgent();
  testPromptBuilderWithInstructions();
  testChatAgentWithDifferentModes();
  console.log('\n=== TODOS OS TESTES CONCLUÍDOS ===');
}

main();