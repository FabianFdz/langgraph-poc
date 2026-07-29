/**
 * STEP 0 — Baseline WITHOUT a framework.
 *
 * Hand-rolled routing: I look at the user's string, decide with an `if`
 * which tool applies, extract the arguments with a regex, and call it.
 * No LangChain, no LangGraph, no model. Not even a network call.
 *
 * This is the reference point for everything that follows.
 */

// Note the ".ts" extension: Node resolves the real file on disk. There is no
// build step producing a ".js", so ".js" here would be a lie.
import { calculate, getWeather } from "../lib/toys.ts";

/**
 * The hand-written router. All of the system's "intelligence" lives here.
 */
function handle(userInput: string): string {
  const input = userInput.toLowerCase();

  // --- Branch 1: looks like a weather question ---
  // Deliberately narrow: only the word "weather" triggers this branch, not
  // "temperature" — that gap is what request #3 below is designed to expose.
  if (input.includes("weather")) {
    // Extract the city: assumes the pattern "... in <City>"
    const match = userInput.match(/in\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]*(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]*)*)/);
    if (!match) return "Could not extract the city from the input.";

    const weather = getWeather(match[1]);
    return `Weather in ${weather.city}: ${weather.tempC}°C, ${weather.condition}.`;
  }

  // --- Branch 2: looks like an arithmetic operation ---
  if (/[\d]\s*[+\-*/%]\s*[\d]/.test(userInput)) {
    // Extract the expression: keep only the "math" characters
    const expression = userInput.match(/[\d\s.+\-*/%()]+/)?.[0]?.trim();
    if (!expression) return "Could not extract the expression from the input.";

    try {
      return `Result: ${calculate(expression)}`;
    } catch (error) {
      return `Error while calculating: ${(error as Error).message}`;
    }
  }

  // --- Branch 3: no idea what to do ---
  return "Didn't know which tool to use for that.";
}

// ---------------------------------------------------------------------------

const requests = [
  "What's the weather in San José, Costa Rica?", // -> getWeather, works (regex stops at the comma, drops ", Costa Rica")
  "How much is 17 * 3 + 2",                  // -> calculate, argument extraction bug
  "I need the temperature",                  // -> neither: says "temperature", not "weather"
  "Add 5 to double of 21",                   // -> neither: no digit+operator pair
  "Compare the weather in Lima and Quito",   // -> getWeather, but only one city
];

for (const request of requests) {
  console.log(`\n> ${request}`);
  console.log(`  ${handle(request)}`);
}
