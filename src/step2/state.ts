/**
 * STEP 2 — State schema.
 *
 * This is the "State" concept made explicit: a typed shape that flows
 * through every node of the graph. Each node receives it and returns a
 * partial update; LangGraph merges that update using each field's reducer.
 *
 * `messages` uses `MessagesValue`, a prebuilt reducer that APPENDS new
 * messages to the list (instead of overwriting it) and de-duplicates by
 * message id. That reducer behavior is exactly why the message history
 * accumulates across loop iterations instead of resetting each time.
 */

import { MessagesValue, StateSchema } from "@langchain/langgraph";

export const AgentState = new StateSchema({
  messages: MessagesValue,
});
