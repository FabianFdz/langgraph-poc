/**
 * STEP 3 — Runner.
 *
 * Same four prompts as Steps 1-2, plus a new one designed to force
 * `calculate` to fail on the first attempt: asking for an exponent "with
 * the ^ symbol" nudges the model toward a "2^10" expression, which our
 * whitelist in ../lib/toys.ts rejects (^ isn't in it). Watch for the
 * sequence: TOOL CALL (invalid) -> TOOL ERROR -> TOOL CALL (retry, valid
 * this time) -> TOOL RESULT -> FINAL ANSWER. That round trip is the cycle
 * this step adds.
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
  "What is 2 to the power of 10? Try writing the exponent with the ^ symbol.", // forces a retry
];

for (const prompt of prompts) {
  await run(prompt);
}
