'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { AppPageBody } from '@/components/app/app-page-body'
import { AppBackLink } from '@/components/app/app-back-link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdelantoPage() {
  const router = useRouter()
  const [ledger, setLedger] = useState<{
    balances: {
      mxn_available: number
      mxn_blocked: number
      mxn_settling: number
      mxn_total: number
      advance_outstanding_mxn: number
    }
    constraints: {
      mxn_spendable: number
    }
  } | null>(null)
  const [readiness, setReadiness] = useState<{
    onrampEnabled: boolean
    reasons: string[]
  } | null>(null)
  const [simulation, setSimulation] = useState<{
    max_advance_mxn: number
    fee_mxn: number
    net_to_user_mxn: number
    cycle_end_date: string
    advance_available: boolean
    error?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [exito, setExito] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [uiError, setUiError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/seyf/advance/simulate').then((res) => res.json()),
      fetch('/api/seyf/ledger/mxn').then((res) => res.json()),
      fetch('/api/seyf/etherfuse/readiness').then((res) => res.json()),
    ])
      .then(([simData, ledgerData, readinessData]) => {
        setSimulation(simData)
        setLedger(ledgerData)
        setReadiness({
          onrampEnabled: readinessData?.onrampEnabled === true,
          reasons: Array.isArray(readinessData?.reasons)
            ? readinessData.reasons.filter((x: unknown): x is string => typeof x === 'string')
            : [],
        })
      })
      .catch(() => {
        setUiError('No pudimos cargar tu información de adelanto.')
      })
      .finally(() => setLoading(false))
  }, [])

  const spendableMxn = ledger?.constraints?.mxn_spendable ?? 0
  const maxAdvanceBusiness = useMemo(() => {
    const simulated = simulation?.max_advance_mxn ?? 0
    return Math.max(0, Math.min(simulated, spendableMxn))
  }, [simulation?.max_advance_mxn, spendableMxn])

  const handleConfirmar = async () => {
    if (!simulation) return
    if (readiness && !readiness.onrampEnabled) {
      setUiError('Completa tu configuración de cuenta antes de solicitar adelanto.')
      return
    }
    if (maxAdvanceBusiness <= 0) {
      setUiError('No tienes saldo disponible para adelanto en este momento.')
      return
    }
    setConfirming(true)
    setUiError(null)
    try {
      const res = await fetch('/api/seyf/advance/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_mxn: maxAdvanceBusiness }),
      })
      const data = await res.json()
      if (data.status === 'completed') {
        setTxHash(data.stellar_tx_hash)
        setExito(true)
      } else {
        setUiError(data.error || 'No pudimos procesar tu adelanto.')
      }
    } catch {
      setUiError('Error de conexión. Intenta nuevamente.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <AppPageBody className="flex items-center justify-center pt-20">
        <p className="text-muted-foreground animate-pulse font-medium">Cargando simulación...</p>
      </AppPageBody>
    )
  }

  if (simulation?.error === 'advance_already_used') {
    return (
      <AppPageBody className="space-y-6 pt-2">
        <AppBackLink href="/dashboard" />
        <section className="rounded-[1.5rem] border border-amber-400/30 bg-amber-900/10 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-200">Adelanto ya utilizado</h2>
          <p className="mt-2 text-sm text-amber-100/70">Ya has solicitado un adelanto para este ciclo. Podrás solicitar otro en el siguiente periodo.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-6 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-bold">Volver al inicio</Button>
        </section>
      </AppPageBody>
    )
  }

  if (simulation?.advance_available === false) {
    return (
      <AppPageBody className="space-y-6 pt-2">
        <AppBackLink href="/dashboard" />
        <section className="rounded-[1.5rem] border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-bold">Sin ciclo activo</h2>
          <p className="mt-2 text-sm text-muted-foreground">No tienes inversiones activas que califiquen para un adelanto en este momento.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-6 rounded-full font-bold">Ir a invertir</Button>
        </section>
      </AppPageBody>
    )
  }

  if (exito) {
    return (
      <AppPageBody className="space-y-6 pt-2">
        <AppBackLink href="/dashboard" />

        <section className="relative overflow-hidden rounded-[1.5rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-800/35 via-teal-900/25 to-card p-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/25 ring-1 ring-emerald-400/40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-300"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="inline-flex rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-100/90">
              Adelanto activado
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Listo</h2>
            <p className="mt-2 text-sm text-emerald-100/85">Tu adelanto está disponible para gastar.</p>
          </div>
        </section>

        <div className="space-y-3 rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
          <SummaryRow label="Adelanto recibido" value={formatMXN(simulation?.net_to_user_mxn || 0)} bold />
          <div className="border-t border-border pt-3">
            <SummaryRow label="Referencia de operación" value={txHash?.slice(0, 8) + '...' + txHash?.slice(-8)} dim />
          </div>
        </div>

        <Link href="/gastar" className="block">
          <Button className="h-12 w-full rounded-full bg-foreground text-base font-bold text-background shadow-[0_10px_28px_rgba(255,255,255,0.12)] hover:bg-foreground/90">
            Usar mi adelanto
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Volver al inicio
        </button>
      </AppPageBody>
    )
  }

  const fechaLiberacion = simulation?.cycle_end_date
    ? new Date(simulation.cycle_end_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--'

  return (
    <AppPageBody className="space-y-6 pt-2">
      <AppBackLink href="/dashboard" />

      <section className="relative overflow-hidden rounded-[1.5rem] border border-violet-400/25 bg-gradient-to-br from-violet-700/35 via-indigo-700/25 to-sky-700/15 p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-violet-100/90">
            <Sparkles className="size-3 text-violet-200" />
            Adelanto de rendimiento
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Obtén liquidez hoy</h1>
          <p className="mt-2 text-sm text-violet-100/80">
            Adelanta una parte de tu rendimiento proyectado sin esperar al vencimiento.
            <span className="block mt-1 font-bold text-white">Tu saldo se mantiene protegido por reglas de bloqueo.</span>
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Saldo disponible" value={formatMXN(spendableMxn)} />
          <MiniStat label="Saldo bloqueado" value={formatMXN(ledger?.balances?.mxn_blocked ?? 0)} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto máximo disponible</p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-foreground">
            {formatMXN(maxAdvanceBusiness)}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <SummaryRow label="Rendimiento neto a recibir" value={formatMXN(Math.max(0, (simulation?.net_to_user_mxn || 0) > 0 ? Math.min(simulation?.net_to_user_mxn || 0, maxAdvanceBusiness) : 0))} bold />
          <SummaryRow label="Comisión de servicio (flat)" value={formatMXN(simulation?.fee_mxn || 0)} dim />
          <SummaryRow label="Fecha de liberación ciclo" value={fechaLiberacion} dim />
        </div>
      </section>

      {readiness && !readiness.onrampEnabled ? (
        <div className="rounded-[1.25rem] border border-amber-500/25 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">Faltan pasos para habilitar adelanto</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-100/80">
            {readiness.reasons.slice(0, 4).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => router.push('/identidad')}>
              Completar verificación
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => router.push('/anadir')}>
              Revisar depósitos
            </Button>
          </div>
        </div>
      ) : null}

      {uiError ? (
        <div className="rounded-[1rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {uiError}
        </div>
      ) : null}

      <div className="bg-secondary/30 rounded-[1.25rem] p-4 border border-border/50">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Nota:</strong> El adelanto se descuenta de tu rendimiento proyectado.
          Al confirmarlo, ese monto queda reservado hasta la fecha de liquidación.
        </p>
      </div>

      <Button
        onClick={handleConfirmar}
        disabled={confirming || !maxAdvanceBusiness || (readiness ? !readiness.onrampEnabled : false)}
        className="h-12 w-full rounded-full bg-foreground text-base font-bold text-background shadow-[0_10px_28px_rgba(255,255,255,0.12)] hover:bg-foreground/90 disabled:opacity-60"
      >
        {confirming ? 'Confirmando operación…' : 'Confirmar adelanto'}
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        Operación sujeta a validaciones de cuenta y disponibilidad.
      </p>
    </AppPageBody>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  dim,
  bold,
}: {
  label: string
  value: string
  dim?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className={cn('text-sm', dim ? 'text-muted-foreground' : 'text-muted-foreground/90')}>{label}</p>
      <p
        className={cn(
          'max-w-[58%] text-right text-sm tabular-nums',
          bold ? 'font-bold text-foreground' : dim ? 'text-muted-foreground' : 'font-semibold text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}
