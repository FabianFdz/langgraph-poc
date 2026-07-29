/**
 * STEP 3 — Nodes, now including a real validation branch.
 *
 * `executeTools` no longer assumes every tool call succeeds. If a tool
 * throws (e.g. `calculate` rejects an invalid expression), we catch it PER
 * CALL and record the failure instead of letting the whole node crash — by
 * default, an uncaught exception here would abort the entire graph run.
 *
 * `validateResults` is the new node this step adds. It turns each raw
 * outcome into a proper `ToolMessage`, using the `status: "error"` field to
 * mark failures. That error message's content is what the model reads on
 * its NEXT turn — so instead of terminating on failure, the very same edge
 * that already loops back to `callModel` (see ./graph.ts) carries the error
 * back for the model to react to.
 *
 * That's what makes this a real cycle and not a one-shot if/else: nothing
 * here caps how many times the model can retry. It just keeps going around
 * until it succeeds, or the model gives up and answers anyway. Step 4 is
 * what puts a hard limit on that.
 */

import { END } from "@langchain/langgraph";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import type { AgentState } from "./state.ts";
import { calculateTool, getWeatherTool } from "./tools.ts";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const modelWithTools = model.bindTools([getWeatherTool, calculateTool]);

const toolsByName = new Map<string, StructuredToolInterface>([
  [getWeatherTool.name, getWeatherTool],
  [calculateTool.name, calculateTool],
]);

export async function callModel(
  state: typeof AgentState.State
): Promise<typeof AgentState.Update> {
  const response = await modelWithTools.invoke(state.messages);
  return { messages: [response] };
}

export async function executeTools(
  state: typeof AgentState.State
): Promise<typeof AgentState.Update> {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const calls = lastMessage.tool_calls ?? [];

  const toolResults = await Promise.all(
    calls.map(async (call) => {
      const matchingTool = toolsByName.get(call.name);
      try {
        if (!matchingTool) {
          throw new Error(`No tool registered with name "${call.name}".`);
        }
        // Invoking with just the args (not the whole ToolCall) returns the
        // RAW output instead of a ToolMessage — validateResults is what
        // decides how to turn it into a message, once it knows success/fail.
        const output = await matchingTool.invoke(call.args);
        return { toolCallId: call.id ?? "", toolName: call.name, ok: true, output: String(output) };
      } catch (error) {
        return {
          toolCallId: call.id ?? "",
          toolName: call.name,
          ok: false,
          output: (error as Error).message,
        };
      }
    })
  );

  // Note: we return `toolResults`, not `messages`. This node's job stops at
  // "what happened", not "how do I tell the model about it".
  return { toolResults };
}

export function validateResults(
  state: typeof AgentState.State
): typeof AgentState.Update {
  const messages = state.toolResults.map((result) =>
    result.ok
      ? new ToolMessage({
          status: "success",
          name: result.toolName,
          content: result.output,
          tool_call_id: result.toolCallId,
        })
      : new ToolMessage({
          status: "error",
          name: result.toolName,
          // The retry instruction lives INSIDE the message content — this is
          // literally the text the model reads on the next callModel run.
          content: `Error: ${result.output}\nPlease try a different expression.`,
          tool_call_id: result.toolCallId,
        })
  );

  return { messages };
}

export function shouldContinue(
  state: typeof AgentState.State
): "executeTools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const hasToolCalls = (lastMessage.tool_calls?.length ?? 0) > 0;
  return hasToolCalls ? "executeTools" : END;
}
