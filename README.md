# LangGraph & LangChain PoC

A step-by-step PoC for learning `langchain` + `@langchain/langgraph` in TypeScript, built with Claude via `@langchain/anthropic`.

Each step is a self-contained, runnable program. The point isn't the toy tools (a mocked weather lookup and a basic calculator) — it's watching one specific LangGraph concept get introduced at each step, layered on top of the previous one, with real output from a real model run backing every claim.

**This is the introduction, not the whole framework.** It covers exactly one slice of LangChain: building an agent that calls tools, from a hand-rolled `if` up through a hand-built `StateGraph` with error recovery and a recursion limit. Everything else LangChain does — RAG, structured output, memory/persistence, other model providers, observability, deployment — is deliberately left out here and picked up in separate mini-projects (see [What's next](#whats-next)).

## Requirements

- Node.js 22.18+, or 23.6+ (native TypeScript execution, enabled without flags — see [Why no build step](#why-no-build-step))
- An Anthropic API key

## Setup

```bash
npm install
```

Create a `.env` file in the project root (see `.gitignore` — it's not committed):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then run any step:

```bash
npm run step0   # no API key needed, no network call
npm run step1
npm run step2
npm run step3
npm run step4
```

## The steps

| Step | Run | What it introduces |
|---|---|---|
| **0** | `npm run step0` | Baseline with no framework: an `if` and a regex decide which function to call and extract its arguments by hand. No LangChain, no model, no network call. The reference point everything else is compared against. |
| **1** | `npm run step1` | `createAgent` with two tools wrapped via `tool()` (name + description + Zod schema). The model — not an `if` — decides which tool to call and when to stop, in a ReAct loop (`Reason → Act → observe → repeat`) that `createAgent` builds and hides. |
| **2** | `npm run step2` | The exact same loop, rebuilt by hand with `StateGraph`: an explicit `StateSchema`, a `callModel` node, an `executeTools` node, and a conditional edge (`shouldContinue`) deciding whether to loop back or end. Shows what `createAgent` was doing internally. |
| **3** | `npm run step3` | A real branch: a `validateResults` node that catches tool failures (e.g. an invalid `calculate` expression) and turns them into a `ToolMessage` with `status: "error"` instead of crashing the run. The error flows back through the same loop so the model can retry — a real cycle, not a one-shot `if/else`. |
| **4** | `npm run step4` | `recursionLimit` and the real `GraphRecursionError`. Forces the same graph to run out of steps (`recursionLimit: 2` on a request that legitimately needs more), catches the actual error (`instanceof GraphRecursionError`), then reruns the same request with a workable limit to show the contrast. |

## Project structure

```
src/
  lib/           # shared code, used by every step
    toys.ts      # the two toy "tools" as plain functions (getWeather, calculate)
    log.ts       # console logging helper shared by steps 1-4
  step0/
    index.ts
  step1/
    tools.ts     # tool() wrappers around lib/toys.ts
    agent.ts     # ChatAnthropic + createAgent
    index.ts     # runner: prompts + logging
  step2/
    state.ts     # StateSchema
    nodes.ts     # callModel, executeTools, shouldContinue
    graph.ts     # StateGraph wiring
    index.ts
  step3/         # same shape as step2, plus validateResults + toolResults state
  step4/         # same graph as step3, different invocation config
```

`lib/toys.ts` and `lib/log.ts` are the only files shared across steps — everything else is duplicated per step folder on purpose, so any single `stepN/` directory can be read, copied, or deleted on its own without pulling in another step.

## Why no build step

There's no `tsx`, no `ts-node`, no compiled output. Every step runs directly with `node src/stepN/index.ts`. Since Node 22.18 (and 23.6 on the current release line), Node strips TypeScript type annotations natively, without any flag — it never compiles them, so `tsconfig.json` only ever runs as a type checker (`npm run typecheck`), never as a build. That's also why imports use real `.ts` extensions (`from "../lib/toys.ts"`) instead of the conventional `.js` — there's no `.js` file being resolved.

Three `tsconfig.json` options exist specifically to stay inside what Node's stripper can handle:

- `allowImportingTsExtensions` — permits importing `.ts` paths directly
- `erasableSyntaxOnly` — fails the type check on syntax Node can't erase (enums, namespaces, parameter properties)
- `verbatimModuleSyntax` — forces `import type` for type-only imports, so a type import can't survive stripping and crash at runtime looking for a missing export

## Notes on model non-determinism

The model is not deterministic in how it phrases tool arguments. In one comparison run, the same prompt produced `getWeather({"city":"Lima"})` in Step 1 and `getWeather({"city":"Lima, Peru"})` in Step 2 — different strings into a tool that hashes its input for the mock temperature, so the two runs showed different weather. The graph/loop *structure* is what's guaranteed to match across steps; exact wording and tool-call arguments can vary run to run.

## Out of scope

No checkpointer, no LangSmith, no deployment. This PoC stops at in-memory, single-run graphs — persistence and observability are a follow-up, not covered here.

## What's next

This repo only covers the "agent with tools" slice of LangChain. The rest is planned as separate, equally step-by-step mini-projects rather than being bolted onto this one:

- **Structured output & prompting** — `responseFormat` on `createAgent`, `PromptTemplate`, few-shot prompting, token-level streaming (this PoC only streams state snapshots via `streamMode: "values"`, never individual tokens).
- **RAG** — vector stores, embeddings, retrievers, text splitters. None of that appears here; this PoC never reads an external document.
- **Memory & persistence** — a checkpointer, multi-turn threads that remember prior messages across separate runs (right now, every `npm run stepN` starts a brand-new conversation).
- **Observability & deployment** — LangSmith tracing and evals, serving a graph via LangGraph Platform.
- **Other providers** — this PoC only wires up Anthropic; LangChain's provider-agnostic model swapping isn't exercised here.

Each of those will get its own PoC, following the same format as this one: minimal code, one new concept per step, real output from real runs backing every claim.

## Versions

Pinned against npm at the time this PoC was built (these libraries move fast — don't assume these are current):

| Package | Version |
|---|---|
| `langchain` | 1.5.4 |
| `@langchain/langgraph` | 1.4.8 |
| `@langchain/anthropic` | 1.5.2 |
| `@langchain/core` | 1.2.3 |
| `zod` | 4.4.3 |
