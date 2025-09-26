// examples/test-planning-prompt.ts
// Teste para verificar se o prompt do Planning está sendo gerado corretamente

import { ChatAgent } from '../src/core/chat-agent-core';
import { calculatorTool } from './example-tools';

async function testPlanningPrompt() {
  console.log('=== TESTE DE GERAÇÃO DO PROMPT PLANNING ===');
  
  // Criar agente Planning com instruções personalizadas
  const agent = new ChatAgent({
    name: "Assistente Planning",
    instructions: "Você é um assistente especializado em planejamento de tarefas. Sempre que planejar, divida as tarefas em etapas claras e bem definidas.",
    provider: "openai-generic",
    mode: "planning"
  });
  
  // Registrar tool
  agent.registerTool(calculatorTool);
  
  console.log('Agente Planning criado com instruções personalizadas');
  
  // Verificar histórico
  const history = agent.getHistory();
  console.log('\nHistórico do agente:');
  history.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
  });
  
  // Testar geração de prompt Planning diretamente
  console.log('\n--- Testando geração de prompt Planning ---');
  const task = "Planeje como calcular a soma de 100 + 200";
  const toolsDescription = "calculate: Realiza operações matemáticas básicas";
  
  // Chamar o método generatePlanningPrompt diretamente
  const prompt = (agent as any)['generatePlanningPrompt'](task, toolsDescription, history);
  
  console.log('Prompt Planning gerado:');
  console.log('='.repeat(50));
  console.log(prompt.substring(0, 1000) + '...'); // Mostrar apenas os primeiros 1000 caracteres
  console.log('='.repeat(50));
  
  // Verificar se as instruções estão no prompt
  if (prompt.includes('System Instructions: Você é um assistente especializado em planejamento de tarefas')) {
    console.log('\n✅ INSTRUÇÕES PERSONALIZADAS INCLUÍDAS NO PROMPT PLANNING!');
  } else {
    console.log('\n❌ INSTRUÇÕES PERSONALIZADAS NÃO ENCONTRADAS NO PROMPT PLANNING!');
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  testPlanningPrompt().catch(console.error);
}

export { testPlanningPrompt };