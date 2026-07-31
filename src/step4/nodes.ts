/**
 * STEP 4 — Nodes.
 *
 * Identical to step3/nodes.ts (callModel, executeTools, validateResults,
 * shouldContinue). Nothing about the loop logic changes in this step — the
 * new thing is entirely in how we CALL the graph (see ./index.ts).
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
