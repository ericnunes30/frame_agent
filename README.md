# Frame Agent SDK

Um SDK TypeScript completo para criar agentes de IA avançados com múltiplos modos de operação, incluindo Chat, ReAct e Planning com modelos de thinking.

## Sumário

- [Modos de Operação](#modos-de-operação)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [API do ChatAgent](#api-do-chatagent)
- [Exemplos Práticos](#exemplos-práticos)
- [Tools](#tools)
- [Gerenciamento de Memória e Contexto](#gerenciamento-de-memória-e-contexto)
- [Configuração Avançada](#configuração-avançada)
- [Testes e Desenvolvimento](#testes-e-desenvolvimento)
- [Publicação no NPM](#publicação-no-npm)

## Modos de Operação

O SDK suporta três modos principais de operação para diferentes tipos de tarefas:

### 1. Modo Chat (Padrão)
Modo de conversa simples para interações diretas. Ideal para perguntas e respostas diretas, conversas casuais e interações básicas.

```typescript
const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil.",
  provider: "openai-generic"
});
```

### 2. Modo ReAct (Reasoning + Action)
Framework para tarefas que requerem raciocínio e ação, usando tools disponíveis. O agente pensa passo a passo, decide quais ações tomar e executa as tools necessárias.

```typescript
const agent = new ChatAgent({
  name: "Assistente ReAct",
  instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
  provider: "openai-generic",
  mode: "react"
});
```

### 3. Modo Planning
Modo de planejamento hierárquico para tarefas complexas que requerem decomposição em subtasks. Incorpora modelos de thinking avançados com:

- **Arquitetura Dual-Process**:
  - Modo Rápido (System 1): Respostas imediatas para tarefas simples
  - Modo Lento (System 2): Processamento analítico profundo para tarefas complexas

- **Planejamento Hierárquico**:
  - Decomposição de tarefas complexas em subtasks menores
  - Identificação de dependências entre subtasks
  - Execução coordenada com feedback

- **Capacidades Reflexivas**:
  - Auto-avaliação do processo de planejamento e execução
  - Adaptação com base em feedback dos resultados
  - Registro do processo de pensamento para transparência

```typescript
const agent = new ChatAgent({
  name: "Assistente Planning",
  instructions: "Você é um assistente que usa o modo Planning para resolver tarefas complexas através de planejamento hierárquico.",
  provider: "openai-generic",
  mode: "planning"
});
```

## Instalação

```bash
npm install @ericnunes/frame_agent
```

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

## API do ChatAgent

### Construtor
```typescript
new ChatAgent(config: AgentConfig)
```

### Interface AgentConfig
```typescript
interface AgentConfig {
  name: string;
  instructions: string;
  provider?: ProviderType; // 'openai-gpt-4o' | 'openai-gpt-4o-mini' | 'openai-generic' | 'anthropic-sonnet' | 'anthropic-haiku'
  mode?: AgentMode; // 'chat' | 'react' | 'planning'
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}
```

### Métodos Principais

#### sendMessage(message: string, dynamicConfig?: DynamicConfig): Promise<string>
Envia uma mensagem para o agente e retorna a resposta.

#### sendStructuredMessage(message: string): Promise<StructuredResponse>
Envia uma mensagem e retorna uma resposta estruturada.

#### registerTool(tool: Tool): void
Registra uma tool para uso nos modos ReAct e Planning.

#### unregisterTool(name: string): boolean
Remove uma tool registrada.

#### listTools(): Tool[]
Lista todas as tools registradas.

#### reset(): void
Reseta o histórico de mensagens.

#### getHistory(): ChatMessage[]
Obtém o histórico de mensagens atual.

#### setContextVariable(key: string, value: any): void
Define uma variável de contexto.

#### getContextVariable(key: string): any
Obtém uma variável de contexto.

#### getConfig(): AgentConfig
Obtém a configuração atual do agente.

#### setConfig(newConfig: Partial<AgentConfig>): void
Atualiza a configuração do agente.

## Exemplos Práticos

### Modo Chat
```typescript
import { ChatAgent } from '@ericnunes/frame_agent';
import dotenv from 'dotenv';

dotenv.config();

const agent = new ChatAgent({
  name: "Assistente",
  instructions: "Você é um assistente útil.",
  provider: "openai-generic"
});

const response = await agent.sendMessage("Olá, qual é o seu nome?");
console.log('Assistente:', response);
```

### Modo ReAct
```typescript
import { ChatAgent } from '@ericnunes/frame_agent';
import { calculatorTool, dateTimeTool } from './example-tools';

const agent = new ChatAgent({
  name: "Assistente ReAct",
  instructions: "Você é um assistente que usa o framework ReAct para resolver tarefas complexas.",
  provider: "openai-generic",
  mode: "react"
});

// Registrar tools
agent.registerTool(calculatorTool);
agent.registerTool(dateTimeTool);

const response = await agent.sendMessage("Qual é a hora atual? Some 100 a essa hora e me diga o resultado.");
console.log('Resposta:', response);
```

### Modo Planning
```typescript
import { ChatAgent } from '@ericnunes/frame_agent';
import { calculatorTool, dateTimeTool, weatherTool } from './example-tools';

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

const response = await agent.sendMessage("Planeje minha semana: verifique a data atual, calcule quantos dias faltam para o final do mês e me diga qual será o clima nesses dias.");
console.log('Resposta:', response);
```

## Tools

O SDK suporta um sistema de tools extensível para os modos ReAct e Planning.

### Interface Tool
```typescript
interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameters;
  execute: (args: any) => Promise<any>;
}
```

### Exemplo de Tool
```typescript
const calculatorTool: Tool = {
  name: "calculate",
  description: "Realiza operações matemáticas básicas",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Expressão matemática para calcular (ex: '2 + 2 * 3')"
      }
    },
    required: ["expression"]
  },
  execute: async (args: { expression: string }) => {
    try {
      const result = eval(args.expression);
      return { result: Number(result.toFixed(2)) };
    } catch (error) {
      throw new Error(`Não foi possível calcular: ${args.expression}`);
    }
  }
};
```

### Registrando Tools
```typescript
agent.registerTool(calculatorTool);
agent.registerTool(dateTimeTool);
```

## Gerenciamento de Memória e Contexto

O SDK inclui um gerenciador de memória avançado com estratégias de janela dinâmica:

### Estratégias de Memória
- **FixedWindowMemory**: Janela de contexto fixa
- **DynamicWindowMemory**: Janela de contexto dinâmica baseada em tokens (padrão)

### Variáveis de Contexto
```typescript
// Definir variáveis de contexto
agent.setContextVariable('user_id', '12345');
agent.setContextVariable('preferences', { theme: 'dark' });

// Obter variáveis de contexto
const userId = agent.getContextVariable('user_id');
const allVariables = agent.getAllContextVariables();
```

### Histórico de Mensagens
```typescript
// Obter histórico
const history = agent.getHistory();

// Resetar histórico
agent.reset();
```

## Configuração Avançada

### Configuração por Chamada
```typescript
const response = await agent.sendMessage("Explique como funciona a fotossíntese", {
  temperature: 0.7,
  maxTokens: 500
});
```

### Configuração Global
```typescript
agent.setConfig({
  temperature: 0.8,
  topP: 0.9,
  maxTokens: 1000
});
```

## Testes e Desenvolvimento

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

# Executar testes
npm test

# Executar exemplos específicos
npm run example:react-basic
npm run example:react-advanced
npm run example:planning
npm run example:modes
```

### Estrutura do Projeto
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

### Fluxo de Trabalho
1. **Definir funções BAML** em `baml_src/*.baml`
2. **Gerar cliente** com `npx baml generate`
3. **Implementar lógica** em `src/*.ts`
4. **Testar** com `npx ts-node tests/*.ts`

### Não Editar
- `baml_client/` - Arquivos gerados automaticamente
- `dist/` - Arquivos compilados

## Publicação no NPM

Para publicar uma nova versão do SDK:

1. Atualizar o número da versão no `package.json`
2. Executar `npm run build` para compilar o código
3. Executar `npm publish` para publicar no NPM

O script `prepublishOnly` é configurado para compilar automaticamente antes da publicação.

### Pré-requisitos
- Conta no NPM com permissões para publicar no escopo `@ericnunes`
- Código testado e validado

### Processo de Publicação
```bash
# 1. Atualizar versão no package.json
# 2. Compilar o código
npm run build

# 3. Publicar no NPM
npm publish
```