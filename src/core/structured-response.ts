// src/structured-response.ts
import * as v from 'valibot';

// Schema para StructuredResponse usando Valibot
export const StructuredResponseSchema = v.object({
  answer: v.string(),
  confidence: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(1)
  ),
  reasoning: v.optional(v.string())
});

// Tipo para StructuredResponse
export type StructuredResponse = v.InferOutput<typeof StructuredResponseSchema>;