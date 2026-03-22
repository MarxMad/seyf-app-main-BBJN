'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type RampContextPayload = {
  publicKey: string
  customerId: string
  bankAccountId: string
  source: 'cookie' | 'mvp_env'
  cryptoWalletId: string | null
  cryptoWalletResolved: boolean
  cryptoWalletError: string | null
}

/**
 * Muestra qué wallet Stellar usa la API Seyf para rampa y si hay `cryptoWalletId` en Etherfuse.
 * El portal devnet pide «conectar wallet» para firmar: debe ser la misma clave que aquí.
 */
export function EtherfuseRampWalletBanner({
  variant = 'amber',
}: {
  variant?: 'amber' | 'violet'
}) {
  const [data, setData] = useState<RampContextPayload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/seyf/etherfuse/ramp-context')
      .then(async (r) => {
        const j = (await r.json()) as { error?: string } & Partial<RampContextPayload>
        if (!r.ok) {
          throw new Error(typeof j.error === 'string' ? j.error : r.statusText)
        }
        if (!cancelled) setData(j as RampContextPayload)
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const border =
    variant === 'violet'
      ? 'border-violet-500/30 bg-violet-500/[0.06]'
      : 'border-amber-500/30 bg-amber-500/[0.06]'
  const title =
    variant === 'violet' ? 'text-violet-200/90' : 'text-amber-200/90'

  if (loading) {
    return (
      <div className={`mb-6 rounded-[1.25rem] border border-dashed ${border} p-4`}>
        <p className={`text-xs font-bold ${title}`}>Wallet rampa</p>
        <p className="mt-2 text-xs text-muted-foreground">Cargando contexto…</p>
      </div>
    )
  }

  if (err) {
    return (
      <div className={`mb-6 rounded-[1.25rem] border border-dashed ${border} p-4`}>
        <p className={`text-xs font-bold ${title}`}>Wallet rampa</p>
        <p className="mt-2 text-xs text-destructive">{err}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Configura la sesión en{' '}
          <Link href="/identidad" className="font-semibold text-foreground underline-offset-2 hover:underline">
            /identidad
          </Link>{' '}
          o variables <span className="font-mono">ETHERFUSE_MVP_*</span> en desarrollo.
        </p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`mb-6 rounded-[1.25rem] border border-dashed ${border} p-4 space-y-2`}>
      <p className={`text-xs font-bold ${title}`}>Wallet vinculada a esta sesión (API Seyf)</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Esta app no usa el conector de wallet del navegador (Freighter, etc.). La rampa queda ligada a la
        clave pública Stellar que guardaste en{' '}
        <Link href="/identidad" className="font-semibold text-foreground underline-offset-2 hover:underline">
          /identidad
        </Link>{' '}
        (cookie) o, sin cookie, a la wallet MVP del <span className="font-mono">.env</span>. En{' '}
        <a
          href="https://devnet.etherfuse.com/ramp"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          devnet Etherfuse
        </a>{' '}
        debes conectar la misma cuenta para firmar
        burns u operaciones; si conectas otra wallet, la orden no coincidirá.
      </p>
      <div className="rounded-[0.75rem] border border-border/60 bg-background/50 px-3 py-2 text-[11px] leading-relaxed">
        <p>
          <span className="text-muted-foreground">Origen:</span>{' '}
          <span className="font-mono text-foreground">
            {data.source === 'cookie' ? 'cookie /identidad' : 'ETHERFUSE_MVP_* (dev)'}
          </span>
        </p>
        <p className="mt-1 break-all">
          <span className="text-muted-foreground">publicKey:</span>{' '}
          <span className="font-mono text-foreground">{data.publicKey}</span>
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">cryptoWalletId (POST /ramp/order):</span>{' '}
          {data.cryptoWalletResolved && data.cryptoWalletId ? (
            <span className="font-mono text-emerald-600">{data.cryptoWalletId}</span>
          ) : (
            <span className="text-amber-600">
              no resuelto — la API usará solo publicKey; puede fallar con «Proxy account».{' '}
              {data.cryptoWalletError ? (
                <span className="block mt-1 text-[10px] opacity-90">{data.cryptoWalletError}</span>
              ) : null}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
