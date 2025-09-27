// examples/test-react-prompt.ts
// Teste para verificar se o prompt do ReAct está sendo gerado corretamente

import { ChatAgent } from '../src/core/chat-agent-core';
import { PromptBuilder } from '../src/core/prompt-builder';
import { calculatorTool } from './example-tools';

async function testReActPrompt() {
  console.log('=== TESTE DE GERAÇÃO DO PROMPT REACT ===');
  
  // Criar agente ReAct com instruções personalizadas
  const agent = new ChatAgent({
    name: "Assistente ReAct",
    instructions: "Você é um assistente especializado em matemática. Sempre que fizer cálculos, explique seu raciocínio passo a passo.",
    provider: "openai-generic",
    mode: "react"
  });
  
  // Registrar tool
  agent.registerTool(calculatorTool);
  
  console.log('Agente ReAct criado com instruções personalizadas');
  
  // Verificar histórico
  const history = agent.getHistory();
  console.log('\nHistórico do agente:');
  history.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
  });
  
  // Testar geração de prompt ReAct diretamente
  console.log('\n--- Testando geração de prompt ReAct ---');
  const promptBuilder = new PromptBuilder();
  const task = "Calcule 10 + 5";
  const toolsDescription = "calculate: Realiza operações matemáticas básicas";
  const steps: any[] = [];
  
  const prompt = promptBuilder.buildReActPrompt(task, toolsDescription, steps, history);
  
  console.log('Prompt ReAct gerado:');
  console.log('='.repeat(50));
  console.log(prompt);
  console.log('='.repeat(50));
  
  // Verificar se as instruções estão no prompt
  if (prompt.includes('System Instructions: Você é um assistente especializado em matemática')) {
    console.log('\n✅ INSTRUÇÕES PERSONALIZADAS INCLUÍDAS NO PROMPT REACT!');
  } else {
    console.log('\n❌ INSTRUÇÕES PERSONALIZADAS NÃO ENCONTRADAS NO PROMPT REACT!');
  }
  
  console.log('\n=== FIM DO TESTE ===');
}

// Executar exemplo se este arquivo for chamado diretamente
if (require.main === module) {
  testReActPrompt().catch(console.error);
}

export { testReActPrompt };