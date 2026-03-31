'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppPageBody } from '@/components/app/app-page-body'
import { AppBackLink } from '@/components/app/app-back-link'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

const MIN_AHORRO = 1_000
const MAX_AHORRO = 250_000
const ADELANTO_FACTOR = 0.75

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdelantoPage() {
  const router = useRouter()
  const [ahorro, setAhorro] = useState(10_000)
  const [tasaAnual, setTasaAnual] = useState(8)
  const [periodoMeses, setPeriodoMeses] = useState(12)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  const { rendimientoEstimado, adelantoInstantaneo, totalEstimadoAlVencimiento, fechaLiberacion } =
    useMemo(() => {
      const rendimiento = ahorro * (tasaAnual / 100) * (periodoMeses / 12)
      const adelanto = rendimiento * ADELANTO_FACTOR
      const totalAlVencimiento = ahorro + rendimiento
      const d = new Date()
      d.setMonth(d.getMonth() + periodoMeses)
      return {
        rendimientoEstimado: rendimiento,
        adelantoInstantaneo: adelanto,
        totalEstimadoAlVencimiento: totalAlVencimiento,
        fechaLiberacion: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      }
    }, [ahorro, tasaAnual, periodoMeses])

  const handleConfirmar = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setExito(true)
    }, 1800)
  }

  if (exito) {
    return (
      <AppPageBody className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="mb-8 w-full max-w-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground leading-none">Listo</h2>
          <p className="mt-4 text-base text-muted-foreground font-normal">Tu adelanto está disponible para gastar.</p>
        </div>

        <div className="mb-8 w-full max-w-sm space-y-3 rounded-[1.5rem] border border-border bg-secondary p-6 text-left">
          <SummaryRow label="Capital bloqueado" value={formatMXN(ahorro)} />
          <SummaryRow label="Adelanto recibido hoy" value={formatMXN(adelantoInstantaneo)} />
          <div className="border-t border-border pt-3">
            <SummaryRow label="Fecha estimada de liberación" value={fechaLiberacion} bold />
          </div>
        </div>

        <Link href="/gastar" className="w-full max-w-sm">
          <Button className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90">
            Usar mi adelanto
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Volver al inicio
        </button>
      </AppPageBody>
    )
  }

  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
          Simular y pedir
          <br />
          adelanto
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">
          El capital queda bloqueado durante el periodo y te adelantamos hasta 75% del
          rendimiento estimado.
        </p>
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-border bg-secondary p-6">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Capital a bloquear</p>
        <p className="mb-4 text-4xl font-black tabular-nums tracking-tight text-foreground">{formatMXN(ahorro)}</p>
        <Slider
          min={MIN_AHORRO}
          max={MAX_AHORRO}
          step={500}
          value={[ahorro]}
          onValueChange={([val]) => setAhorro(val)}
          className="w-full [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-foreground"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatMXN(MIN_AHORRO)}</span>
          <span>Max {formatMXN(MAX_AHORRO)}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">Tasa anual</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{tasaAnual.toFixed(1)}%</p>
          <Slider
            min={4}
            max={15}
            step={0.5}
            value={[tasaAnual]}
            onValueChange={([val]) => setTasaAnual(val)}
            className="mt-3 w-full [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-foreground"
          />
        </div>
        <div className="rounded-[1.25rem] border border-border bg-card/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">Periodo</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{periodoMeses} meses</p>
          <Slider
            min={3}
            max={24}
            step={1}
            value={[periodoMeses]}
            onValueChange={([val]) => setPeriodoMeses(val)}
            className="mt-3 w-full [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-foreground"
          />
        </div>
      </div>

      <div className="mb-8 space-y-3 rounded-[1.5rem] border border-border bg-card/50 p-5">
        <SummaryRow label="Rendimiento estimado del periodo" value={formatMXN(rendimientoEstimado)} />
        <SummaryRow label="Adelanto inmediato (75%)" value={formatMXN(adelantoInstantaneo)} bold />
        <SummaryRow label="Total estimado al vencimiento" value={formatMXN(totalEstimadoAlVencimiento)} dim />
        <div className="border-t border-border pt-3">
          <SummaryRow label="Capital liberado estimado" value={`${formatMXN(ahorro)} · ${fechaLiberacion}`} bold />
        </div>
      </div>

      <Button
        onClick={handleConfirmar}
        disabled={loading}
        className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90 disabled:opacity-60"
      >
        {loading ? 'Procesando…' : 'Confirmar adelanto'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Si liquidas el adelanto antes, puedes liberar capital anticipadamente.
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
          'text-sm tabular-nums',
          bold ? 'font-bold text-foreground' : dim ? 'text-muted-foreground' : 'font-semibold text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}
