# Padrão ReAct (Reasoning + Action) em Agentes de IA

## 1. Definição e Conceito Básico

O padrão ReAct (Reasoning + Action) é um framework introduzido por Yao et al. em 2022 que combina traços de raciocínio e ações específicas de tarefas em modelos de linguagem grandes (LLMs) de maneira intercalada. Este padrão permite que os LLMs gerem sequências de pensamento e ação que simulam como humanos abordam tarefas complexas, alternando entre raciocínio interno e interações com o ambiente externo.

O conceito central do ReAct é permitir que os LLMs:
- **Raciocinem** sobre o problema e formulem planos de ação
- **Ajam** através de chamadas a ferramentas ou APIs externas
- **Observem** os resultados dessas ações
- **Atualizem** seu raciocínio com base nas observações

Essa abordagem cria um ciclo de feedback contínuo que permite aos modelos corrigir erros, obter informações atualizadas e tomar decisões mais informadas.

## 2. Como Funciona o Ciclo de Pensamento-Ação

O ciclo de pensamento-ação no padrão ReAct segue uma sequência estruturada:

1. **Thought (Pensamento)**: O modelo analisa a tarefa atual, formula hipóteses e planeja a próxima ação.
2. **Action (Ação)**: O modelo seleciona e executa uma ação específica, como chamar uma API de busca ou calcular um valor.
3. **Observation (Observação)**: O modelo recebe o resultado da ação executada, que pode ser dados de uma API, resultado de um cálculo, etc.
4. **Repetição**: O ciclo se repete até que o modelo determine que a tarefa foi concluída.

Exemplo de ciclo ReAct:
```
Thought 1: Preciso encontrar informações sobre X para responder à pergunta.
Action 1: Search[X]
Observation 1: [Resultado da busca]
Thought 2: Com base nos resultados, preciso refinar minha busca ou calcular Y.
Action 2: Calculate[Y]
Observation 2: [Resultado do cálculo]
Thought 3: Agora posso formular a resposta final.
Action 3: Finish[Resposta final]
```

## 3. Vantagens em Relação a Outros Padrões

### Comparação com Chain-of-Thought (CoT)
- **Mitigação de Alucinações**: Enquanto o CoT depende apenas do conhecimento interno do modelo, podendo gerar informações falsas, o ReAct pode verificar fatos através de ações externas.
- **Atualização de Informações**: O ReAct pode acessar dados em tempo real, enquanto o CoT trabalha com conhecimento estático pré-treinado.
- **Correção de Erros**: O ciclo de observação permite que o modelo identifique e corrija erros no raciocínio.

### Comparação com Abordagens Puramente de Ação
- **Planejamento Inteligente**: Diferente de agentes que apenas executam ações, o ReAct planeja e adapta suas ações com base no raciocínio.
- **Interpretabilidade**: Os traços de raciocínio tornam o processo de decisão mais transparente e compreensível para humanos.

### Outras Vantagens
- **Flexibilidade**: Funciona bem tanto em tarefas de raciocínio quanto em tomada de decisão.
- **Adaptabilidade**: Pode se ajustar a diferentes tipos de tarefas e ambientes.
- **Confiabilidade**: Maior confiabilidade nas respostas graças à verificação externa.

## 4. Exemplos Práticos de Implementação

### Exemplo 1: Question Answering com LangChain
```python
from langchain.agents import initialize_agent
from langchain.llms import OpenAI

# Configuração do LLM e ferramentas
llm = OpenAI(model_name="text-davinci-003", temperature=0)
tools = load_tools(["google-serper", "llm-math"], llm=llm)

# Inicialização do agente ReAct
agent = initialize_agent(tools, llm, agent="zero-shot-react-description", verbose=True)

# Execução
result = agent.run("Quem é o namorado de Olivia Wilde? Qual é a idade dele elevada a 0.23?")
```

Exemplo de execução:
```
Thought: Preciso descobrir quem é o namorado de Olivia Wilde e calcular sua idade elevada a 0.23.
Action: Search[Olivia Wilde boyfriend]
Observation: Olivia Wilde começou a namorar Harry Styles após terminar seu longo noivado com Jason Sudeikis.
Thought: Preciso descobrir a idade de Harry Styles.
Action: Search[Harry Styles age]
Observation: 29 anos
Thought: Preciso calcular 29 elevado a 0.23.
Action: Calculator[29^0.23]
Observation: Answer: 2.169459462491557
Thought: Agora sei a resposta final.
Action: Finish[Harry Styles, namorado de Olivia Wilde, tem 29 anos e sua idade elevada a 0.23 é 2.169459462491557.]
```

### Exemplo 2: Implementação Manual com Prompting
Prompt básico para ReAct:
```
Use the following format:

Question: A pergunta a ser respondida
Thought: Seu plano para resolver a pergunta
Action: Uma ação a ser tomada (ex: Search[termo], Calculate[expressão])
Observation: O resultado da ação
... (repetir Thought/Action/Observation quantas vezes necessário)
Thought: Agora sei a resposta final
Action: Finish[resposta final]

Comece!
Question: {pergunta}
```

## 5. Diferenciação do Padrão Plan+Execute

### Padrão Plan+Execute
O padrão Plan+Execute (Planejar+Executar) é um paradigma onde o agente primeiro cria um plano completo de ações e depois executa todas as etapas sequencialmente:

1. **Planejamento**: Gera um plano completo com todas as etapas necessárias
2. **Execução**: Executa cada etapa do plano em sequência
3. **Revisão**: Opcionalmente revisa os resultados

Características:
- Planejamento completo antes da execução
- Execução sequencial das tarefas
- Menos adaptável a mudanças durante a execução
- Focado principalmente em tarefas com etapas bem definidas

### Padrão ReAct
O padrão ReAct opera de forma mais dinâmica e iterativa:

1. **Raciocínio Contínuo**: Raciocina sobre cada etapa antes de executá-la
2. **Ação Imediata**: Executa ações com base no raciocínio atual
3. **Feedback Constante**: Observa resultados e ajusta o raciocínio
4. **Adaptação Dinâmica**: Modifica o plano com base nas observações

### Principais Diferenças

| Aspecto | Plan+Execute | ReAct |
|---------|--------------|-------|
| **Planejamento** | Completo antes da execução | Contínuo e adaptativo |
| **Execução** | Sequencial e fixa | Dinâmica e ajustável |
| **Feedback** | Limitado ou ao final | Constante em cada ciclo |
| **Adaptabilidade** | Baixa | Alta |
| **Tratamento de Erros** | Replanejamento necessário | Correção imediata |
| **Interpretabilidade** | Mostra plano final | Mostra processo de decisão |

### Quando Usar Cada Padrão

**Plan+Execute** é mais adequado para:
- Tarefas com etapas bem definidas e previsíveis
- Ambientes estáveis onde o plano inicial permanece válido
- Processos que requerem coordenação complexa de múltiplas etapas

**ReAct** é mais adequado para:
- Tarefas que requerem interação com ambientes externos
- Problemas complexos onde informações adicionais são necessárias
- Situações onde o conhecimento precisa ser verificado ou atualizado
- Contextos que exigem adaptação dinâmica durante a execução

A combinação de ambos os padrões também é possível, onde o ReAct pode ser usado para etapas individuais de um plano maior no Plan+Execute, proporcionando o melhor dos dois mundos.