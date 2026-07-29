/**
 * STEP 1 — Runner: `createAgent` with two tools.
 *
 * Runs a handful of prompts through the agent built in ./agent.ts and logs
 * every message as it streams in, so you can see when the model calls a
 * tool versus when it decides to stop and answer.
 */

import { agent } from "./agent.ts";
import { logMessage } from "../lib/log.ts";

async function run(prompt: string): Promise<void> {
  console.log(`\n> ${prompt}`);

  const stream = await agent.stream(
    { messages: [{ role: "user", content: prompt }] },
    { streamMode: "values" } // yields the FULL state after every step
  );

  let seen = 0;
  for await (const step of stream) {
    const messages = step.messages;
    // Only print messages we haven't printed yet (each "values" chunk is the
    // whole conversation so far, not just the delta).
    for (const msg of messages.slice(seen)) {
      logMessage(msg);
    }
    seen = messages.length;
  }
}

const prompts = [
  "What's the weather in San José, Costa Rica?",         // 1 tool call, then finish
  "How much is 17 * 3 + 2?",                              // 1 tool call, then finish
  "What's the weather in Lima, and what is 8 * 8?",       // 2 tool calls, then finish
  "What's your favorite color?",                          // 0 tool calls: finishes immediately
];

for (const prompt of prompts) {
  await run(prompt);
}
