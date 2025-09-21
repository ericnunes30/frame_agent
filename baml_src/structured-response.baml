// baml_src/structured-response.baml
// Exemplo de schema BAML para resposta estruturada

// Classe para representar uma resposta estruturada
class StructuredResponse {
  answer string
  confidence float  // 0-1
  reasoning string?
}

// Função para obter uma resposta estruturada
function GetStructuredResponse(message: string) -> StructuredResponse {
  client OpenAIGPT4oMini
  prompt #"
    Responda à mensagem do usuário de forma estruturada.
    
    Mensagem do usuário: {{ message }}
    
    Retorne uma resposta estruturada com:
    - answer: A resposta direta à pergunta
    - confidence: Um valor entre 0 e 1 indicando sua confiança na resposta
    - reasoning: Uma explicação breve do raciocínio (opcional)
    
    {{ ctx.output_format }}
  "#
}