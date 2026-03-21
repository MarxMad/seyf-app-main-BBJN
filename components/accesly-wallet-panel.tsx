'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectButton, useAccesly } from 'accesly'
import { Button } from '@/components/ui/button'

function maskAddress(value?: string | null) {
  if (!value) return '-'
  if (value.length < 12) return value
  return `${value.slice(0, 6)}...${value.slice(-6)}`
}

export default function AcceslyWalletPanel() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const {
    wallet,
    balance,
    assetBalances,
    loading,
    creating,
    error,
    disconnect,
    refreshBalance,
    refreshWallet,
  } = useAccesly()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading || creating) return
    const addr = wallet?.stellarAddress
    if (typeof addr === 'string' && addr.length > 0) {
      router.replace('/dashboard')
    }
  }, [mounted, loading, creating, wallet?.stellarAddress, router])

  const mxneAssets = useMemo(() => {
    if (!assetBalances) return []
    return assetBalances.filter((asset: { code?: string; assetCode?: string }) => {
      const code = (asset.code ?? asset.assetCode ?? '').toUpperCase()
      return code === 'MXNE'
    })
  }, [assetBalances])

  return (
    <section className="min-h-screen w-full bg-background px-6 py-20">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Acceso con Accesly</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Verificacion de wallet custodial para XLM, MXNe y firma XDR (flujo Etherfuse/CETES).
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <ConnectButton />

          {!mounted || loading ? (
            <p className="text-sm text-muted-foreground">Cargando estado de wallet...</p>
          ) : null}

          {creating ? (
            <p className="text-sm text-muted-foreground">Creando wallet embedded...</p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {wallet ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Stellar Address</p>
                <p className="mt-1 text-base font-bold text-foreground">{maskAddress(wallet.stellarAddress)}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Balance XLM</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{balance ?? '-'} XLM</p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Balance MXNe (detected)</p>
                  <p className="mt-1 text-2xl font-black text-foreground">
                    {mxneAssets.length > 0 ? mxneAssets[0].balance : '-'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => refreshWallet()} className="rounded-full">
                  Refresh wallet
                </Button>
                <Button onClick={() => refreshBalance()} variant="outline" className="rounded-full">
                  Refresh balances
                </Button>
                <Button onClick={() => disconnect()} variant="outline" className="rounded-full">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Conecta para validar direccion Stellar, XLM y assets (ej. MXNe).
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border p-5 text-sm text-muted-foreground space-y-2">
          <p className="font-bold text-foreground">Checklist tecnico para tu uso</p>
          <p>1) XLM: usa `balance` y `sendPayment` para fondeo/comisiones.</p>
          <p>2) MXNe: detecta asset code `MXNE` en `assetBalances` antes de flujo de inversión.</p>
          <p>3) Etherfuse/CETES: construye TX con Stellar SDK, firma con `signTransaction` o `signAndSubmit`.</p>
          <p>4) Restricciones Accesly: source account debe ser `wallet.stellarAddress`; sin `accountMerge`, sin `FeeBump`.</p>
        </div>
      </div>
    </section>
  )
}
