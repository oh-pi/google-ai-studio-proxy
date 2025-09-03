
import { GoogleGenAI, Type } from "@google/genai";
import { QueryClassification, QueryResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CLASSIFICATION_MODEL = 'gemini-2.5-flash';
const TRIVIAL_ANSWER_MODEL = 'gemini-2.5-flash';
const COMPLEX_ANSWER_MODEL = 'gemini-2.5-flash'; // In a real app, this could be a more powerful model

const classifyQuery = async (query: string): Promise<QueryClassification> => {
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
    throw new Error("Could not classify the query.");
  }
};

const generateAnswer = async (query: string, model: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: query,
    });
    return response.text;
  } catch (error) {
    console.error(`Error generating answer with model ${model}:`, error);
    throw new Error("Failed to generate an answer.");
  }
};

export const getSmartAnswer = async (query: string): Promise<Omit<QueryResult, 'id' | 'query'>> => {
  try {
    const classification = await classifyQuery(query);

    let answer: string;
    let modelUsed: string;

    if (classification === QueryClassification.TRIVIAL) {
      modelUsed = TRIVIAL_ANSWER_MODEL;
      answer = await generateAnswer(query, modelUsed);
    } else {
      modelUsed = COMPLEX_ANSWER_MODEL;
      const complexPrompt = `Provide a detailed, in-depth, and well-structured answer for the following query: "${query}"`;
      answer = await generateAnswer(complexPrompt, modelUsed);
    }

    return {
      classification,
      modelUsed,
      answer,
    };
  } catch (error) {
    console.error("Error in getSmartAnswer:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
        classification: QueryClassification.TRIVIAL, // default
        modelUsed: 'N/A',
        answer: '',
        error: `Smart Router Error: ${errorMessage}`
    }
  }
};
