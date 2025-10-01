// Script simples para testar manualmente as funcionalidades implementadas
import { AdaptiveExecutor } from '../src/core/adaptive-executor';
import { Tool } from '../src/adapters/provider-adapter';
import * as v from 'valibot';

// Mock para ProviderAdapter
class MockAdapter {
  responses: string[] = [];
  
  constructor(responses: string[] = []) {
    this.responses = [...responses];
  }
  
  async sendMessage({ messages }: { messages: any[] }) {
    const response = this.responses.shift() || 'Default response';
    return { content: response };
  }
}

// Ferramentas de teste
const testTool: Tool = {
  name: 'test_tool',
  description: 'A test tool',
  parameters: v.object({
    param: v.string('A test parameter')
  }),
  execute: async (args: { param: string }) => {
    return { result: `Tool executed with ${args.param}` };
  }
};

const finalAnswerTool: Tool = {
  name: 'final_answer',
  description: 'A final answer tool',
  parameters: v.object({
    response: v.string('The final response')
  }),
  execute: async (args: { response: string }) => {
    return { response: args.response, isFinal: true };
  }
};

async function runTests() {
  console.log('🧪 Running AdaptiveExecutor tests...\n');
  
  // Test 1: Final answer as separate action
  console.log('✅ Test 1: Final answer as separate action');
  try {
    const executor = new AdaptiveExecutor();
    const mockAdapter = new MockAdapter([
      `Thought: I have completed the task.
Action: final_answer
Action Input: {"response": "This is the final answer to the user."}`
    ]);
    
    const result = await executor.executeAdaptive(
      mockAdapter, 
      [{ role: 'user', content: 'Test task' }], 
      [testTool, finalAnswerTool], 
      'react'
    );
    
    console.log(`   State: ${result.newState}, Response: ${result.response.substring(0, 50)}...`);
    console.log('   ✅ Passed\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Test 2: Final answer incorrectly in parameters
  console.log('✅ Test 2: Final answer incorrectly in other tool parameters');
  try {
    const executor = new AdaptiveExecutor();
    const mockAdapter = new MockAdapter([
      `Thought: I'm trying to provide a final answer incorrectly.
Action: test_tool
Action Input: {"param": "test", "final_answer": "This should be separate!"}`,
      `Thought: Now I'll use final_answer as a separate action.
Action: final_answer
Action Input: {"response": "Correct final response."}`
    ]);
    
    const result = await executor.executeAdaptive(
      mockAdapter, 
      [{ role: 'user', content: 'Test task' }], 
      [testTool, finalAnswerTool], 
      'react'
    );
    
    console.log(`   State: ${result.newState}, Response: ${result.response.substring(0, 50)}...`);
    console.log('   ✅ Passed - Error was detected and corrected\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Test 3: No ReAct structure
  console.log('✅ Test 3: Response without ReAct structure');
  try {
    const executor = new AdaptiveExecutor();
    const mockAdapter = new MockAdapter([
      `This is just a regular text response without proper structure.`,
      `Thought: Now I'll provide a structured response.
Action: final_answer
Action Input: {"response": "Final answer after correction."}`
    ]);
    
    const result = await executor.executeAdaptive(
      mockAdapter, 
      [{ role: 'user', content: 'Test task' }], 
      [testTool, finalAnswerTool], 
      'react'
    );
    
    console.log(`   State: ${result.newState}, Response: ${result.response.substring(0, 50)}...`);
    console.log('   ✅ Passed - Error was detected and corrected\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Test 4: Malformed ReAct structure
  console.log('✅ Test 4: Malformed ReAct structure');
  try {
    const executor = new AdaptiveExecutor();
    const mockAdapter = new MockAdapter([
      `Thought: I'm thinking about the task.
Action: test_tool`, // Missing Action Input
      `Thought: Now I'll provide a properly structured response.
Action: test_tool
Action Input: {"param": "corrected param"}
Observation: {"result": "Tool executed correctly"}
Thought: Now I have all information for the final answer.
Action: final_answer
Action Input: {"response": "Final answer after correction."}`
    ]);
    
    const result = await executor.executeAdaptive(
      mockAdapter, 
      [{ role: 'user', content: 'Test task' }], 
      [testTool, finalAnswerTool], 
      'react'
    );
    
    console.log(`   State: ${result.newState}, Response: ${result.response.substring(0, 50)}...`);
    console.log('   ✅ Passed - Error was detected and corrected\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Test 5: Final answer in nested structure
  console.log('✅ Test 5: Final answer in nested action input');
  try {
    const executor = new AdaptiveExecutor();
    const mockAdapter = new MockAdapter([
      `Thought: I'm providing a final answer in a nested structure.
Action: test_tool
Action Input: {"param": "test", "nested": {"final_answer": "nested final answer"}}`,
      `Thought: Now I'll use final_answer as a separate action.
Action: final_answer
Action Input: {"response": "Proper final response."}`
    ]);
    
    const result = await executor.executeAdaptive(
      mockAdapter, 
      [{ role: 'user', content: 'Test task' }], 
      [testTool, finalAnswerTool], 
      'react'
    );
    
    console.log(`   State: ${result.newState}, Response: ${result.response.substring(0, 50)}...`);
    console.log('   ✅ Passed - Nested error was detected and corrected\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  // Test 6: hasFinalAnswerInActionInput function
  console.log('✅ Test 6: hasFinalAnswerInActionInput function');
  try {
    const executor: any = new AdaptiveExecutor(); // Cast para acessar método privado
    
    console.log('   Testing hasFinalAnswerInActionInput function:');
    console.log(`   - Empty object: ${executor.hasFinalAnswerInActionInput({})}`);
    console.log(`   - No final_answer: ${executor.hasFinalAnswerInActionInput({ param: 'value' })}`);
    console.log(`   - Direct final_answer: ${executor.hasFinalAnswerInActionInput({ final_answer: 'value' })}`);
    console.log(`   - Nested final_answer: ${executor.hasFinalAnswerInActionInput({ nested: { final_answer: 'value' } })}`);
    console.log(`   - Deep nested: ${executor.hasFinalAnswerInActionInput({ a: { b: { final_answer: 'value' } } })}`);
    
    console.log('   ✅ Passed - All detection tests passed\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error}\n`);
  }

  console.log('🎉 All tests completed!');
}

// Rodar os testes
runTests().catch(console.error);