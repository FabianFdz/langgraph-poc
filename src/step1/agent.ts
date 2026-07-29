/**
 * STEP 1 — Agent construction.
 *
 * `createAgent` builds a ReAct (Reason -> Act -> observe -> repeat) loop:
 * given the model and the tools, it repeatedly asks the model "what next?"
 * until the model answers without calling a tool. Step 2 rebuilds this exact
 * loop by hand with `StateGraph` so you can see what's hidden behind this
 * one function call.
 */

import { createAgent } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { calculateTool, getWeatherTool } from "./tools.ts";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const agent = createAgent({
  model,
  tools: [getWeatherTool, calculateTool],
});
