/**
 * STEP 4 — Wiring.
 *
 * Identical graph shape to Step 3: START -> callModel -> (conditional) ->
 * executeTools -> validateResults -> callModel -> ... -> END.
 *
 * Nothing here changes. The point of this step is that `recursionLimit`
 * is NOT a graph-shape concept — it's an execution guard LangGraph applies
 * on top of any graph, regardless of how many nodes it has.
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
