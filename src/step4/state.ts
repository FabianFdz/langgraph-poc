/**
 * STEP 4 — State schema.
 *
 * Identical to step3/state.ts. Repeated here so this folder stays
 * self-contained. Step 4 doesn't add a new state field — it reuses the
 * exact same graph shape from Step 3 and changes how we INVOKE it.
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
        output: z.string(),
      })
    )
    .default(() => []),
});
