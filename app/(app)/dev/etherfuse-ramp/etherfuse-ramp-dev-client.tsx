'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { OrderTransactionDetailCard, pickQuoteId } from '@/components/app/dev/etherfuse-order-cards'
import { SpeiPaymentCard } from '@/components/app/dev/spei-payment-card'
import { cn } from '@/lib/utils'
import { extractOrderIdFromCreateOrderResponse } from '@/lib/etherfuse/order-create-response'
import {
  speiDetailsFromOnrampOrderApiJson,
  type SpeiTransferDetails,
} from '@/lib/etherfuse/spei-transfer-details'
import {
  extractConfirmedTxSignatureFromOnrampPanelJson,
  pickRampOrderTransactionDetails,
} from '@/lib/etherfuse/orders-api'
import { useEffect } from 'react'

type RampContextPayload = {
  kycApproved: boolean
  kycStatus: string | null
  kycReason: string | null
}

type ReadinessPayload = {
  onrampEnabled: boolean
  reasons: string[]
}

export default function EtherfuseRampDevClient() {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [targetOverride, setTargetOverride] = useState('')
  const [sourceAmount, setSourceAmount] = useState('500')
  const [orderJson, setOrderJson] = useState<string>('')
  const [fiatJson, setFiatJson] = useState<string>('')
  const [speiDetails, setSpeiDetails] = useState<SpeiTransferDetails | null>(null)
  const [pendingManualOrderJson, setPendingManualOrderJson] = useState<string | null>(null)
  const [kycGate, setKycGate] = useState<RampContextPayload | null>(null)
  const [kycLoading, setKycLoading] = useState(true)
  const [readiness, setReadiness] = useState<ReadinessPayload | null>(null)

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

  useEffect(() => {
    let cancelled = false
    setKycLoading(true)
    fetch('/api/seyf/etherfuse/ramp-context')
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as Partial<RampContextPayload> & { error?: string }
        if (!r.ok) {
          throw new Error(typeof j.error === 'string' ? j.error : `HTTP ${r.status}`)
        }
        if (cancelled) return
        setKycGate({
          kycApproved: j.kycApproved === true,
          kycStatus: typeof j.kycStatus === 'string' ? j.kycStatus : null,
          kycReason: typeof j.kycReason === 'string' ? j.kycReason : null,
        })
      })
      .catch((e) => {
        if (cancelled) return
        setKycGate({
          kycApproved: false,
          kycStatus: null,
          kycReason: e instanceof Error ? e.message : 'No pudimos validar tu estado KYC.',
        })
      })
      .finally(() => {
        if (!cancelled) setKycLoading(false)
      })
    fetch('/api/seyf/etherfuse/readiness')
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as Partial<ReadinessPayload> & { error?: string }
        if (!r.ok) {
          throw new Error(typeof j.error === 'string' ? j.error : `HTTP ${r.status}`)
        }
        if (cancelled) return
        setReadiness({
          onrampEnabled: j.onrampEnabled === true,
          reasons: Array.isArray(j.reasons) ? j.reasons.filter((x): x is string => typeof x === 'string') : [],
        })
      })
      .catch((e) => {
        if (cancelled) return
        setReadiness({
          onrampEnabled: false,
          reasons: [e instanceof Error ? e.message : 'No pudimos calcular readiness.'],
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const performQuote = useCallback(async (): Promise<string> => {
    const body: { sourceAmount: string; targetAsset?: string } = {
      sourceAmount: sourceAmount.trim() || '500',
    }
    const t = targetOverride.trim()
    if (t) body.targetAsset = t
    const res = await fetch('/api/seyf/etherfuse/quote/onramp', {
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
    return JSON.stringify(data, null, 2)
  }, [sourceAmount, targetOverride])

  const performOrder = useCallback(async (qJson: string): Promise<string> => {
    let parsed: unknown
    try {
      parsed = JSON.parse(qJson || '{}')
    } catch {
      throw new Error('Cotización JSON inválida')
    }
    const inner =
      parsed && typeof parsed === 'object' && 'quote' in (parsed as object)
        ? (parsed as { quote: unknown }).quote
        : parsed
    const quoteId = pickQuoteId(inner)
    if (!quoteId) {
      throw new Error('No encuentro quoteId en la cotización (~2 min de validez)')
    }
    const res = await fetch('/api/seyf/etherfuse/order/onramp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : res.statusText)
    }
    return JSON.stringify(data, null, 2)
  }, [])

  const performFiatSimulation = useCallback(async (oJson: string): Promise<string> => {
    let parsed: unknown
    try {
      parsed = JSON.parse(oJson || '{}')
    } catch {
      throw new Error('Respuesta de orden JSON inválida')
    }
    const orderId = extractOrderIdFromCreateOrderResponse(parsed)
    if (!orderId) {
      throw new Error(
        'No encuentro orderId (revisa raíz o onramp/on_ramp en el JSON de la orden).',
      )
    }
    const res = await fetch('/api/seyf/etherfuse/sandbox/fiat-received', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : res.statusText)
    }

    let orderPolled: unknown = null
    let pollAttempts = 0
    for (let i = 0; i < 12; i++) {
      pollAttempts = i + 1
      if (i > 0) await new Promise((r) => setTimeout(r, 1500))
      const gr = await fetch(`/api/seyf/etherfuse/prueba/order/${encodeURIComponent(orderId)}`)
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

    return JSON.stringify(
      {
        sandboxFiatReceived: data,
        orderPolled,
        orderDisplay: pickRampOrderTransactionDetails(orderPolled),
        pollAttempts,
      },
      null,
      2,
    )
  }, [])

  const openManualSpeiReview = () =>
    run('spei-manual-prepare', async () => {
      const q = await performQuote()
      const o = await performOrder(q)
      const assetLabel =
        targetOverride.trim()
          ? targetOverride.trim().split(':')[0]?.trim() || 'CETES'
          : 'CETES'
      const details = speiDetailsFromOnrampOrderApiJson(o, assetLabel, 'Etherfuse')
      if (!details) {
        throw new Error(
          'No aparecen datos de transferencia (CLABE e importe). Revisa la respuesta o inténtalo de nuevo.',
        )
      }
      setOrderJson(o)
      setFiatJson('')
      setPendingManualOrderJson(o)
      setSpeiDetails(details)
    })

  const confirmSpeiPayment = useCallback(async () => {
    if (!speiDetails || !pendingManualOrderJson) return
    await run('spei-manual-confirm', async () => {
      const f = await performFiatSimulation(pendingManualOrderJson)
      setOrderJson(pendingManualOrderJson)
      setFiatJson(f)
      setPendingManualOrderJson(null)
      setSpeiDetails(null)
    })
  }, [speiDetails, pendingManualOrderJson, performFiatSimulation, run])

  const speiConfirmBusy = busy === 'spei-manual-confirm'
  const canOperate = (readiness?.onrampEnabled === true) || (!kycLoading && kycGate?.kycApproved === true)

  const onrampTxSignature = useMemo(
    () => extractConfirmedTxSignatureFromOnrampPanelJson(fiatJson),
    [fiatJson],
  )

  const stellarTxExplorerUrl = useMemo(() => {
    if (!onrampTxSignature) return null
    const isMain =
      typeof process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'string' &&
      ['public', 'mainnet'].includes(
        process.env.NEXT_PUBLIC_STELLAR_NETWORK.toLowerCase(),
      )
    const base = isMain
      ? 'https://stellar.expert/explorer/public/tx/'
      : 'https://stellar.expert/explorer/testnet/tx/'
    return `${base}${encodeURIComponent(onrampTxSignature)}`
  }, [onrampTxSignature])

  const timeline = useMemo(() => {
    const generated = Boolean(speiDetails)
    const transferConfirmed = Boolean(fiatJson)
    const accredited = Boolean(onrampTxSignature)
    return [
      { label: 'Datos SPEI generados', done: generated },
      { label: 'Transferencia detectada', done: transferConfirmed },
      { label: 'Conversión y acreditación', done: accredited },
    ]
  }, [speiDetails, fiatJson, onrampTxSignature])

  return (
    <AppPageBody className="space-y-6 pt-4">
      <AppBackLink href="/dashboard" />

      <section className="glass-mint-card p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#9ec7b3]/25 blur-3xl dark:bg-[#6ba690]/25" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[#b8b8b5]/20 blur-3xl dark:bg-[#22433c]/40" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex rounded-full border border-[#b8b8b5]/60 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f7168] dark:border-white/20 dark:bg-white/15 dark:text-[#d2e9df]">
            Depósito SPEI
            </p>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#41534b] dark:text-white">Añadir fondos</h1>
          <p className="mt-1.5 text-sm text-[#7b8f86] dark:text-[#d2e9df]">
            Genera tu CLABE y realiza la transferencia desde tu banca móvil.
          </p>
        </div>
      </section>

      <SpeiPaymentCard
        details={speiDetails}
        concept={speiDetails?.orderId ?? null}
      />
      <section className="rounded-[1.25rem] border border-border bg-card/60 p-4">
        <p className="text-sm font-bold text-foreground">Estado del depósito</p>
        <div className="mt-3 space-y-2">
          {timeline.map((step) => (
            <div key={step.label} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
              <span className="text-sm text-foreground">{step.label}</span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  step.done ? 'text-emerald-500' : 'text-muted-foreground',
                )}
              >
                {step.done ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      </section>
      {!canOperate ? (
        <section className="rounded-[1.25rem] border border-amber-500/30 bg-amber-500/[0.08] p-4">
          <p className="text-sm font-bold text-foreground">Verificación requerida</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {kycLoading
              ? 'Validando estado KYC...'
              : kycGate?.kycReason ??
                'Necesitas aprobar KYC para generar CLABE y recibir tus datos de deposito.'}
          </p>
          {readiness?.reasons?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {readiness.reasons.slice(0, 3).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
          <Link href="/identidad" className="mt-3 inline-block text-sm font-semibold text-foreground underline">
            Ir a verificar identidad
          </Link>
        </section>
      ) : null}
      {speiDetails && pendingManualOrderJson ? (
        <Button
          type="button"
          className="w-full"
          disabled={!!busy || !canOperate}
          onClick={() => void confirmSpeiPayment()}
        >
          {speiConfirmBusy ? (
            <>
              <Spinner className="size-4 text-background" />
              Procesando…
            </>
          ) : (
            'Ya hice la transferencia'
          )}
        </Button>
      ) : null}

      <section className="space-y-4 rounded-[1.5rem] border border-border bg-card/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <h2 className="text-sm font-bold text-foreground">Monto en pesos</h2>
        <Input
          id="manual-amount"
          inputMode="decimal"
          value={sourceAmount}
          onChange={(e) => setSourceAmount(e.target.value)}
          placeholder="Monto MXN"
          className="h-12 rounded-xl border-border bg-background px-4 tabular-nums"
          aria-label="Monto MXN"
        />
        <Input
          id="manual-asset"
          value={targetOverride}
          onChange={(e) => setTargetOverride(e.target.value)}
          placeholder="Referencia opcional"
          className="h-12 rounded-xl border-border bg-background px-4 font-mono text-xs"
          aria-label="Referencia opcional"
        />
        <Button
          type="button"
          className="w-full rounded-full bg-foreground text-background"
          disabled={!!busy || !canOperate}
          onClick={() => void openManualSpeiReview()}
        >
          {busy === 'spei-manual-prepare' ? (
            <>
              <Spinner className="size-4 text-background" />
              Cargando…
            </>
          ) : (
            'Generar datos de depósito'
          )}
        </Button>
      </section>

      {err && (
        <p className="mt-6 rounded-[1rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </p>
      )}

      {onrampTxSignature && stellarTxExplorerUrl ? (
        <div className="rounded-[1.5rem] border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">Comprobante de acreditación</p>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{onrampTxSignature}</p>
          <a
            href={stellarTxExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-foreground underline-offset-2 hover:underline"
          >
            Ver comprobante
          </a>
        </div>
      ) : null}

      {fiatJson ? (
        <div className="space-y-4">
          <OrderTransactionDetailCard payloadJson={fiatJson} />
        </div>
      ) : null}
    </AppPageBody>
  )
}
