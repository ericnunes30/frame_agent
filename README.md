# Construtor de Agentes com BAML

Um framework TypeScript para criar agentes de IA avançados com múltiplos modos de operação, incluindo chat, ReAct e Planning com modelos de thinking.

## Modo Planning com Modelos de Thinking

O modo Planning foi implementado com base em pesquisa sobre planning agents e modelos de thinking, incorporando:

1. **Arquitetura Dual-Process**:
   - Modo Rápido (System 1): Respostas imediatas para tarefas simples
   - Modo Lento (System 2): Processamento analítico profundo para tarefas complexas

2. **Planejamento Hierárquico**:
   - Decomposição de tarefas complexas em subtasks menores
   - Identificação de dependências entre subtasks
   - Execução coordenada com feedback

3. **Capacidades Reflexivas**:
   - Auto-avaliação do processo de planejamento e execução
   - Adaptação com base em feedback dos resultados
   - Registro do processo de pensamento para transparência

4. **Diferenciação entre Modelos**:
   - Modelos de Chat: Respostas rápidas para interações diretas
   - Modelos de Thinking: Processamento analítico profundo para tarefas complexas

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

## Exemplos de Uso

### Modo Planning

```typescript
import { ChatAgent } from '@ericnunes/frame_agent';

const agent = new ChatAgent({
  name: "Assistente Planning",
  instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas através de planejamento hierárquico.",
  provider: "openai-generic",
  mode: "planning"
});

// Registrar tools
agent.registerTool(calculatorTool);
agent.registerTool(dateTimeTool);
agent.registerTool(weatherTool);

// Executar tarefa complexa
const response = await agent.sendMessage("Planeje minha semana: verifique a data atual, calcule quantos dias faltam para o final do mês e me diga qual será o clima nesses dias.");
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

## Modos de Operação

O agente suporta diferentes modos de operação para diferentes tipos de tarefas:

### 1. Modo Chat (Padrão)
Modo de conversa simples para interações diretas.

### 2. Modo ReAct (Reasoning + Action)
Framework para tarefas que requerem raciocínio e ação, usando tools disponíveis.

### 3. Modo Planning
Modo de planejamento hierárquico para tarefas complexas que requerem decomposição em subtasks.

## Próximos Passos

1. Implementar suporte a tools/funções
2. Adicionar memória de contexto (curto prazo)
3. Implementar configuração dinâmica (modelo, temperatura, etc.)
4. Adicionar validação de saída via schema
5. Implementar modo streaming
