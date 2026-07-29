/**
 * STEP 2 — Tool definitions.
 *
 * Identical to step1/tools.ts. Repeated here (not imported from step1) so
 * this folder stays self-contained: you can read, copy, or delete step2/
 * without needing anything from step1/.
 */

import { tool } from "langchain";
import { z } from "zod";
import { calculate, getWeather } from "../lib/toys.ts";

export const getWeatherTool = tool(
  ({ city }: { city: string }) => {
    const weather = getWeather(city);
    return `${weather.tempC}°C, ${weather.condition}`;
  },
  {
    name: "getWeather",
    description: "Get the current weather for a given city.",
    schema: z.object({
      city: z.string().describe("The city to get the weather for, e.g. 'San José'"),
    }),
  }
);

export const calculateTool = tool(
  ({ expression }: { expression: string }) => {
    const result = calculate(expression);
    return String(result);
  },
  {
    name: "calculate",
    description: "Evaluate a simple arithmetic expression, e.g. '2 + 2 * 10'.",
    schema: z.object({
      expression: z.string().describe("An arithmetic expression using + - * / % and parentheses"),
    }),
  }
);
