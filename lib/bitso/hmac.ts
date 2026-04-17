import { createHmac } from "crypto";

/**
 * Construye el header Authorization para la API de Juno/Bitso.
 *
 * Algoritmo: HMAC-SHA256 sobre `${nonce}${method}${path}${body}`
 * Formato:   `Bitso <apiKey>:<nonce>:<signature>`
 *
 * IMPORTANTE: usar solo en código servidor (API Routes, Server Actions).
 * Nunca llamar desde componentes de cliente ni pasar el resultado al cliente.
 */
export function buildJunoAuthHeader(
  apiKey: string,
  apiSecret: string,
  method: "GET" | "POST",
  path: string,
  body = "",
): string {
  const nonce = Date.now().toString();
  const data = `${nonce}${method}${path}${body}`;
  const signature = createHmac("sha256", apiSecret).update(data).digest("hex");
  return `Bitso ${apiKey}:${nonce}:${signature}`;
}
