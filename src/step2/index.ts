/**
 * STEP 2 — Runner.
 *
 * Same prompts as Step 1, run through the hand-built graph in ./graph.ts
 * instead of `createAgent`. If the concept holds, the observable behavior
 * (tool calls, results, final answers) should look the same — the only
 * difference is that now every part of the loop is code we wrote and can
 * see, in ./state.ts, ./nodes.ts and ./graph.ts.
 */

import { graph } from "./graph.ts";
import { logMessage } from "../lib/log.ts";

async function run(prompt: string): Promise<void> {
  console.log(`\n> ${prompt}`);

  const stream = await graph.stream(
    { messages: [{ role: "user", content: prompt }] },
    { streamMode: "values" }
  );

  let seen = 0;
  for await (const step of stream) {
    const messages = step.messages;
    for (const msg of messages.slice(seen)) {
      logMessage(msg);
    }
    seen = messages.length;
  }
}

const prompts = [
  "What's the weather in San José, Costa Rica?",
  "How much is 17 * 3 + 2?",
  "What's the weather in Lima, and what is 8 * 8?",
  "What's your favorite color?",
];

for (const prompt of prompts) {
  await run(prompt);
}
