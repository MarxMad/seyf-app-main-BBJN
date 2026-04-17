/**
 * clabe-store.ts
 *
 * Capa de persistencia para el mapeo bidireccional entre wallets Stellar (Pollar)
 * y CLABEs Juno. Usa Vercel KV (Redis) como store.
 *
 * Esquema de claves:
 *   clabe:wallet:{stellarAddress}  →  CLABERecord  (dado un usuario, dame su CLABE)
 *   clabe:reverse:{clabe18digits}  →  string        (dado una CLABE, dame el stellarAddress)
 *
 * El índice inverso (clabe:reverse:*) es el que permite procesar webhooks de Juno:
 * cuando llega un depósito SPEI, Juno nos da la CLABE destino y podemos identificar
 * qué wallet acreditar.
 */

import { Redis } from '@upstash/redis'
import type { CLABEDetails } from './types'

const redis = Redis.fromEnv()

// ─── tipos ────────────────────────────────────────────────────────────────────

export type ClabeRecord = CLABEDetails & {
  /** Dirección Stellar (Pollar) del dueño de esta CLABE. */
  stellarAddress: string
  /** ISO 8601 del momento en que se guardó el mapeo. */
  savedAt: string
}

// ─── claves KV ───────────────────────────────────────────────────────────────

const walletKey = (stellarAddress: string) => `clabe:wallet:${stellarAddress}`
const reverseKey = (clabe: string) => `clabe:reverse:${clabe}`

// ─── lecturas ─────────────────────────────────────────────────────────────────

/**
 * Dado un stellarAddress, retorna la CLABE guardada o null si no tiene ninguna.
 */
export async function getClabeForWallet(
  stellarAddress: string,
): Promise<ClabeRecord | null> {
  if (!stellarAddress) return null
  return redis.get<ClabeRecord>(walletKey(stellarAddress))
}

/**
 * Dado el número de CLABE (18 dígitos), retorna el stellarAddress asociado o null.
 * Se usa en webhooks de Juno para identificar a qué wallet acreditar.
 */
export async function getWalletForClabe(clabe: string): Promise<string | null> {
  if (!clabe) return null
  return redis.get<string>(reverseKey(clabe))
}

// ─── escritura ────────────────────────────────────────────────────────────────

/**
 * Guarda el mapeo bidireccional wallet ↔ CLABE.
 * Si el usuario ya tenía una CLABE anterior, el índice inverso de la vieja
 * se deja como estaba (las CLABEs no se reutilizan).
 */
export async function saveClabeMapping(
  stellarAddress: string,
  clabe: CLABEDetails,
): Promise<ClabeRecord> {
  const record: ClabeRecord = {
    ...clabe,
    stellarAddress,
    savedAt: new Date().toISOString(),
  }

  await Promise.all([
    // wallet → CLABE
    redis.set(walletKey(stellarAddress), record),
    // CLABE → wallet  (para webhooks)
    redis.set(reverseKey(clabe.clabe), stellarAddress),
  ])

  return record
}

/**
 * Elimina el mapeo para una wallet (ej. si el usuario quiere resetear).
 * No borra el índice inverso para mantener trazabilidad histórica.
 */
export async function deleteClabeMapping(stellarAddress: string): Promise<void> {
  await redis.del(walletKey(stellarAddress))
}
