/**
 * STEP 2 — Nodes and the conditional edge.
 *
 * This is what `createAgent` (Step 1) was doing for us under the hood:
 *
 * - `callModel`: a NODE. Takes the current state, calls the model (bound to
 *   the tools so it knows they exist), and returns a state UPDATE — the new
 *   AI message. LangGraph appends it via the `messages` reducer (see
 *   ./state.ts), it doesn't overwrite the history.
 *
 * - `executeTools`: another NODE. Reads the tool_calls off the last AI
 *   message and actually runs them. Note it handles a LIST of calls, not
 *   just one — Step 1's output showed the model can request several tools
 *   in a single turn (parallel tool calls), so this node must run all of
 *   them before going back to the model.
 *
 * - `shouldContinue`: an EDGE, specifically a CONDITIONAL edge. It's a plain
 *   function that looks at the state and returns the name of the next node
 *   (or END). This is the "if" that decides whether the ReAct loop keeps
 *   going or stops — previously hidden inside `createAgent`.
 */

import { END } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import type { AgentState } from "./state.ts";
import { calculateTool, getWeatherTool } from "./tools.ts";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// .bindTools() attaches the tool schemas to the model's outgoing requests so
// the model KNOWS these tools exist and can request them. It does not run
// anything by itself — that's still executeTools' job below.
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

  const results = await Promise.all(
    calls.map((call) => {
      const matchingTool = toolsByName.get(call.name);
      if (!matchingTool) {
        throw new Error(`No tool registered with name "${call.name}".`);
      }
      // Invoking a tool with a ToolCall object (instead of raw args) makes it
      // return a ToolMessage directly, already carrying the right
      // `tool_call_id` so the model can match result to request.
      return matchingTool.invoke(call);
    })
  );

  return { messages: results };
}

export function shouldContinue(
  state: typeof AgentState.State
): "executeTools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const hasToolCalls = (lastMessage.tool_calls?.length ?? 0) > 0;
  return hasToolCalls ? "executeTools" : END;
}
