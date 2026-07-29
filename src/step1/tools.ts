/**
 * STEP 1 — Tool definitions.
 *
 * Wraps the Step 0 plain functions (../lib/toys.ts) as LangChain tools.
 * Same underlying logic as Step 0. What's new is the metadata (name,
 * description, Zod schema) that lets the MODEL decide when and how to call
 * them — instead of an `if` deciding for it.
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
