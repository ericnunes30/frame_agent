# Documentação de Validação de Schemas BAML

## Visão Geral

A validação de schemas BAML permite definir estruturas de dados esperadas para as respostas dos modelos LLM, garantindo que as saídas estejam no formato correto e tipado. Isso melhora a confiabilidade e a previsibilidade das interações com o agente.

## Definição de Schemas

Os schemas são definidos em arquivos `.baml` usando a sintaxe BAML:

```baml
// structured-response.baml

class StructuredResponse {
  answer string
  confidence float  // 0-1
  reasoning string?
}

function GetStructuredResponse(message: string) -> StructuredResponse {
  client OpenAIGPT4oMini
  prompt #"
    Responda à mensagem do usuário de forma estruturada.
    
    Mensagem do usuário: {{ message }}
    
    Retorne uma resposta estruturada com:
    - answer: A resposta direta à pergunta
    - confidence: Um valor entre 0 e 1 indicando sua confiança na resposta
    - reasoning: Uma explicação breve do raciocínio (opcional)
    
    {{ ctx.output_format }}
  "#
}
```

## Geração de Cliente

Após definir os schemas, é necessário gerar o cliente TypeScript:

```bash
npx baml generate
```

Isso cria os tipos TypeScript correspondentes e funções para chamar as funções BAML.

## Uso no Agente

### Tipos Gerados

Os schemas BAML são convertidos em tipos TypeScript:

```typescript
import type { StructuredResponse } from '../baml_client/types';
```

### Método para Respostas Estruturadas

```typescript
class ChatAgent {
  async sendStructuredMessage(message: string): Promise<StructuredResponse> {
    try {
      // Chamar a função BAML para resposta estruturada
      const response: StructuredResponse = await b.GetStructuredResponse(message);
      
      // Adicionar ao histórico
      this.memoryManager.addMessage({ 
        role: 'assistant', 
        content: `${response.answer} (Confiança: ${response.confidence})` 
      });

      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem estruturada:', error);
      throw error;
    }
  }
}
```

## Exemplo de Uso

```typescript
import { ChatAgent } from './chat-agent-core';

const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-gpt-4o-mini"
});

// Enviar mensagem com resposta estruturada
const response = await agent.sendStructuredMessage('Qual é a capital do Brasil?');

console.log('Resposta:', response.answer);
console.log('Confiança:', response.confidence);
console.log('Raciocínio:', response.reasoning || 'N/A');
```

## Benefícios

1. **Tipagem Forte**: Garante que as respostas estejam no formato esperado
2. **Validação Automática**: O BAML valida automaticamente as respostas
3. **Documentação**: Os schemas servem como documentação dos formatos esperados
4. **Refatoração Segura**: Mudanças nos schemas são refletidas automaticamente no código TypeScript

## Considerações

1. É necessário definir schemas BAML separados para cada tipo de resposta estruturada
2. A geração do cliente deve ser feita sempre que os schemas forem modificados
3. Nem todos os provedores suportam todos os tipos de dados
4. A validação pode falhar se o modelo não seguir exatamente o formato esperado