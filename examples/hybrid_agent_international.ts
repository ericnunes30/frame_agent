import { HybridAgent } from '../src/core/hybrid-agent-core';
import { OpenAIAdapter } from '../src/adapters/openai-adapter';

// Exemplo de uso internacionalizado do modelo híbrido adaptativo
async function exemploInternacionalizado() {
  console.log('🌍 Demonstração de internacionalização do modelo híbrido');

  // Cria um adaptador OpenAI
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  const adapter = new OpenAIAdapter({
    apiKey,
    model: 'gpt-4o-mini',
  });

  // Cria o agente híbrido
  const agent = new HybridAgent(adapter);

  // Registro de ferramentas para diferentes idiomas
  agent.registerTool({
    name: 'get_current_time',
    description: 'Obtém a hora atual em qualquer fuso horário',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Fuso horário opcional (ex: "UTC", "America/Sao_Paulo")'
        }
      },
    },
    execute: async (args: any) => {
      const timezone = args.timezone || 'UTC';
      const now = new Date();
      return {
        time: now.toISOString(),
        formatted: now.toLocaleTimeString('pt-BR', { timeZone: timezone }),
        timezone: timezone
      };
    },
  });

  agent.registerTool({
    name: 'translate_text',
    description: 'Traduz texto entre idiomas',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto para traduzir' },
        target_language: { type: 'string', description: 'Código do idioma de destino (ex: "en", "es", "fr", "pt")' }
      },
    },
    execute: async (args: any) => {
      // Simulação de tradução - em um caso real, usaria uma API de tradução
      return {
        original: args.text,
        translated: `[Tradução simulada para ${args.target_language}]: ${args.text}`,
        target_language: args.target_language
      };
    },
  });

  console.log('\\n🇧🇷 Português - Conversação inicial:');
  const resposta1 = await agent.sendMessage('Olá! Como você está?');
  console.log('🤖 Resposta:', resposta1);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🇬🇧 Inglês - Solicitação que requer ferramenta:');
  const resposta2 = await agent.sendMessage('What time is it in São Paulo?');
  console.log('🤖 Resposta:', resposta2);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🇪🇸 Espanhol - Solicitação de tradução:');
  const resposta3 = await agent.sendMessage('Por favor, traduza "Hello, how are you?" para espanhol');
  console.log('🤖 Resposta:', resposta3);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🇫🇷 Francês - Continuação da conversa:');
  const resposta4 = await agent.sendMessage('Merci beaucoup! C\'est très utile.');
  console.log('🤖 Resposta:', resposta4);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🇩🇪 Alemão - Nova solicitação de ferramenta:');
  const resposta5 = await agent.sendMessage('Können Sie die Uhrzeit in Berlin erhalten?');
  console.log('🤖 Resposta:', resposta5);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n🇨🇳 Chinês - Teste de detecção sem palavras-chave específicas:');
  const resposta6 = await agent.sendMessage('现在北京的时间是多少？');
  console.log('🤖 Resposta:', resposta6);
  console.log('📊 Estado:', agent.getHybridState());

  console.log('\\n✅ Demonstração internacionalizada concluída com sucesso!');
  console.log('✨ O modelo híbrido adaptativo funciona em qualquer idioma');
  console.log('✨ Sem dependência de palavras-chave específicas');
  console.log('✨ Detecção semântica de necessidade de ferramentas');
}

// Executa o exemplo internacionalizado
exemploInternacionalizado().catch(console.error);