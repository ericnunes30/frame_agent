# Frame Agent SDK

Um SDK TypeScript completo para criar agentes de IA avançados com múltiplos modos de operação, incluindo Chat, ReAct e Planning com modelos de thinking.

[![npm version](https://img.shields.io/npm/v/@ericnunes/frame_agent.svg)](https://www.npmjs.com/package/@ericnunes/frame_agent)
[![npm downloads](https://img.shields.io/npm/dt/@ericnunes/frame_agent.svg)](https://www.npmjs.com/package/@ericnunes/frame_agent)

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

### ✨ Novidades na versão 1.0.4
- **Correção do modo ReAct**: Agora o agente segue estritamente o framework ReAct mesmo com instruções específicas do usuário
- **Melhoria de robustez**: O modo ReAct é mais resistente a instruções conflitantes
- **Compatibilidade aprimorada**: Scripts ajustados para funcionar corretamente no Windows e Linux

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

**✅ Corrigido na versão 1.0.4**: O agente agora segue estritamente o framework ReAct mesmo quando recebe instruções muito específicas do usuário, eliminando o problema de "alucinação" da resposta final.

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
# Chave de API para OpenAI (obrigatória para providers OpenAI)
OPENAI_API_KEY=sua_chave_api_aqui

# URL base para APIs compatíveis com OpenAI (ex: LocalAI, Ollama, etc.)
OPENAI_BASE_URL=http://localhost:8080/v1

# Modelo a ser usado para os agentes
MODEL=gpt-4o-mini

# Chave de API para Anthropic (obrigatória se usar provider anthropic)
ANTHROPIC_API_KEY=sua_chave_api_anthropic_aqui
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

### Validação com Valibot
O SDK agora utiliza Valibot para validação de schemas em respostas estruturadas e parâmetros de tools:

```typescript
import * as v from 'valibot';

// Schema para validação de resposta estruturada
const UserSchema = v.object({
  name: v.string(),
  age: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(120)
  ),
  email: v.optional(v.string())
});

// Usar com sendStructuredMessage
const response = await agent.sendStructuredMessage(
  "Crie um usuário com nome 'Maria', idade 28 e cidade 'São Paulo'",
  UserSchema
);
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
  parameters?: v.GenericSchema | ToolParameters;
  execute: (args: any) => Promise<any>;
}
```

### Exemplo de Tool com Valibot
```typescript
import * as v from 'valibot';

const calculatorTool: Tool = {
  name: "calculate",
  description: "Realiza operações matemáticas básicas",
  parameters: v.object({
    expression: v.string()
  }),
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

# Compilar TypeScript (build)
npm run build

# Executar exemplo básico
npm run example

# Desenvolvimento contínuo (watch mode)
npm run dev

# Executar testes unitários
npm run test
# ou
npx ts-node tests/run-unit-tests.ts

# Executar exemplos específicos
npm run example:react-basic
npm run example:react-advanced
npm run example:planning
npm run example:modes
```

### Estrutura do Projeto
```
├── src/                      # Código TypeScript do SDK
│   ├── index.ts              # Ponto de entrada principal
│   ├── core/                 # Componentes principais
│   │   ├── chat-agent-core.ts # Implementação principal do agente
│   │   ├── prompt-builder.ts  # Construtor de prompts
│   │   └── structured-response.ts # Respostas estruturadas
│   ├── adapters/             # Adaptadores de providers
│   │   ├── provider-adapter.ts # Interface base para providers
│   │   ├── openai-adapter.ts   # Adaptador para OpenAI
│   │   └── anthropic-adapter.ts # Adaptador para Anthropic
│   ├── tools/                # Sistema de tools
│   │   └── tools.ts          # Registro e gerenciamento de tools
│   ├── memory/               # Gerenciamento de memória
│   │   └── memory-manager.ts # Gerenciador de memória
│   └── types/                # Definições de tipos
│       └── types.d.ts        # Tipos personalizados
├── dist/                     # Arquivos compilados (NÃO EDITAR)
├── docs/                     # Documentação
├── tests/                    # Testes
├── examples/                 # Exemplos de uso
├── .env                      # Variáveis de ambiente
└── package.json              # Dependências e scripts
```

### Fluxo de Trabalho
1. **Implementar lógica** nos arquivos apropriados em `src/`
2. **Testar** com `npx ts-node tests/unit/*.ts`
3. **Testar correção do modo ReAct** com `npx ts-node tests/unit/react-fix-mock-test.ts`

### ✨ Novos Testes de Validação (v1.0.4)
- `tests/unit/react-fix-mock-test.ts` - Teste abrangente da correção do modo ReAct com mock
- `tests/unit/test-react-fix.ts` - Teste da correção com provider real
- `tests/unit/react-fix-validation-test.ts` - Teste adicional de validação

### Não Editar
- `dist/` - Arquivos compilados
- `tests/unit/test-react-fix.ts` - Teste de validação da correção do modo ReAct
- `tests/unit/react-fix-mock-test.ts` - Teste de validação da correção do modo ReAct com mock

## Publicação no NPM

Para publicar uma nova versão do SDK:

1. Atualizar o número da versão com `npm version patch` (ou minor/major conforme necessário)
2. Executar `npm run build` para compilar o código
3. Executar `npm publish` para publicar no NPM

O script `prepublishOnly` é configurado para compilar automaticamente antes da publicação.

### ✨ Melhorias na v1.0.4
- **Compatibilidade Windows**: Scripts ajustados para funcionar corretamente no Windows e Linux
- **Build robusto**: Processo de build otimizado com `npx` para evitar problemas de PATH

### Pré-requisitos
- Conta no NPM com permissões para publicar no escopo `@ericnunes`
- Código testado e validado

### Processo de Publicação
```bash
# 1. Atualizar versão (ex: patch)
npm version patch

# 2. Compilar o código
npm run build

# 3. Publicar no NPM
npm publish
```

### ✨ Dica para Windows
Se estiver no Windows e encontrar problemas com o `tsup`, instale-o globalmente:
```bash
npm install -g tsup
```