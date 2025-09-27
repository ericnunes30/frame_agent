# Resumo dos Exemplos de Modos de Operação

Este documento resume os exemplos criados para demonstrar os diferentes modos de operação do agente.

## Exemplos Criados

### 1. Exemplo Básico do Modo ReAct
**Arquivo:** `examples/react-basic-example.ts`

Demonstra o uso básico do modo ReAct com ferramentas simples:
- Uso da ferramenta `get_current_datetime` para obter a hora atual
- Uso da ferramenta `calculate` para operações matemáticas simples

### 2. Exemplo Avançado do Modo ReAct
**Arquivo:** `examples/react-advanced-example.ts`

Demonstra o uso avançado do modo ReAct com múltiplas ferramentas:
- Tarefas complexas que requerem múltiplas etapas
- Combinação de diferentes ferramentas em uma única tarefa
- Uso de raciocínio e ação em ciclos

### 3. Exemplo do Modo Planning
**Arquivo:** `examples/planning-example.ts`

Demonstra o uso do modo Planning para tarefas complexas:
- Planejamento hierárquico de tarefas
- Decomposição de tarefas em subtasks
- Execução sequencial com dependências

### 4. Exemplos de Configuração de Modos
**Arquivo:** `examples/mode-configuration-examples.ts`

Demonstra como configurar e usar os diferentes modos:
- Configuração do modo Chat (padrão)
- Configuração do modo ReAct
- Configuração do modo Planning
- Comparação entre os modos

## Scripts Adicionados

Os seguintes scripts foram adicionados ao `package.json` para facilitar a execução dos exemplos:

```json
"example:react-basic": "ts-node examples/react-basic-example.ts",
"example:react-advanced": "ts-node examples/react-advanced-example.ts",
"example:planning": "ts-node examples/planning-example.ts",
"example:modes": "ts-node examples/mode-configuration-examples.ts"
```

## Documentação Adicional

### Visão Geral dos Modos de Operação
**Arquivo:** `docs/modes-overview.md`

Documento que explica detalhadamente cada modo de operação:
- Modo Chat (padrão)
- Modo ReAct (Reasoning + Action)
- Modo Planning

### Atualização do README
Os READMEs foram atualizados para incluir informações sobre os novos modos e exemplos:

1. **README.md principal** - Inclui seção sobre Modos de Operação
2. **examples/README.md** - Inclui documentação sobre os novos exemplos e como executá-los

## Funcionalidades Implementadas

### Modo ReAct
Implementado no arquivo `src/chat-agent-core.ts`:
- Ciclo de pensamento e ação
- Uso de ferramentas registradas
- Processamento em até 10 passos
- Armazenamento do processo ReAct na memória

### Modo Planning
Implementado no arquivo `src/chat-agent-core.ts`:
- Planejamento de tarefas complexas
- Decomposição em subtasks
- Execução sequencial com dependências
- Síntese de resultados
- Armazenamento da tarefa de planejamento na memória

## Como Executar os Exemplos

```bash
# Exemplo básico do modo ReAct
npm run example:react-basic

# Exemplo avançado do modo ReAct
npm run example:react-advanced

# Exemplo do modo Planning
npm run example:planning

# Exemplos de configuração de modos
npm run example:modes
```