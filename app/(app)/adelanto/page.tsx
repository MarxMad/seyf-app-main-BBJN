'use client'

import { useMemo, useState } from 'react'
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

  useMemo(() => {
    fetch('/api/seyf/advance/simulate')
      .then((res) => res.json())
      .then((data) => {
        setSimulation(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleConfirmar = async () => {
    if (!simulation) return
    setConfirming(true)
    try {
      const res = await fetch('/api/seyf/advance/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_mxn: simulation.max_advance_mxn }),
      })
      const data = await res.json()
      if (data.status === 'completed') {
        setTxHash(data.stellar_tx_hash)
        setExito(true)
      } else {
        alert(data.error || 'Error al procesar el adelanto')
      }
    } catch (e) {
      alert('Error de conexión')
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
            <SummaryRow label="Stellar TX" value={txHash?.slice(0, 8) + '...' + txHash?.slice(-8)} dim />
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
            Adelanta tus rendimientos proyectados sin esperar al vencimiento. 
            <span className="block mt-1 font-bold text-white">Esto no es un préstamo.</span>
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto máximo disponible</p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-foreground">
            {formatMXN(simulation?.max_advance_mxn || 0)}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <SummaryRow label="Rendimiento neto a recibir" value={formatMXN(simulation?.net_to_user_mxn || 0)} bold />
          <SummaryRow label="Comisión de servicio (flat)" value={formatMXN(simulation?.fee_mxn || 0)} dim />
          <SummaryRow label="Fecha de liberación ciclo" value={fechaLiberacion} dim />
        </div>
      </section>

      <div className="bg-secondary/30 rounded-[1.25rem] p-4 border border-border/50">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Nota:</strong> El adelanto se deduce de tu rendimiento final. 
          Al confirmarlo, el capital correspondiente quedará bloqueado hasta la fecha de liberación indicada.
        </p>
      </div>

      <Button
        onClick={handleConfirmar}
        disabled={confirming || !simulation?.max_advance_mxn}
        className="h-12 w-full rounded-full bg-foreground text-base font-bold text-background shadow-[0_10px_28px_rgba(255,255,255,0.12)] hover:bg-foreground/90 disabled:opacity-60"
      >
        {confirming ? 'Ejecutando en Stellar…' : 'Confirmar adelanto'}
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        Operación procesada mediante contrato inteligente Soroban.
      </p>
    </AppPageBody>
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
