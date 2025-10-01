import * as v from 'valibot';
import { Tool } from '../adapters/provider-adapter';

export const finalAnswerTool: Tool = {
  name: 'final_answer',
  description: 'Provides a final response to the user and terminates the interaction. Use this when you have gathered enough information to answer the user\'s request.',
  parameters: v.object({
    response: v.string('The final response to provide to the user')
  }),
  execute: async (args: { response: string }) => {
    // This tool essentially just returns the response as-is
    // The actual termination logic is handled by the AdaptiveExecutor
    return { 
      response: args.response,
      isFinal: true // Flag to indicate this is a final answer
    };
  }
};