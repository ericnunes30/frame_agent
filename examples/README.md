# Exemplos

Esta pasta contém exemplos de uso do BAML e do construtor de agentes.

## Estrutura

- `baml_example/` - Exemplo gerado automaticamente pelo BAML CLI
- `basic-usage.ts` - Exemplo básico de uso do SDK
- `advanced-usage.ts` - Exemplo avançado de uso do SDK com tools
- `example-tools.ts` - Ferramentas de exemplo para testes
- `react-example.ts` - Exemplo de uso do modo ReAct (avançado)
- `react-basic-example.ts` - Exemplo básico do modo ReAct
- `react-advanced-example.ts` - Exemplo avançado do modo ReAct com múltiplas ferramentas
- `planning-example.ts` - Exemplo do modo Planning para tarefas complexas
- `mode-configuration-examples.ts` - Exemplos de como configurar e usar os diferentes modos

## Modos Disponíveis

1. **Chat (padrão)** - Modo de conversa simples
2. **ReAct** - Framework Reasoning + Action para tarefas que requerem raciocínio e ação
3. **Planning** - Modo de planejamento hierárquico para tarefas complexas

## Como Executar os Exemplos

```bash
# Exemplo básico
npx ts-node examples/basic-usage.ts

# Exemplo avançado com tools
npx ts-node examples/advanced-usage.ts

# Exemplo básico do modo ReAct
npx ts-node examples/react-basic-example.ts

# Exemplo avançado do modo ReAct
npx ts-node examples/react-advanced-example.ts

# Exemplo do modo Planning
npx ts-node examples/planning-example.ts

# Exemplos de configuração de modos
npx ts-node examples/mode-configuration-examples.ts
```