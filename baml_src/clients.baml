// clients.baml - Configuração de clients para diferentes providers

// OpenAI clients
client<llm> OpenAIGPT4o {
  provider openai
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> OpenAIGPT4oMini {
  provider openai
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY
  }
}

// Anthropic clients
client<llm> AnthropicSonnet {
  provider anthropic
  options {
    model "claude-3-5-sonnet-20241022"
    api_key env.ANTHROPIC_API_KEY
  }
}

client<llm> AnthropicHaiku {
  provider anthropic
  options {
    model "claude-3-haiku-20240307"
    api_key env.ANTHROPIC_API_KEY
  }
}

// Google clients
client<llm> GoogleGeminiPro {
  provider google-ai
  options {
    model "gemini/gemini-1.5-pro"
    api_key env.GOOGLE_API_KEY
  }
}

// OpenAI Generic client (para APIs compatíveis como LocalAI, Ollama, etc.)
client<llm> OpenAIGeneric {
  provider openai-generic
  options {
    model env.MODEL
    base_url env.OPENAI_BASE_URL
    api_key env.OPENAI_API_KEY
  }
}