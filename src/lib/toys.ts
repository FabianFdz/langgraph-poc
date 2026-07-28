/**
 * The two toy "tools", as plain TypeScript functions.
 *
 * Note: there is nothing from LangChain here. These are ordinary functions.
 * In Step 1 we will wrap them with `tool()` so the model can see and call
 * them — but the logic will stay exactly the same. That makes it obvious
 * what the framework adds and what it does not.
 */

export type Weather = {
  city: string;
  tempC: number;
  condition: string;
};

const CONDITIONS = ["sunny", "cloudy", "rainy", "windy"];

/**
 * Mocked weather. Does not call any real API.
 * Deterministic (same input -> same output) so runs are reproducible:
 * we derive the values from a simple hash of the city name.
 */
export function getWeather(city: string): Weather {
  let hash = 0;
  for (const char of city.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return {
    city,
    tempC: 5 + (hash % 31), // range 5..35
    condition: CONDITIONS[hash % CONDITIONS.length],
  };
}

/**
 * Evaluates a simple arithmetic expression.
 *
 * THROWS if the expression is invalid. That is intentional: in Step 3 we use
 * that error to force a branch in the graph.
 *
 * Not production-ready: it uses `new Function` behind a character whitelist.
 * Good enough for a PoC, not for real user input.
 */
export function calculate(expression: string): number {
  // Whitelist: digits, dot, whitespace, parentheses and + - * / % only
  if (!/^[\d\s.+\-*/%()]+$/.test(expression)) {
    throw new Error(
      `Invalid expression: "${expression}". Only numbers and the operators + - * / % ( ) are allowed.`
    );
  }

  let result: unknown;
  try {
    result = new Function(`"use strict"; return (${expression});`)();
  } catch {
    throw new Error(`Could not parse expression: "${expression}".`);
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(
      `Expression "${expression}" did not produce a finite number (got: ${String(result)}).`
    );
  }

  return result;
}
