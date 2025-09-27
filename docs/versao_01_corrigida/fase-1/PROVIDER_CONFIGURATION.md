# Configuração de Providers

## Providers Suportados

O agente suporta os seguintes providers de LLM, cada um podendo ser selecionado individualmente:

### OpenAI
- `openai-gpt-4o` - Modelo GPT-4o
- `openai-gpt-4o-mini` - Modelo GPT-4o-mini (padrão)

### OpenAI Compatible (Generic)
- `openai-generic` - Para APIs compatíveis com OpenAI como LocalAI, Ollama, etc.

### Anthropic
- `anthropic-sonnet` - Modelo Claude 3.5 Sonnet
- `anthropic-haiku` - Modelo Claude 3 Haiku

## Configuração de Chaves de API

Para usar os providers, é necessário configurar as variáveis de ambiente no arquivo `.env`:

### OpenAI
```env
OPENAI_API_KEY=sua_chave_api_openai
```

### OpenAI Compatible
```env
OPENAI_API_KEY=sua_chave_api
OPENAI_BASE_URL=URL_da_sua_API_compatível
MODEL=nome_do_modelo
```

No nosso projeto, essas variáveis já estão configuradas no arquivo `.env`:
```env
OPENAI_API_KEY=cpk_3baa6e9b064147ec9bc2f5e07e68e3de.3f81893d2ea654b9ab44003bb4f9890e.HTAGLa96Nb8Uyz4yQTsn6xes9xRwVgNb
OPENAI_BASE_URL=https://llm.chutes.ai/v1
MODEL=moonshotai/Kimi-K2-Instruct-0905
```

### Anthropic
```env
ANTHROPIC_API_KEY=sua_chave_api_anthropic
```

### Google (para futura implementação)
```env
GOOGLE_API_KEY=sua_chave_api_google
```

## Uso no Código

```typescript
const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil",
  provider: "openai-generic" // Escolha um provider específico
});
```

## Como Funciona

1. **Definição de Clients** - No arquivo `baml_src/clients.baml`, definimos clients para cada provider
2. **Funções BAML** - No arquivo `baml_src/simple-chat.baml`, criamos funções específicas para cada client
3. **Seleção Individual** - No agente (`src/chat-agent-core.ts`), selecionamos a função BAML apropriada com base no provider configurado
4. **Execução Única** - O BAML cuida da formatação do prompt, chamada ao provider específico e validação da resposta

Cada instância do agente usa **apenas um provider específico**, conforme configurado na criação do agente. Não há fallback automático ou tentativas múltiplas.