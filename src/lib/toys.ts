/**
 * Las dos "tools" de juguete, como funciones TypeScript planas.
 *
 * Ojo: acá no hay nada de LangChain. Son funciones normales.
 * En el Paso 1 las vamos a envolver con `tool()` para que el modelo
 * pueda verlas y llamarlas — pero la lógica va a seguir siendo esta.
 * Así queda claro qué agrega el framework y qué no.
 */

export type Weather = {
  city: string;
  tempC: number;
  condition: string;
};

const CONDITIONS = ["soleado", "nublado", "lluvioso", "ventoso"];

/**
 * Clima mockeado. No llama ninguna API real.
 * Es determinístico (mismo input -> mismo output) para que las corridas
 * sean reproducibles: derivamos los valores de un hash simple del nombre.
 */
export function getWeather(city: string): Weather {
  let hash = 0;
  for (const char of city.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return {
    city,
    tempC: 5 + (hash % 31), // rango 5..35
    condition: CONDITIONS[hash % CONDITIONS.length],
  };
}

/**
 * Evalúa una expresión aritmética simple.
 *
 * LANZA una excepción si la expresión es inválida. Eso es a propósito:
 * en el Paso 3 vamos a usar ese error para forzar una rama del grafo.
 *
 * No es "production-ready": usa `new Function` detrás de un whitelist de
 * caracteres. Suficiente para un PoC, no para input de usuarios reales.
 */
export function calculate(expression: string): number {
  // Whitelist: sólo dígitos, punto, espacios, paréntesis y + - * / %
  if (!/^[\d\s.+\-*/%()]+$/.test(expression)) {
    throw new Error(
      `Expresión inválida: "${expression}". Sólo se permiten números y los operadores + - * / % ( ).`
    );
  }

  let result: unknown;
  try {
    result = new Function(`"use strict"; return (${expression});`)();
  } catch {
    throw new Error(`No se pudo parsear la expresión: "${expression}".`);
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(
      `La expresión "${expression}" no produjo un número finito (dio: ${String(result)}).`
    );
  }

  return result;
}
