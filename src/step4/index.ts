/**
 * STEP 4 — Runner: forcing and catching GraphRecursionError.
 *
 * `recursionLimit` caps how many SUPERSTEPS a graph run may take before
 * LangGraph gives up and throws — regardless of why the loop keeps going
 * (a genuinely ambiguous task, a model stuck retrying, or just an honest
 * multi-step request). Default is 25. We force the failure the reliable
 * way: pick a normal request that legitimately needs more than a couple of
 * steps, and set the limit artificially low.
 *
 * The request below needs at least 4 node executions to finish normally:
 *   callModel -> executeTools -> validateResults -> callModel -> END
 * so recursionLimit: 2 is guaranteed to run out before reaching END.
 */

import { GraphRecursionError } from "@langchain/langgraph";
import { graph } from "./graph.ts";
import { logMessage } from "../lib/log.ts";

const prompt = "What's the weather in Lima, and what is 8 * 8?";
const input = { messages: [{ role: "user" as const, content: prompt }] };

// --- Attempt 1: recursionLimit way too low for this request ---------------
console.log(`\n> ${prompt}  (recursionLimit: 2)`);
try {
  await graph.invoke(input, { recursionLimit: 2 });
  console.log("  (unexpected: this should have thrown)");
} catch (error) {
  if (error instanceof GraphRecursionError) {
    // This is the REAL error LangGraph throws — not a simulation.
    console.log(`  Caught GraphRecursionError`);
    console.log(`    name:          ${error.name}`);
    console.log(`    lc_error_code: ${error.lc_error_code}`);
    console.log(`    message:       ${error.message}`);
  } else {
    // Not the error we expected — surface it instead of hiding it.
    throw error;
  }
}

// --- Attempt 2: same request, a limit generous enough to actually finish --
console.log(`\n> ${prompt}  (recursionLimit: 15)`);
const stream = await graph.stream(input, { recursionLimit: 15, streamMode: "values" });
let seen = 0;
for await (const step of stream) {
  const messages = step.messages;
  for (const msg of messages.slice(seen)) {
    logMessage(msg);
  }
  seen = messages.length;
}
