'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type AdvanceSimulatorCardProps = {
  /** Current yield balance available to advance against (MXN). */
  yieldBalance: number
  /** Annual yield rate as a decimal, e.g. 0.115 for 11.5%. */
  annualRate: number
  /** Called when the user confirms the advance request. */
  onRequestAdvance?: (amount: number) => void
  className?: string
}

const ADVANCE_STEPS = [0.25, 0.5, 0.75, 1] as const

export function AdvanceSimulatorCard({
  yieldBalance,
  annualRate,
  onRequestAdvance,
  className,
}: AdvanceSimulatorCardProps) {
  const [fraction, setFraction] = useState<(typeof ADVANCE_STEPS)[number]>(0.5)
  const amount = yieldBalance * fraction
  const fee = amount * 0.01 // 1% flat fee for display purposes
  const net = amount - fee

  return (
    <section
      className={cn('rounded-2xl border border-border bg-card p-5 space-y-5', className)}
      aria-label="Simulador de adelanto"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-border">
          <Zap className="size-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Adelanta tus rendimientos</p>
          <p className="text-xs text-muted-foreground">
            Tasa anual referencia: {(annualRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Monto a adelantar</span>
          <span className="font-semibold text-foreground">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}
          </span>
        </div>
        <Progress value={fraction * 100} />
        <div className="flex gap-2">
          {ADVANCE_STEPS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFraction(f)}
              className={cn(
                'flex-1 rounded-full border py-1.5 text-xs font-semibold transition-colors',
                fraction === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary text-muted-foreground hover:bg-secondary/80',
              )}
            >
              {f * 100}%
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 space-y-1.5 text-sm">
        <Row label="Adelanto bruto" value={amount} />
        <Row label="Comisión (1%)" value={-fee} />
        <div className="border-t border-border pt-1.5">
          <Row label="Recibes" value={net} bold />
        </div>
      </div>

      <Button
        className="w-full h-11 rounded-full font-bold"
        onClick={() => onRequestAdvance?.(amount)}
        disabled={amount <= 0}
      >
        Solicitar adelanto
      </Button>
    </section>
  )
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Math.abs(value),
  )
  return (
    <div className="flex justify-between">
      <span className={cn('text-muted-foreground', bold && 'font-semibold text-foreground')}>
        {label}
      </span>
      <span className={cn('tabular-nums', bold && 'font-bold text-foreground')}>
        {value < 0 ? '− ' : ''}
        {formatted}
      </span>
    </div>
  )
}
