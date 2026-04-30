'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FxResponse = {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

function formatMxnPerUnit(mxnPerUnit: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(mxnPerUnit)
}

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [mxnPerUsd, setMxnPerUsd] = useState<number | null>(null)
  const [mxnPerEur, setMxnPerEur] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        '/api/seyf/fx/frankfurter-latest?from=MXN&to=USD,EUR',
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as FxResponse
      const usd = data.rates.USD
      const eur = data.rates.EUR
      if (typeof usd !== 'number' || typeof eur !== 'number' || usd <= 0 || eur <= 0) {
        throw new Error('Respuesta sin tasas válidas')
      }
      setDate(data.date)
      setMxnPerUsd(1 / usd)
      setMxnPerEur(1 / eur)
    } catch {
      setError('No se pudo cargar el tipo de cambio. Revisa tu conexión e intenta de nuevo.')
      setMxnPerUsd(null)
      setMxnPerEur(null)
      setDate(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AppPageBody className="space-y-6 pt-2">
      <AppBackLink href="/dashboard" />

      <section className="glass-mint-card p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#9ec7b3]/25 blur-3xl dark:bg-[#6ba690]/25" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-[#b8b8b5]/20 blur-3xl dark:bg-[#22433c]/40" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex rounded-full border border-[#b8b8b5]/60 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f7168] dark:border-white/20 dark:bg-white/15 dark:text-[#d2e9df]">
            Mercados
            </p>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#41534b] dark:text-white">Estadísticas</h1>
          <p className="mt-1.5 text-sm text-[#7b8f86] dark:text-[#d2e9df]">
            Referencia de tipo de cambio (EUR central, datos públicos Frankfurter).
          </p>
          {date ? (
            <p className="mt-2 text-[11px] text-[#91a69d] dark:text-[#b9d9cc]">Cierre: {date}</p>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-border"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        <FxCard
          flag="🇺🇸"
          code="USD"
          name="Dólar estadounidense"
          loading={loading}
          value={mxnPerUsd}
          formatMxnPerUnit={formatMxnPerUnit}
        />
        <FxCard
          flag="🇪🇺"
          code="EUR"
          name="Euro"
          loading={loading}
          value={mxnPerEur}
          formatMxnPerUnit={formatMxnPerUnit}
        />
      </div>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Solo referencia informativa; no es oferta de compra/venta. Para operaciones usa la cotización de tu proveedor.
      </p>
    </AppPageBody>
  )
}

function FxCard({
  flag,
  code,
  name,
  loading,
  value,
  formatMxnPerUnit,
}: {
  flag: string
  code: string
  name: string
  loading: boolean
  value: number | null
  formatMxnPerUnit: (n: number) => string
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.25rem] border border-border bg-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl ring-1 ring-border">
        {flag}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{code}</p>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">1 {code} ≈</p>
        {loading ? (
          <div className="mt-1 h-7 w-40 animate-pulse rounded-md bg-secondary" />
        ) : value != null ? (
          <p className="mt-0.5 text-lg font-black tabular-nums text-foreground">{formatMxnPerUnit(value)}</p>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  )
}
