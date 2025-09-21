# SDK de Agentes com BAML

Este é um SDK em TypeScript para criação de agentes de IA que utiliza a biblioteca BAML para:
- Conexão com LLMs (OpenAI, Anthropic, OpenAI Compatible, etc.)
- Montagem de prompts tipados
- Validação/formatagem de saídas
- Gerenciamento de estado e histórico

## Estrutura do Projeto

```
├── baml_src/              # Arquivos BAML (definições de funções e clients)
│   ├── clients.baml       # Configuração de clients/providers
│   └── simple-chat.baml   # Funções BAML
├── baml_client/           # Cliente TypeScript gerado pelo BAML (NÃO EDITAR)
├── src/                   # Código TypeScript do SDK
│   ├── index.ts           # Ponto de entrada principal
│   ├── chat-agent-core.ts # Implementação principal do agente
│   ├── tools.ts           # Sistema de tools
│   └── memory-manager.ts  # Gerenciador de memória
├── dist/                  # Arquivos compilados (NÃO EDITAR)
├── docs/                  # Documentação
├── tests/                 # Testes
├── examples/              # Exemplos de uso
├── .env                   # Variáveis de ambiente
└── package.json           # Dependências e scripts
```

## Providers Suportados

- **OpenAI**: GPT-4o, GPT-4o-mini
- **Anthropic**: Claude Sonnet, Claude Haiku
- **OpenAI Compatible**: APIs compatíveis (LocalAI, Ollama, etc.)

*Cada agente usa apenas um provider específico, configurado na criação.*

## Configuração

### Variáveis de Ambiente (.env)
```env
# OpenAI
OPENAI_API_KEY=sua_chave_api_openai

# OpenAI Compatible
OPENAI_API_KEY=sua_chave_api
OPENAI_BASE_URL=URL_da_sua_API_compatível
MODEL=nome_do_modelo

# Anthropic
ANTHROPIC_API_KEY=sua_chave_api_anthropic
```

## Instalação

```bash
npm install @ericnunes/frame_agent
```

## Uso Básico

```typescript
import { ChatAgent } from '@ericnunes/frame_agent';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Criar um agente com configurações básicas
const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil.",
  provider: "openai-generic" // ou outro provider suportado
});

// Enviar uma mensagem e obter resposta
const response = await agent.sendMessage("Olá, qual é o seu nome?");
console.log('Assistente:', response);
```

## Desenvolvimento

### Comandos Principais
```bash
# Instalar dependências
npm install

# Gerar cliente BAML
npx baml generate

# Compilar TypeScript (build)
npm run build

# Executar exemplo básico
npm run example

# Desenvolvimento contínuo (watch mode)
npm run dev
```

### Fluxo de Trabalho
1. **Definir funções BAML** em `baml_src/*.baml`
2. **Gerar cliente** com `npx baml generate`
3. **Implementar lógica** em `src/*.ts`
4. **Testar** com `npx ts-node tests/*.ts`

### Não Editar
- `baml_client/` - Arquivos gerados automaticamente
- `dist/` - Arquivos compilados

## Documentação

- `docs/CORRECT_ARCHITECTURE.md` - Arquitetura do projeto
- `docs/EXECUTION_FLOW.md` - Fluxo de execução
- `docs/PROVIDER_CONFIGURATION.md` - Configuração de providers

## Próximos Passos

1. Implementar suporte a tools/funções
2. Adicionar memória de contexto (curto prazo)
3. Implementar configuração dinâmica (modelo, temperatura, etc.)
4. Adicionar validação de saída via schema
5. Implementar modo streaming
