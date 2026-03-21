'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppPageBody } from '@/components/app/app-page-body'
import { AppBackLink } from '@/components/app/app-back-link'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

const MAX_ADELANTO = 98.5
const COMISION_RATE = 0.08

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdelantoPage() {
  const router = useRouter()
  const [monto, setMonto] = useState(MAX_ADELANTO)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  const comision = parseFloat((monto * COMISION_RATE).toFixed(2))
  const neto = parseFloat((monto - comision).toFixed(2))

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
          <SummaryRow label="Monto adelantado" value={formatMXN(monto)} />
          <SummaryRow label="Comisión Seyf" value={formatMXN(comision)} dim />
          <div className="border-t border-border pt-3">
            <SummaryRow label="Recibiste" value={formatMXN(neto)} bold />
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
          Pedir adelanto
          <br />
          de rendimiento
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">
          No tocamos tu ahorro. Solo adelantamos parte de lo que ya generaste.
        </p>
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-border bg-secondary p-6">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Monto a adelantar</p>
        <p className="mb-6 text-4xl font-black tabular-nums tracking-tight text-foreground">{formatMXN(monto)}</p>
        <Slider
          min={10}
          max={MAX_ADELANTO}
          step={0.5}
          value={[monto]}
          onValueChange={([val]) => setMonto(val)}
          className="w-full [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-foreground"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>$10.00</span>
          <span>Max {formatMXN(MAX_ADELANTO)}</span>
        </div>
      </div>

      <div className="mb-8 space-y-3 rounded-[1.5rem] border border-border bg-card/50 p-5">
        <SummaryRow label="Monto adelantado" value={formatMXN(monto)} />
        <SummaryRow label="Comisión Seyf" value={`− ${formatMXN(comision)}`} dim />
        <div className="border-t border-border pt-3">
          <SummaryRow label="Monto neto a recibir" value={formatMXN(neto)} bold />
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
        Solo puedes tener un adelanto activo por ciclo de inversión (28 días).
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
