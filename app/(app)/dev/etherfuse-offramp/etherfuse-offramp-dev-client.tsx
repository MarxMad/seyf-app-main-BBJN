'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import {
  OfframpOrderCreatedCard,
  OrderTransactionDetailCard,
  pickQuoteId,
} from '@/components/app/dev/etherfuse-order-cards'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EtherfuseRampWalletBanner } from '@/components/app/dev/etherfuse-ramp-wallet-banner'
import { extractOrderIdFromCreateOrderResponse } from '@/lib/etherfuse/order-create-response'
import { pickRampOrderTransactionDetails } from '@/lib/etherfuse/orders-api'

export default function EtherfuseOfframpDevClient() {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [assetsJson, setAssetsJson] = useState<string>('')
  const [sourceAmountTokens, setSourceAmountTokens] = useState('10')
  const [sourceAssetOverride, setSourceAssetOverride] = useState('')
  const [quoteJson, setQuoteJson] = useState<string>('')
  const [orderJson, setOrderJson] = useState<string>('')
  const [useAnchor, setUseAnchor] = useState(false)
  const [trackJson, setTrackJson] = useState<string>('')

  const run = useCallback(async (label: string, fn: () => Promise<void>) => {
    setErr(null)
    setBusy(label)
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }, [])

  const loadAssets = () =>
    run('assets', async () => {
      const res = await fetch('/api/seyf/etherfuse/assets')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : res.statusText)
      }
      setAssetsJson(JSON.stringify(data, null, 2))
      setQuoteJson('')
      setOrderJson('')
      setTrackJson('')
    })

  const quote = () =>
    run('quote', async () => {
      const body: { sourceAmount: string; sourceAsset?: string } = {
        sourceAmount: sourceAmountTokens.trim().replace(',', '.') || '1',
      }
      const t = sourceAssetOverride.trim()
      if (t) body.sourceAsset = t
      const res = await fetch('/api/seyf/etherfuse/quote/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : `${res.status} ${res.statusText}${Object.keys(data).length ? ` — ${JSON.stringify(data)}` : ''}`
        throw new Error(msg)
      }
      setQuoteJson(JSON.stringify(data, null, 2))
      setOrderJson('')
      setTrackJson('')
    })

  const createOrder = () =>
    run('order', async () => {
      let parsed: unknown
      try {
        parsed = JSON.parse(quoteJson || '{}')
      } catch {
        throw new Error('Primero cotiza offramp y deja un quote JSON válido')
      }
      const inner =
        parsed && typeof parsed === 'object' && 'quote' in (parsed as object)
          ? (parsed as { quote: unknown }).quote
          : parsed
      const quoteId = pickQuoteId(inner)
      if (!quoteId) {
        throw new Error('No encuentro quoteId en la cotización (~2 min de validez)')
      }
      const res = await fetch('/api/seyf/etherfuse/order/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, useAnchor }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : res.statusText)
      }
      setOrderJson(JSON.stringify(data, null, 2))
      setTrackJson('')
    })

  const trackOrder = () =>
    run('track', async () => {
      let parsed: unknown
      try {
        parsed = JSON.parse(orderJson || '{}')
      } catch {
        throw new Error('Primero crea una orden offramp con JSON válido')
      }
      const orderId = extractOrderIdFromCreateOrderResponse(parsed)
      if (!orderId) {
        throw new Error('No encuentro orderId en la respuesta de orden')
      }

      let orderPolled: unknown = null
      let pollAttempts = 0
      for (let i = 0; i < 12; i++) {
        pollAttempts = i + 1
        if (i > 0) await new Promise((r) => setTimeout(r, 1500))
        const gr = await fetch(
          `/api/seyf/etherfuse/prueba/order/${encodeURIComponent(orderId)}`,
        )
        if (!gr.ok) continue
        const gj = (await gr.json().catch(() => ({}))) as { order?: unknown }
        orderPolled = gj.order ?? null
        const det = pickRampOrderTransactionDetails(orderPolled)
        const st = (det.status ?? '').toLowerCase()
        if (
          (det.confirmedTxSignature && det.confirmedTxSignature.length > 0) ||
          st === 'completed' ||
          st === 'funded' ||
          st === 'failed' ||
          st === 'canceled'
        ) {
          break
        }
      }

      setTrackJson(
        JSON.stringify(
          {
            orderPolled,
            orderDisplay: pickRampOrderTransactionDetails(orderPolled),
            pollAttempts,
            offrampTrack: true,
          },
          null,
          2,
        ),
      )
    })

  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <EtherfuseRampWalletBanner variant="violet" />

      <div className="mb-6 rounded-[1.25rem] border border-dashed border-violet-500/30 bg-violet-500/[0.06] p-4">
        <p className="text-xs font-bold text-violet-200/90">Solo desarrollo — offramp</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Venta de crypto (p. ej. CETES) → MXN. Requiere saldo en testnet y KYC/cuenta como en{' '}
          <Link href="/dev/etherfuse-ramp" className="font-semibold text-foreground underline-offset-2 hover:underline">
            onramp
          </Link>
          . Tras crear la orden debes firmar el <span className="font-mono">burnTransaction</span> (o pago
          anchor si aplica) — no hay paso <span className="font-mono">fiat_received</span>. Guía:{' '}
          <a
            href="https://docs.etherfuse.com/guides/testing-offramps"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-300 underline underline-offset-2 hover:text-violet-200"
          >
            Test offramps
          </a>
          .
        </p>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-foreground">
        Rampa offramp Etherfuse (prueba)
      </h1>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">1. Activos rampables</p>
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => void loadAssets()}
            className="mt-3 w-full rounded-full border-border font-semibold"
          >
            {busy === 'assets' ? 'Cargando…' : 'GET assets'}
          </Button>
        </div>

        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            2. Cotización offramp (monto en tokens a vender)
          </p>
          <Input
            value={sourceAmountTokens}
            onChange={(e) => setSourceAmountTokens(e.target.value)}
            placeholder="Cantidad en activo fuente (ej. 10)"
            className="h-12 rounded-full border-border bg-background/60 px-4 text-sm"
          />
          <Input
            value={sourceAssetOverride}
            onChange={(e) => setSourceAssetOverride(e.target.value)}
            placeholder="sourceAsset opcional (CODE:ISSUER)"
            className="h-12 rounded-full border-border bg-background/60 px-4 font-mono text-xs"
          />
          <Button
            type="button"
            disabled={!!busy}
            onClick={() => void quote()}
            className="h-12 w-full rounded-full bg-violet-600 font-bold text-white hover:bg-violet-700"
          >
            {busy === 'quote' ? 'Cotizando…' : 'POST quote offramp'}
          </Button>
        </div>

        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">3. Orden offramp</p>
          <div className="flex items-start gap-3 rounded-[1rem] border border-border/60 bg-background/40 px-3 py-2">
            <Checkbox
              id="use-anchor"
              checked={useAnchor}
              onCheckedChange={(v) => setUseAnchor(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="use-anchor" className="cursor-pointer text-xs leading-relaxed font-normal text-muted-foreground">
              Stellar: <span className="font-mono">useAnchor</span> (pago + memo en lugar de burn prearmado).{' '}
              <a
                href="https://docs.etherfuse.com/guides/testing-offramps#anchor-mode-stellar-only"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 underline"
              >
                Anchor mode
              </a>
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => void createOrder()}
            className="h-12 w-full rounded-full border-border font-semibold"
          >
            {busy === 'order' ? 'Creando…' : 'POST order offramp'}
          </Button>
        </div>

        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            4. Seguimiento (GET orden tras firmar on-chain)
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Primero firma la transacción desde la <span className="font-mono">statusPage</span> o tu wallet.
            Luego pulsa para leer el estado por API.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => void trackOrder()}
            className="h-12 w-full rounded-full border-border font-semibold"
          >
            {busy === 'track' ? 'Consultando…' : 'GET /ramp/order (polling)'}
          </Button>
        </div>
      </div>

      {err && (
        <p className="mt-6 rounded-[1rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {assetsJson && (
          <pre className="max-h-48 overflow-auto rounded-[1rem] border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-foreground">
            {assetsJson}
          </pre>
        )}
        {quoteJson && (
          <pre className="max-h-64 overflow-auto rounded-[1rem] border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-foreground">
            {quoteJson}
          </pre>
        )}
        {orderJson && (
          <div className="space-y-3">
            <OfframpOrderCreatedCard orderApiJson={orderJson} />
            <pre className="max-h-64 overflow-auto rounded-[1rem] border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-foreground">
              {orderJson}
            </pre>
          </div>
        )}
        {trackJson && (
          <div className="space-y-3">
            <OrderTransactionDetailCard payloadJson={trackJson} />
            <pre className="max-h-64 overflow-auto rounded-[1rem] border border-violet-500/20 bg-violet-500/[0.06] p-3 text-[11px] leading-relaxed text-foreground">
              {trackJson}
            </pre>
          </div>
        )}
      </div>
    </AppPageBody>
  )
}
