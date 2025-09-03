export enum QueryClassification {
  TRIVIAL = 'TRIVIAL',
  COMPLEX = 'COMPLEX',
}

// For internal tracking after a query is processed
export interface SmartAnswer {
  classification: QueryClassification;
  modelUsed: string;
  answer: string;
  error?: string;
}

// Defines the expected structure of an incoming request to our server,
// mimicking the OpenAI Chat Completions API.
export interface OpenAIChatCompletionRequest {
  model: string; // This field will be ignored by our router, but is part of the spec
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  stream?: boolean;
}
