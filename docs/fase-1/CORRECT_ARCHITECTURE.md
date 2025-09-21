## Arquitetura Correta do Construtor de Agentes

### Princípio Fundamental
O BAML é o núcleo que cuida de:
- Formatação de prompts com tipos
- Envio para providers (OpenAI, etc.)
- Recebimento do output
- Validação com tipos formatados

Nosso código cuida do resto:
- Estado (histórico, variáveis de contexto)
- Ciclo de execução
- Tools
- Orquestração

### Componentes

#### 1. Funções BAML (Núcleo)
```baml
// baml_src/simple-chat.baml
function SimpleChat(message: string) -> string {
  client "openai/gpt-4o-mini"
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}
```

#### 2. Agente (Camada de Orquestração)
```typescript
// src/chat-agent-core.ts
class ChatAgent {
  private history: ChatMessage[] = [];

  async sendMessage(message: string): Promise<string> {
    // 1. Adicionar mensagem ao histórico
    this.history.push({ role: 'user', content: message });

    // 2. Chamar função BAML pura (núcleo)
    const response: string = await b.SimpleChat(message);

    // 3. Adicionar resposta ao histórico
    this.history.push({ role: 'assistant', content: response });

    return response;
  }
}
```

### Fluxo de Execução

```
[Usuário] → Mensagem
     ↓
[Agente] → Adiciona ao histórico
     ↓
[BAML] → Formata prompt com tipos
     ↓
[Provider] → Processa com LLM
     ↓
[BAML] → Valida resposta com tipos
     ↓
[Agente] → Recebe resposta validada
     ↓
[Agente] → Adiciona ao histórico
     ↓
[Usuário] ← Resposta
```

Esta arquitetura mantém o BAML como núcleo especializado em prompting tipado e validação, enquanto nosso código cuida da lógica de orquestração e estado.