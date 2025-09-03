import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QueryClassification } from './types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Model Configuration ---
// The model used to determine if a query is TRIVIAL or COMPLEX.
const CLASSIFICATION_MODEL = 'gemini-2.5-flash';

// The model used for simple, factual, or short queries.
const TRIVIAL_ANSWER_MODEL = 'gemini-2.5-flash';

// The model used for in-depth, creative, or multi-step reasoning queries.
// In a real-world scenario, you might use a more powerful model here.
const COMPLEX_ANSWER_MODEL = 'gemini-2.5-flash';

/**
 * Classifies a user's query as either TRIVIAL or COMPLEX.
 * This is the core of the "smart router".
 * @param query The user's query string.
 * @returns The classification of the query.
 */
export const classifyQuery = async (query: string): Promise<QueryClassification> => {
  const prompt = `
    Analyze the following user query and classify it as either 'TRIVIAL' or 'COMPLEX'.
    - A 'TRIVIAL' query can be answered with a short, factual statement, a simple definition, or a quick calculation. Examples: "What is the capital of France?", "How many feet are in a mile?".
    - A 'COMPLEX' query requires in-depth explanation, creative generation, multi-step reasoning, or analysis of a nuanced topic. Examples: "Explain the theory of relativity in simple terms", "Write a short story about a robot who discovers music".

    Respond ONLY with a JSON object. Do not add any other text or markdown formatting.

    Query: "${query}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: CLASSIFICATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.STRING,
              enum: [QueryClassification.TRIVIAL, QueryClassification.COMPLEX],
            },
          },
          required: ['classification'],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.classification;

  } catch (error) {
    console.error("Error during query classification:", error);
    // Default to COMPLEX to be safe, ensuring a more powerful model handles uncertainty.
    return QueryClassification.COMPLEX;
  }
};

/**
 * Selects the appropriate model based on the query's classification.
 * @param classification The result from `classifyQuery`.
 * @returns The name of the Gemini model to use.
 */
export const selectModel = (classification: QueryClassification): string => {
  return classification === QueryClassification.TRIVIAL 
    ? TRIVIAL_ANSWER_MODEL 
    : COMPLEX_ANSWER_MODEL;
};

/**
 * Generates a complete answer from a given model.
 * @param query The user's query.
 * @param model The name of the model to use.
 * @returns The full text answer.
 */
export const generateAnswer = async (query: string, model: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: query,
    });
    return response.text;
  } catch (error) {
    console.error(`Error generating answer with model ${model}:`, error);
    throw new Error("Failed to generate an answer from the model.");
  }
};

/**
 * Generates an answer as an async iterable stream of chunks.
 * @param query The user's query.
 * @param model The name of the model to use.
 * @returns An async iterable of GenerateContentResponse chunks.
 */
export const generateAnswerStream = async (
  query: string, 
  model: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    return await ai.models.generateContentStream({
      model: model,
      contents: query,
    });
  } catch (error) {
    console.error(`Error generating streaming answer with model ${model}:`, error);
    throw new Error("Failed to generate a streaming answer from the model.");
  }
};
