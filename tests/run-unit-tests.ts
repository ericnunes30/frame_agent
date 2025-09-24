// tests/run-unit-tests.ts
// Script para executar todos os testes unitários

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function runTest(file: string) {
  console.log(`\n=== Executando ${file} ===`);
  try {
    const { stdout, stderr } = await execAsync(`npx ts-node ${path.join('tests/unit', file)}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${file} concluído com sucesso`);
  } catch (error: any) {
    console.error(`❌ Erro em ${file}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando execução de todos os testes unitários...\n');
  
  const testFiles = [
    'config-test.ts',
    'memory-test.ts',
    'tools-test.ts',
    'valibot-test.ts',
    'react-mode-test.ts',
    'planning-mode-test.ts',
    'openai-compat-test.ts',
    'tools-execution-test.ts',
    'react-direct-test.ts'
  ];
  
  for (const file of testFiles) {
    await runTest(file);
  }
  
  console.log('\n🎉 Todos os testes unitários foram executados!');
}

runAllTests().catch(console.error);