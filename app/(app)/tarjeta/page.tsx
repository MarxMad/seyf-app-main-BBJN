'use client'

import { useCallback, useState } from 'react'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import { cn } from '@/lib/utils'

/** Datos de demostración — no son una tarjeta real. */
const DEMO = {
  panGroups: ['5356', '8924', '4410', '9028'],
  holder: 'TITULAR SEYF',
  expiry: '09 / 28',
  cvv: '742',
}

export default function TarjetaPage() {
  const [flipped, setFlipped] = useState(false)
  const toggle = useCallback(() => setFlipped((v) => !v), [])

  return (
    <AppPageBody className="space-y-6 pt-2">
      <AppBackLink href="/dashboard" />

      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Tarjeta virtual</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista previa visual. Toca la tarjeta para ver el reverso (número completo y CVV).
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm" style={{ perspective: '1200px' }}>
        <button
          type="button"
          onClick={toggle}
          className="relative h-[13.5rem] w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[1.35rem]"
          aria-pressed={flipped}
          aria-label={flipped ? 'Ver frente de tarjeta' : 'Ver reverso de tarjeta'}
        >
          <div
            className="relative h-full w-full transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className={cn(
                'absolute inset-0 overflow-hidden rounded-[1.35rem] border border-white/15 p-5 shadow-xl',
                'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black',
              )}
              style={{ backfaceVisibility: 'hidden' as const, WebkitBackfaceVisibility: 'hidden' }}
            >
              <div className="pointer-events-none absolute -right-8 top-6 h-28 w-28 rounded-full bg-violet-500/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Seyf</p>
                  <span className="rounded-md bg-amber-200/90 px-2 py-0.5 text-[10px] font-black text-amber-950">
                    VIRTUAL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-100 to-amber-300/80 shadow-inner ring-1 ring-black/20" />
                  <div className="ml-1 flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-1 w-1 rounded-full bg-white/60" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-xl font-bold tracking-[0.25em] text-white tabular-nums sm:text-2xl">
                    •••• &nbsp; •••• &nbsp; •••• &nbsp; {DEMO.panGroups[3]}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                        Titular
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-white">
                        {DEMO.holder}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                        Vence
                      </p>
                      <p className="font-mono text-sm font-bold text-white">{DEMO.expiry}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'absolute inset-0 overflow-hidden rounded-[1.35rem] border border-white/15 p-5 shadow-xl',
                'bg-gradient-to-br from-zinc-700 via-zinc-900 to-zinc-950',
              )}
              style={{
                backfaceVisibility: 'hidden' as const,
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-8 h-9 bg-zinc-950/90" />
              <div className="relative flex h-full flex-col justify-between pb-1 pt-[4.6rem]">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                    Número de tarjeta
                  </p>
                  <p className="mt-1 font-mono text-base font-bold tracking-widest text-white sm:text-lg">
                    {DEMO.panGroups.join(' ')}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-black/35 px-4 py-2.5 ring-1 ring-white/10">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                      Vence
                    </p>
                    <p className="font-mono text-sm font-bold text-white">{DEMO.expiry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">CVV</p>
                    <p className="font-mono text-lg font-black tracking-widest text-white">{DEMO.cvv}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Demo de interfaz: no uses estos datos en pagos reales.
      </p>
    </AppPageBody>
  )
}
