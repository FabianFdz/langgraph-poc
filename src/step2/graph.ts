/**
 * STEP 2 — Wiring: StateGraph construction.
 *
 * This is the part `createAgent` fully hid from us in Step 1: declaring the
 * nodes and edges explicitly and compiling them into a runnable graph.
 *
 *   START -> callModel -> (conditional) -> executeTools -> callModel -> ...
 *                                       -> END
 *
 * The cycle "callModel -> executeTools -> callModel" is the ReAct loop,
 * written out as actual graph edges instead of being implicit in a library
 * function.
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.ts";
import { callModel, executeTools, shouldContinue } from "./nodes.ts";

export const graph = new StateGraph(AgentState)
  .addNode("callModel", callModel)
  .addNode("executeTools", executeTools)
  .addEdge(START, "callModel")
  .addConditionalEdges("callModel", shouldContinue, ["executeTools", END])
  .addEdge("executeTools", "callModel")
  .compile();
