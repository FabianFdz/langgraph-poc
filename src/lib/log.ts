/**
 * Shared logging helper for Steps 1-4.
 *
 * Not a LangChain/LangGraph concept — just a small utility so every step
 * prints messages the same way and we can focus the diff between steps on
 * the actual framework code, not on log formatting.
 */

import type { BaseMessage } from "@langchain/core/messages";

/**
 * Prints one message with enough detail to see:
 * - who sent it (human / ai / tool)
 * - whether an AI message is calling a tool, or is the final answer
 * - what a tool actually returned
 */
export function logMessage(msg: BaseMessage): void {
  const type = msg.type; // "human" | "ai" | "tool" | "system"

  if (type === "ai") {
    const toolCalls = (msg as BaseMessage & { tool_calls?: { name: string; args: unknown }[] })
      .tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const call of toolCalls) {
        console.log(`  [AI -> TOOL CALL] ${call.name}(${JSON.stringify(call.args)})`);
      }
    } else {
      // No tool_calls on this AI message means the model decided to stop
      // looping and answer directly. This is the "finish" signal of the
      // ReAct loop.
      console.log(`  [AI -> FINAL ANSWER] ${msg.text}`);
    }
    return;
  }

  if (type === "tool") {
    const toolMsg = msg as BaseMessage & { name?: string; status?: "success" | "error" };
    const name = toolMsg.name ?? "tool";
    // Step 3 introduces `status: "error"` ToolMessages. Success messages
    // print exactly as before — this only adds a new case.
    const label = toolMsg.status === "error" ? "TOOL ERROR" : "TOOL RESULT";
    console.log(`  [${label}] ${name} -> ${msg.text}`);
    return;
  }

  if (type === "human") {
    console.log(`  [HUMAN] ${msg.text}`);
    return;
  }

  console.log(`  [${type.toUpperCase()}] ${msg.text}`);
}
