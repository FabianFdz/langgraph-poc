/**
 * PASO 0 — Baseline SIN framework.
 *
 * Enrutamiento a mano: yo miro el string del usuario, decido con un `if`
 * cuál tool corresponde, extraigo los argumentos con regex, y la llamo.
 * Cero LangChain, cero LangGraph, cero modelo. Ni siquiera hay red.
 *
 * Este es el punto de comparación para todo lo que viene.
 */

import { calculate, getWeather } from "./lib/toys.js";

/**
 * El "router" hecho a mano. Toda la inteligencia del sistema vive acá.
 */
function handle(userInput: string): string {
  const input = userInput.toLowerCase();

  // --- Rama 1: parece una pregunta de clima ---
  if (input.includes("clima") || input.includes("tiempo")) {
    // Extraer la ciudad: asumo el patrón "... en <Ciudad>"
    const match = userInput.match(/en\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]*(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]*)*)/);
    if (!match) return "No pude extraer la ciudad del input.";

    const weather = getWeather(match[1]);
    return `Clima en ${weather.city}: ${weather.tempC}°C, ${weather.condition}.`;
  }

  // --- Rama 2: parece una operación aritmética ---
  if (/[\d]\s*[+\-*/%]\s*[\d]/.test(userInput)) {
    // Extraer la expresión: me quedo sólo con los caracteres "matemáticos"
    const expression = userInput.match(/[\d\s.+\-*/%()]+/)?.[0]?.trim();
    if (!expression) return "No pude extraer la expresión del input.";

    try {
      return `Resultado: ${calculate(expression)}`;
    } catch (error) {
      return `Error al calcular: ${(error as Error).message}`;
    }
  }

  // --- Rama 3: no sé qué hacer ---
  return "No supe qué tool usar para eso.";
}

// ---------------------------------------------------------------------------

const requests = [
  "¿Cómo está el clima en Bogotá?",           // -> getWeather, funciona
  "Cuánto es 17 * 3 + 2",                      // -> calculate, funciona
  "Necesito la temperatura de San José",       // -> ninguna: no dije "clima"
  "Sumale 5 al doble de 21",                   // -> ninguna: no hay dígitos+operador
  "Compará el clima de Lima y Quito",          // -> getWeather, pero sólo una ciudad
];

for (const request of requests) {
  console.log(`\n> ${request}`);
  console.log(`  ${handle(request)}`);
}
