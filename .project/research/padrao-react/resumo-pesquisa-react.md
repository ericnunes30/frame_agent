# Pesquisa sobre o Padrão ReAct (Reasoning + Action)

## Fontes Consultadas

1. https://arxiv.org/abs/2210.03629 - Paper original "ReAct: Synergizing Reasoning and Acting in Language Models"
2. https://www.promptingguide.ai/techniques/react - Prompting Guide - ReAct Prompting
3. https://learnprompting.org/docs/advanced_applications/react - Learn Prompting - LLMs that Reason and Act
4. https://blog.langchain.dev/langchain-v0-1-0/ - LangChain v0.1.0 Blog Post
5. https://react-lm.github.io/ - Site oficial do ReAct

## Resumo da Pesquisa

O padrão ReAct (Reasoning + Action) foi introduzido por Yao et al. em 2022 como um framework que combina raciocínio verbal e ações específicas de tarefas de forma intercalada em modelos de linguagem grandes (LLMs). Este padrão permite que os LLMs gerem traços de raciocínio e ações em um ciclo contínuo, onde o raciocínio ajuda a induzir, rastrear e atualizar planos de ação, e as ações permitem interagir com fontes externas para obter informações adicionais.

A pesquisa demonstrou que o ReAct supera diversas abordagens de base em tarefas de linguagem e tomada de decisão, além de proporcionar maior interpretabilidade e confiabilidade aos modelos. Os resultados mostraram sucesso particular em tarefas intensivas de conhecimento como question answering (HotpotQA) e verificação de fatos (Fever), bem como em ambientes de tomada de decisão como ALFWorld e WebShop.

O framework ReAct se diferencia de outros padrões como Chain-of-Thought (CoT) por sua capacidade de interagir com o mundo externo através de ações, mitigando problemas como alucinação de fatos e propagação de erros que são comuns em abordagens puramente de raciocínio interno.