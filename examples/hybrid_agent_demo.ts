import { HybridAgent } from '../src/core/hybrid-agent-core';
import { OpenAIAdapter } from '../src/adapters/openai-adapter';

// Exemplo de uso do novo modelo híbrido adaptativo
async function exemploUso() {
  console.log('🚀 Iniciando demonstração do modelo híbrido adaptativo');

  // Cria um adaptador OpenAI
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  const adapter = new OpenAIAdapter({
    apiKey,
    model: 'gpt-4o-mini',
  });

  // Cria o agente híbrido
  const agent = new HybridAgent(adapter);

  // Registro de uma ferramenta simples para demonstração
  agent.registerTool({
    name: 'get_current_time',
    description: 'Obtém a hora atual',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (args: any) => {
      return { time: new Date().toISOString(), formatted: new Date().toLocaleTimeString() };
    },
  });

  console.log('\\n💬 Modo conversacional inicial:');
  const resposta1 = await agent.sendMessage('Oi! Tudo bem?');
  console.log('🤖 Resposta:', resposta1);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🔧 Transição automática para modo ReAct quando necessário:');
  const resposta2 = await agent.sendMessage('Que horas são agora?');
  console.log('🤖 Resposta:', resposta2);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n💬 Volta ao modo conversacional após uso de ferramenta:');
  const resposta3 = await agent.sendMessage('Obrigado! A hora está perfeita.');
  console.log('🤖 Resposta:', resposta3);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🌍 Funciona em qualquer idioma (internacionalização):');
  const resposta4 = await agent.sendMessage('Hello! What time is it?');
  console.log('🤖 Resposta:', resposta4);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🎯 Demonstração de tarefa complexa com múltiplas etapas:');
  const resposta5 = await agent.sendMessage('Por favor, me diga que horas são e depois crie uma saudação com essa informação');
  console.log('🤖 Resposta:', resposta5);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n✅ Demonstração concluída com sucesso!');
  console.log('✨ O modelo híbrido adaptativo está operando conforme o planejado');
  console.log('✨ Combina conversação fluida com execução estruturada de ações');
  console.log('✨ Detecção automática de necessidade de ferramentas');
  console.log('✨ Internacionalização completa (sem dependência de palavras-chave)');
}

// Executa o exemplo
exemploUso().catch(console.error);