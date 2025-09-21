# Documentação da Fase 2

## Visão Geral

A Fase 2 do projeto "Construtor de Agentes com BAML" implementa funcionalidades avançadas para tornar os agentes mais poderosos e flexíveis. Esta fase adiciona suporte a tools, gerenciamento de memória, configuração dinâmica, validação de schemas e preparação para streaming.

## Funcionalidades Implementadas

### 1. Sistema de Tools

Permite que os agentes executem funções específicas durante a interação com o usuário.

- **Interface de Tool**: Padrão para definição de tools
- **Registro de Tools**: Sistema para registrar e gerenciar tools
- **Execução de Tools**: Mecanismo para executar tools com validação de parâmetros

[Documentação detalhada](./documentacao/tools.md)

### 2. Gerenciador de Memória

Gerencia o contexto das conversas, incluindo histórico de mensagens e variáveis de contexto.

- **Estratégias de Memória**: Janela fixa e dinâmica
- **Variáveis de Contexto**: Armazenamento de informações persistentes
- **Serialização**: Persistência do contexto

[Documentação detalhada](./documentacao/memory-manager.md)

### 3. Configuração Dinâmica

Permite ajustar os parâmetros do modelo LLM em tempo de execução.

- **Parâmetros Suportados**: temperature, topP, maxTokens, etc.
- **Configuração por Chamada**: Ajuste fino para interações específicas

[Documentação detalhada](./documentacao/dynamic-config.md)

### 4. Validação de Schemas BAML

Define estruturas de dados esperadas para as respostas dos modelos LLM.

- **Definição de Schemas**: Tipos e estruturas em BAML
- **Geração de Tipos**: Conversão automática para TypeScript
- **Validação Automática**: Garantia de formato correto

[Documentação detalhada](./documentacao/schema-validation.md)

### 5. Preparação para Streaming

Preparação para suporte a streaming de respostas (dependente de suporte do BAML).

- **Planejamento de Implementação**: Estrutura futura
- **Considerações**: Limitações atuais

[Documentação detalhada](./documentacao/streaming.md)

## Arquitetura

```
Construtor de Agentes (TypeScript) - Fase 2
│
├── Entrada: Configuração (instruções, modelo, tools, schema)
├── Saída: Instância de Agente
│
├── Agente:
│   ├── Estado: Histórico + variáveis + contexto
│   ├── Configuração: Modelo, temperatura, parâmetros
│   ├── Tools: Registro e gerenciamento de ferramentas
│   ├── Método: .sendMessage(input) → resposta
│   ├── Método: .sendStructuredMessage(input) → resposta estruturada
│   ├── Método: .executeTool(toolName, args) → resultado
│   ├── Método: .reset()
│   └── Método: .getHistory()
│
├── Ciclo (com tools):
│   input → contexto → BAML → resposta/tool → 
│   se tool_calls:
│     → Executar tools → Adicionar resultados ao contexto → BAML
│   se resposta final:
│     → Adicionar ao histórico → Retornar ao usuário
│
├── Integração com BAML:
│   - Chamada com mensagens, tools registradas, schema
│   - Tratamento de tool_calls e execução
│   - Validação de saídas com schemas
│   - Suporte a streaming (futuro)
│
├── Sistema de Tools:
│   - Registro de tools com interface padrão
│   - Execução assíncrona de tools
│   - Tratamento de erros em tools
│   - Timeout e limites de execução
│
├── Memória de Contexto:
│   - Janela de contexto configurável
│   - Estratégias de seleção de mensagens
│   - Persistência de informações relevantes
│
├── Configuração Dinâmica:
│   - Parâmetros por chamada
│   - Perfis de configuração
│   - Validação de parâmetros
│
└── Testes:
    - Unitários para cada componente
    - Integração com tools reais
    - Testes de borda e erro
```

## Testes

Foram criados testes abrangentes para cada funcionalidade:

- `tests/tools-test.ts`: Teste do sistema de tools
- `tests/memory-test.ts`: Teste do gerenciador de memória
- `tests/config-test.ts`: Teste de configuração dinâmica
- `tests/schema-test.ts`: Teste de validação de schemas

## Próximos Passos

1. Implementar suporte a streaming quando disponível no BAML
2. Adicionar mais exemplos de tools úteis
3. Implementar estratégias avançadas de gerenciamento de memória
4. Adicionar suporte a tools complexas com múltiplas etapas
5. Melhorar a documentação com exemplos práticos