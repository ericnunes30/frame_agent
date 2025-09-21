// Funções BAML para diferentes providers

// Função genérica para chat
function SimpleChat(message: string) -> string {
  client OpenAIGPT4oMini
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Função para OpenAI GPT-4o
function ChatWithGPT4o(message: string) -> string {
  client OpenAIGPT4o
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Função para OpenAI GPT-4o-mini
function ChatWithGPT4oMini(message: string) -> string {
  client OpenAIGPT4oMini
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Função para OpenAI Generic (APIs compatíveis)
function ChatWithOpenAIGeneric(message: string) -> string {
  client OpenAIGeneric
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Função para Anthropic Claude Sonnet
function ChatWithClaudeSonnet(message: string) -> string {
  client AnthropicSonnet
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Função para Anthropic Claude Haiku
function ChatWithClaudeHaiku(message: string) -> string {
  client AnthropicHaiku
  prompt #"
    Você é um assistente útil. Responda à mensagem do usuário de forma clara e concisa.
    
    Mensagem do usuário: {{ message }}
    
    Responda apenas com a mensagem do assistente.
  "#
}

// Classe para representar uma mensagem de chat
class ChatMessage {
  role string  // "user" ou "assistant"
  content string
}