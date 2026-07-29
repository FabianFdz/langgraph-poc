/**
 * STEP 3 — State schema, now with a scratch field for tool results.
 *
 * Same `messages` field as Step 2. New: `toolResults`, an intermediate
 * holding area between `executeTools` and the new `validateResults` node
 * (see ./nodes.ts). A plain Zod field with no wrapper (`ReducedValue`,
 * `DeltaValue`, ...) is a "LastValue" channel: every update REPLACES it
 * instead of appending. That's what we want here — `toolResults` only needs
 * to survive the single hop from `executeTools` to `validateResults`, not
 * accumulate across the whole conversation like `messages` does.
 */

import { MessagesValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

export const AgentState = new StateSchema({
  messages: MessagesValue,
  toolResults: z
    .array(
      z.object({
        toolCallId: z.string(),
        toolName: z.string(),
        ok: z.boolean(),
        // Either the tool's raw output (ok: true) or the error message
        // (ok: false) — always a string, so validateResults can turn either
        // one into a ToolMessage without a second branch on the type.
        output: z.string(),
      })
    )
    .default(() => []),
});
