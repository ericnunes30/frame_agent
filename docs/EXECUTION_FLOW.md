## Fluxo de Execução do Agente

### 1. Inicialização
```
[Usuário] → Cria instância do ChatAgent
              ↓
            ChatAgent (histórico vazio)
```

### 2. Envio de Mensagem
```
[Usuário] → .sendMessage("mensagem")
              ↓
            Adiciona mensagem ao histórico
              ↓
            Chama função BAML ProcessChatMessage
              ↓
            ProcessChatMessage (histórico + nova mensagem)
              ↓
            LLM (OpenAI GPT-4o-mini)
              ↓
            Retorna resposta do LLM
              ↓
            Adiciona resposta ao histórico
              ↓
            Retorna resposta para o usuário
```

### 3. Interações Subsequentes
```
[Usuário] → .sendMessage("outra mensagem")
              ↓
            Adiciona mensagem ao histórico (mantendo contexto)
              ↓
            Chama função BAML ProcessChatMessage
              ↓
            ProcessChatMessage (histórico completo + nova mensagem)
              ↓
            LLM (OpenAI GPT-4o-mini) com contexto completo
              ↓
            Retorna resposta do LLM
              ↓
            Adiciona resposta ao histórico
              ↓
            Retorna resposta para o usuário
```

### 4. Gerenciamento de Histórico
```
[Usuário] → .getHistory()
              ↓
            Retorna cópia do histórico atual

[Usuário] → .reset()
              ↓
            Limpa o histórico
```

### Componentes Principais

1. **ChatAgent Class**
   - Mantém o estado (histórico de mensagens)
   - Interface para interação com o usuário
   - Métodos: sendMessage, reset, getHistory

2. **Função BAML ProcessChatMessage**
   - Define o prompt do sistema
   - Recebe o histórico e a nova mensagem
   - Retorna a resposta do LLM

3. **Tipos Gerados pelo BAML**
   - Message: Representa uma mensagem (role, content)
   - ChatHistory: Coleção de mensagens

### Fluxo de Dados

```
Entrada do Usuário
        ↓
[ChatAgent.sendMessage()]
        ↓
Histórico + Nova Mensagem
        ↓
[BAML ProcessChatMessage()]
        ↓
Prompt Formatado para LLM
        ↓
Modelo de Linguagem (LLM)
        ↓
Resposta do LLM
        ↓
Atualização do Histórico
        ↓
Resposta para o Usuário
```

Este fluxo implementa o MVP definido:
- ✓ System prompt inicial (definido na função BAML)
- ✓ Input do usuário → chamada BAML → resposta
- ✓ Histórico de mensagens (contexto linear)