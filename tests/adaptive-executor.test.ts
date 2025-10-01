import { AdaptiveExecutor } from '../src/core/adaptive-executor';
import { ChatMessage } from '../src/adapters/provider-adapter';
import { Tool } from '../src/adapters/provider-adapter';
import * as v from 'valibot';

// Mock para ProviderAdapter
class MockAdapter {
  constructor(public responses: string[] = []) {}
  
  async sendMessage({ messages }: { messages: ChatMessage[] }) {
    const response = this.responses.shift() || 'Default response';
    return { content: response };
  }
}

// Ferramenta de teste
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

describe('AdaptiveExecutor', () => {
  let executor: AdaptiveExecutor;
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    executor = new AdaptiveExecutor();
    mockAdapter = new MockAdapter();
  });

  test('should execute final_answer tool as separate action correctly', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test task' }];
    const tools = [testTool, finalAnswerTool];
    
    // Simula uma resposta que usa final_answer como ação separada
    const responseWithFinalAnswer = `Thought: I have completed the task.
Action: final_answer
Action Input: {"response": "This is the final answer to the user."}`;
    
    mockAdapter.responses = [responseWithFinalAnswer];
    
    const result = await executor.executeAdaptive(mockAdapter, messages, tools, 'react');
    
    expect(result.newState).toBe('chat'); // Deve encerrar o ciclo
    expect(result.response).toContain('This is the final answer to the user.');
  });

  test('should handle final_answer incorrectly included in other tool parameters', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test task' }];
    const tools = [testTool, finalAnswerTool];
    
    // Simula uma resposta onde final_answer é incluído como parâmetro
    const responseWithFinalAnswerInParam = `Thought: I'm trying to provide a final answer incorrectly.
Action: test_tool
Action Input: {"param": "test", "final_answer": "This should be separate!"}`;
    
    // A próxima resposta deve corrigir o erro
    const correctedResponse = `Thought: Now I'll use final_answer as a separate action.
Action: final_answer
Action Input: {"response": "Correct final response."}`;
    
    mockAdapter.responses = [responseWithFinalAnswerInParam, correctedResponse];
    
    const result = await executor.executeAdaptive(mockAdapter, messages, tools, 'react');
    
    // O primeiro erro deve ter sido detectado e corrigido no loop
    expect(result.newState).toBe('chat'); // Deve encerrar após a correção
    expect(result.response).toContain('Correct final response.');
  });

  test('should handle responses without ReAct structure', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test task' }];
    const tools = [testTool, finalAnswerTool];
    
    // Simula uma resposta sem estrutura ReAct
    const nonReActResponse = `This is just a regular text response without proper structure.`;
    
    // A próxima resposta deve vir com estrutura correta
    const correctedResponse = `Thought: Now I'll provide a structured response.
Action: final_answer
Action Input: {"response": "Final answer after correction."}`;
    
    mockAdapter.responses = [nonReActResponse, correctedResponse];
    
    const result = await executor.executeAdaptive(mockAdapter, messages, tools, 'react');
    
    expect(result.newState).toBe('chat'); // Deve encerrar após a resposta correta
    expect(result.response).toContain('Final answer after correction.');
  });

  test('should handle malformed ReAct structure', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test task' }];
    const tools = [testTool, finalAnswerTool];
    
    // Simula uma resposta com estrutura ReAct incompleta (falta Action Input)
    const malformedResponse = `Thought: I'm thinking about the task.
Action: test_tool`;
    // Note que falta o Action Input
    
    // A próxima resposta deve vir com estrutura correta
    const correctedResponse = `Thought: Now I'll provide a properly structured response.
Action: test_tool
Action Input: {"param": "corrected param"}
Observation: {"result": "Tool executed correctly"}
Thought: Now I have all information for the final answer.
Action: final_answer
Action Input: {"response": "Final answer after correction."}`;
    
    mockAdapter.responses = [malformedResponse, correctedResponse];
    
    const result = await executor.executeAdaptive(mockAdapter, messages, tools, 'react');
    
    expect(result.newState).toBe('chat'); // Deve encerrar após a resposta correta
    expect(result.response).toContain('Final answer after correction.');
  });

  test('should detect final_answer in nested action input', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test task' }];
    const tools = [testTool, finalAnswerTool];
    
    // Simula uma resposta com final_answer aninhado no action input
    const responseWithNestedFinalAnswer = `Thought: I'm providing a final answer in a nested structure.
Action: test_tool
Action Input: {"param": "test", "nested": {"final_answer": "nested final answer"}}`;
    
    // A próxima resposta deve vir com estrutura correta
    const correctedResponse = `Thought: Now I'll use final_answer as a separate action.
Action: final_answer
Action Input: {"response": "Proper final answer."}`;
    
    mockAdapter.responses = [responseWithNestedFinalAnswer, correctedResponse];
    
    const result = await executor.executeAdaptive(mockAdapter, messages, tools, 'react');
    
    expect(result.newState).toBe('chat'); // Deve encerrar após a correção
    expect(result.response).toContain('Proper final answer.');
  });

  test('should properly parse ReAct response components', () => {
    const executor: any = new AdaptiveExecutor(); // Usando any para acessar métodos privados
    
    const response = `Thought: I need to create a file.
Action: test_tool
Action Input: {"param": "test value"}`;
    
    const parsed = executor.parseReActResponse(response);
    
    expect(parsed.thought).toBe('I need to create a file.');
    expect(parsed.action).toBe('test_tool');
    expect(parsed.actionInput).toEqual({ param: 'test value' });
  });

  test('should detect final_answer presence in action input correctly', () => {
    const executor: any = new AdaptiveExecutor(); // Usando any para acessar métodos privados
    
    // Testa vários cenários
    expect(executor.hasFinalAnswerInActionInput({})).toBe(false);
    expect(executor.hasFinalAnswerInActionInput({ param: 'value' })).toBe(false);
    expect(executor.hasFinalAnswerInActionInput({ final_answer: 'some value' })).toBe(true);
    expect(executor.hasFinalAnswerInActionInput({ param: 'value', final_answer: 'some value' })).toBe(true);
    expect(executor.hasFinalAnswerInActionInput({ nested: { final_answer: 'nested value' } })).toBe(true);
    expect(executor.hasFinalAnswerInActionInput({ 
      nested: { 
        deeper: { 
          final_answer: 'deep value' 
        } 
      } 
    })).toBe(true);
    expect(executor.hasFinalAnswerInActionInput({ 
      param: 'value',
      another: {
        nested: { 
          final_answer: 'nested value' 
        }
      }
    })).toBe(true);
    expect(executor.hasFinalAnswerInActionInput(null)).toBe(false);
    expect(executor.hasFinalAnswerInActionInput('not an object')).toBe(false);
  });
});