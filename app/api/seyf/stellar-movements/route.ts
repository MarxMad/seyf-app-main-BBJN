import { NextResponse } from 'next/server'
import { fetchChainMovements, horizonNetworkFromEnv } from '@/lib/seyf/horizon-payments'
import { chainMovementToUserMovement } from '@/lib/seyf/stellar-chain-to-user-movement'
import type { UserMovement } from '@/lib/seyf/user-movements-types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Cuenta pública Stellar (56 chars, base32). */
function looksLikeStellarAccount(s: string): boolean {
  return s.length === 56 && s.startsWith('G')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const account = (searchParams.get('account') ?? '').trim()
  if (!account) {
    return NextResponse.json({ error: 'Falta account' }, { status: 400 })
  }
  if (!looksLikeStellarAccount(account)) {
    return NextResponse.json({ error: 'Cuenta Stellar inválida' }, { status: 400 })
  }

  try {
    const { movements } = await fetchChainMovements(account, horizonNetworkFromEnv(), {
      limit: 40,
    })
    const out: UserMovement[] = movements.map(chainMovementToUserMovement)
    return NextResponse.json(out, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Horizon error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
