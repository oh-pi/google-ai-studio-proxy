#!/usr/bin/env node

// FIX: Import Request and Response types from express to correctly type handler arguments.
// FIX: Changed to default import and fully qualified types to avoid name collisions with global types.
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// FIX: The import from 'process' was incorrect as `process` is a global object in Node.js.
// The incorrect import has been removed.
import { OpenAIChatCompletionRequest } from './types';
import { classifyQuery, selectModel, generateAnswer, generateAnswerStream } from './geminiService';
import { version } from '../package.json';

// Load environment variables from .env file for local development.
// In the Homebrew installation, these are set by the wrapper script.
dotenv.config();

// Handle command-line flags
// FIX: Use `process.argv` and `process.exit` from the global `process` object.
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(version);
  process.exit(0);
}

const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Listen on all network interfaces to be accessible on the LAN

app.use(cors());
app.use(express.json());

// FIX: Use explicit `Request` and `Response` types for the handler to resolve property access errors on req and res.
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  const { messages, stream } = req.body as OpenAIChatCompletionRequest;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) {
    return res.status(400).json({ error: 'No user message found' });
  }
  
  const query = lastUserMessage.content;
  const id = `chatcmpl-${Date.now()}`;

  try {
    // 1. Classify the query to select the right model
    const classification = await classifyQuery(query);
    const model = selectModel(classification);
    console.log(`Query classified as: ${classification}, using model: ${model}`);

    if (stream) {
      // 2. Handle Streaming Response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamResponse = await generateAnswerStream(query, model);
      for await (const chunk of streamResponse) {
        const delta = { content: chunk.text };
        const responseChunk = {
          id,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model, // The model we decided to use
          choices: [{ index: 0, delta, finish_reason: null }],
        };
        res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
      }
      // Send the final chunk with finish_reason
      res.write(`data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

    } else {
      // 3. Handle Non-Streaming Response
      const answer = await generateAnswer(query, model);
      const response = {
        id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model, // The model we decided to use
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: answer,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 0, // Note: Gemini API does not provide token counts in the same way
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
      res.json(response);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});

app.listen(Number(port), host, () => {
  console.log(`Gemini Smart Router is listening on ${host}:${port}`);
  console.log('Now accessible on your local network.');
  console.log(`To connect from other devices, find this machine's IP address and use http://<IP_ADDRESS>:${port}`);
  console.log('OpenAI-compatible endpoint available at /v1/chat/completions');
});