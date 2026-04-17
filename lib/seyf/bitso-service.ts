import type { CLABEDetails } from "@/lib/bitso/types";
import { formatCLABE, validateCLABE } from "@/lib/bitso/types";
import type { ClabeRecord } from "@/lib/bitso/clabe-store";

export type { CLABEDetails, ClabeRecord };
export { formatCLABE, validateCLABE };

/**
 * Busca en KV la CLABE guardada para este stellarAddress.
 * Retorna null si el usuario aún no tiene ninguna.
 */
export async function getMyClabe(stellarAddress: string): Promise<ClabeRecord | null> {
  const res = await fetch(
    `/api/seyf/bitso/my-clabe?wallet=${encodeURIComponent(stellarAddress)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Error ${res.status} buscando CLABE`);
  }
  const { payload } = await res.json();
  return (payload as ClabeRecord) ?? null;
}

/**
 * Crea una nueva CLABE en Juno, guarda el mapeo en KV y la retorna.
 * Requiere el stellarAddress del usuario para el mapeo wallet ↔ CLABE.
 */
export async function createUserClabe(stellarAddress: string): Promise<ClabeRecord> {
  const res = await fetch("/api/seyf/bitso/create-clabe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stellarAddress }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Error ${res.status} creando CLABE`);
  }
  const { payload } = await res.json();
  return payload as ClabeRecord;
}

/**
 * Devuelve la CLABE del usuario desde KV.
 * Si no tiene ninguna, crea una nueva en Juno y la guarda.
 */
export async function getOrCreateClabe(stellarAddress: string): Promise<ClabeRecord> {
  const existing = await getMyClabe(stellarAddress);
  if (existing) return existing;
  return createUserClabe(stellarAddress);
}
