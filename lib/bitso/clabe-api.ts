import { getJunoConfig } from "./config";
import { buildJunoAuthHeader } from "./hmac";
import type { CLABEDetails, JunoApiResponse } from "./types";

const TIMEOUT_MS = 30_000;

/** Extrae un mensaje de error legible desde la respuesta de Juno. */
function extractJunoError(json: unknown, fallback: string): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  }
  return fallback;
}

/**
 * Lista las CLABEs de tipo AUTO_PAYMENT asociadas a la cuenta Juno.
 *
 * Endpoint: GET /spei/v1/clabes?clabe_type=AUTO_PAYMENT
 */
export async function getAccountDetails(): Promise<CLABEDetails[]> {
  const { apiKey, apiSecret, baseUrl } = getJunoConfig();

  const path = "/spei/v1/clabes?clabe_type=AUTO_PAYMENT";
  const authHeader = buildJunoAuthHeader(apiKey, apiSecret, "GET", path);

  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();
  let json: JunoApiResponse<{ response: CLABEDetails[] }> | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    // respuesta no JSON
  }

  if (!res.ok) {
    throw new Error(
      `Juno getAccountDetails falló (${res.status}): ${extractJunoError(json, text.slice(0, 400))}`,
    );
  }

  return (json?.payload as { response?: CLABEDetails[] } | undefined)?.response ?? [];
}

/**
 * Crea una nueva CLABE para la cuenta Juno.
 *
 * Endpoint: POST /mint_platform/v1/clabes  (body: {})
 */
export async function createClabe(): Promise<CLABEDetails> {
  const { apiKey, apiSecret, baseUrl } = getJunoConfig();

  const path = "/mint_platform/v1/clabes";
  const bodyStr = "{}";
  const authHeader = buildJunoAuthHeader(apiKey, apiSecret, "POST", path, bodyStr);

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: bodyStr,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();
  let json: JunoApiResponse<CLABEDetails> | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    // respuesta no JSON
  }

  if (!res.ok) {
    throw new Error(
      `Juno createClabe falló (${res.status}): ${extractJunoError(json, text.slice(0, 400))}`,
    );
  }

  const payload = (json?.payload ?? json) as CLABEDetails | undefined;
  if (!payload?.clabe) {
    throw new Error("Juno createClabe: respuesta sin campo 'clabe'");
  }
  return payload;
}
