/**
 * STEP 3 — Wiring.
 *
 * One node added versus Step 2, and it sits BETWEEN executeTools and the
 * loop-back edge to callModel:
 *
 *   START -> callModel -> (conditional) -> executeTools -> validateResults -> callModel -> ...
 *                                       -> END
 *
 * The graph shape doesn't look dramatically different from Step 2 — the
 * important change is inside `executeTools` and `validateResults`
 * (./nodes.ts): a tool failure no longer crashes the run, it becomes a
 * message that flows back through this exact same cycle.
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.ts";
import { callModel, executeTools, shouldContinue, validateResults } from "./nodes.ts";

export const graph = new StateGraph(AgentState)
  .addNode("callModel", callModel)
  .addNode("executeTools", executeTools)
  .addNode("validateResults", validateResults)
  .addEdge(START, "callModel")
  .addConditionalEdges("callModel", shouldContinue, ["executeTools", END])
  .addEdge("executeTools", "validateResults")
  .addEdge("validateResults", "callModel")
  .compile();
