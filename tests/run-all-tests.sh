#!/bin/bash

# Script para executar todos os testes unitários
echo "🚀 Iniciando execução de todos os testes unitários..."

# Array com os testes a serem executados
tests=(
  "valibot-test.ts"
  "tools-test.ts"
  "config-test.ts"
  "memory-test.ts"
  "tools-execution-test.ts"
  "openai-compat-test.ts"
)

# Executar cada teste
for test in "${tests[@]}"; do
  echo -e "\n=== Executando $test ==="
  npx ts-node tests/unit/$test
  if [ $? -eq 0 ]; then
    echo "✅ $test concluído com sucesso"
  else
    echo "❌ Erro em $test"
  fi
done

echo -e "\n🎉 Todos os testes unitários foram executados!"