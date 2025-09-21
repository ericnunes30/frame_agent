# Documentação de Modo Streaming

## Visão Geral

O modo streaming permite que as respostas dos modelos LLM sejam recebidas em partes (chunks), ao invés de esperar pela resposta completa. Isso melhora a experiência do usuário, especialmente para respostas longas, pois permite mostrar o conteúdo conforme ele é gerado.

## Suporte Atual

Atualmente, o BAML não suporta diretamente o modo streaming através da propriedade `stream` nas funções. Estamos investigando alternativas para implementar essa funcionalidade.

## Implementação Futura

Quando o suporte for adicionado, a implementação provavelmente seguirá este padrão:

### Definição BAML

```baml
function ChatWithStreaming(message: string) -> string {
  client OpenAIGPT4oMini
  stream true
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}
```

### Uso no Agente

```typescript
class ChatAgent {
  async sendMessageWithStreaming(
    message: string, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      let fullResponse = '';
      
      // Chamar a função BAML com suporte a streaming
      const stream = await b.ChatWithStreaming(message);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        onChunk(chunk);
      }
      
      // Adicionar ao histórico
      this.memoryManager.addMessage({ role: 'user', content: message });
      this.memoryManager.addMessage({ role: 'assistant', content: fullResponse });
      
      return fullResponse;
    } catch (error) {
      console.error('Erro ao enviar mensagem com streaming:', error);
      throw error;
    }
  }
}
```

### Exemplo de Uso

```typescript
import { ChatAgent } from './chat-agent-core';

const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-gpt-4o-mini"
});

// Enviar mensagem com streaming
const response = await agent.sendMessageWithStreaming(
  'Escreva uma história longa sobre aventuras espaciais',
  (chunk) => {
    // Processar cada chunk conforme ele chega
    process.stdout.write(chunk);
  }
);

console.log('\nResposta completa:', response);
```

## Considerações

1. O suporte a streaming depende do provedor LLM
2. Nem todos os modelos suportam streaming
3. A implementação exata pode variar conforme o suporte do BAML
4. O gerenciamento de histórico deve considerar respostas parciais