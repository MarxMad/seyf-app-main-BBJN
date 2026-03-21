'use client'

import { useState, type ReactNode } from 'react'
import { AppPageBody } from '@/components/app/app-page-body'
import { cn } from '@/lib/utils'

type Tipo = 'deposito' | 'rendimiento' | 'adelanto' | 'retiro' | 'pago'

interface Movimiento {
  id: string
  tipo: Tipo
  monto: number
  fecha: string
  hora: string
  estado: 'completado' | 'pendiente' | 'fallido'
  detalle?: string
}

const movimientos: Movimiento[] = [
  {
    id: '1',
    tipo: 'deposito',
    monto: 8500,
    fecha: '18 Mar 2026',
    hora: '10:32',
    estado: 'completado',
    detalle: 'Depósito vía SPEI desde BBVA',
  },
  {
    id: '2',
    tipo: 'rendimiento',
    monto: 52.1,
    fecha: '18 Mar 2026',
    hora: '10:33',
    estado: 'completado',
    detalle: 'Rendimiento CETES acumulado día 1',
  },
  {
    id: '3',
    tipo: 'rendimiento',
    monto: 75.33,
    fecha: '19 Mar 2026',
    hora: '00:01',
    estado: 'completado',
    detalle: 'Rendimiento CETES acumulado día 2',
  },
  {
    id: '4',
    tipo: 'adelanto',
    monto: -90.5,
    fecha: '20 Mar 2026',
    hora: '09:15',
    estado: 'completado',
    detalle: 'Adelanto de rendimiento solicitado',
  },
  {
    id: '5',
    tipo: 'pago',
    monto: -45,
    fecha: '20 Mar 2026',
    hora: '14:22',
    estado: 'completado',
    detalle: 'Pago QR en comercio',
  },
  {
    id: '6',
    tipo: 'retiro',
    monto: -305,
    fecha: '20 Mar 2026',
    hora: '17:50',
    estado: 'pendiente',
    detalle: 'Retiro a CLABE …1234 vía SPEI',
  },
]

const tipoConfig: Record<Tipo, { label: string; icon: ReactNode }> = {
  deposito: {
    label: 'Depósito',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  rendimiento: {
    label: 'Rendimiento',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  adelanto: {
    label: 'Adelanto',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 8 12 12 15 14" />
      </svg>
    ),
  },
  retiro: {
    label: 'Retiro',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 12 19 12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    ),
  },
  pago: {
    label: 'Pago QR',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
}

const filtros = ['Todos', 'Depósitos', 'Rendimiento', 'Adelantos', 'Retiros'] as const
type Filtro = (typeof filtros)[number]

const filtroMap: Record<Filtro, Tipo[] | null> = {
  Todos: null,
  Depósitos: ['deposito'],
  Rendimiento: ['rendimiento'],
  Adelantos: ['adelanto'],
  Retiros: ['retiro', 'pago'],
}

function formatMXN(amount: number) {
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(abs)
  return amount < 0 ? `− ${formatted}` : `+ ${formatted}`
}

export default function HistorialPage() {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [selected, setSelected] = useState<Movimiento | null>(null)

  const filtered = filtroMap[filtro]
    ? movimientos.filter((m) => filtroMap[filtro]!.includes(m.tipo))
    : movimientos

  return (
    <AppPageBody>
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">Historial</h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">Todos tus movimientos en un solo lugar.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtros.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              filtro === f
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground ring-1 ring-border hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-border bg-card py-20 text-center">
          <p className="mb-2 text-lg font-black text-foreground">Sin movimientos</p>
          <p className="text-sm text-muted-foreground">Aquí aparecerán tus transacciones.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mov) => {
            const config = tipoConfig[mov.tipo]
            const esPositivo = mov.monto > 0
            return (
              <button
                key={mov.id}
                type="button"
                onClick={() => setSelected(mov)}
                className="flex w-full items-center justify-between rounded-[1.25rem] border border-border bg-card p-4 text-left transition hover:bg-secondary/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {mov.fecha} · {mov.hora}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      esPositivo ? 'text-emerald-400/90' : 'text-foreground',
                    )}
                  >
                    {formatMXN(mov.monto)}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs font-medium',
                      mov.estado === 'completado'
                        ? 'text-muted-foreground'
                        : mov.estado === 'pendiente'
                          ? 'text-amber-300/90'
                          : 'text-red-400/90',
                    )}
                  >
                    {mov.estado.charAt(0).toUpperCase() + mov.estado.slice(1)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-t-[1.75rem] border border-border border-b-0 bg-popover p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground">
                {tipoConfig[selected.tipo].icon}
              </div>
              <div>
                <p className="text-lg font-black text-foreground">{tipoConfig[selected.tipo].label}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.fecha} a las {selected.hora}
                </p>
              </div>
            </div>
            <div className="mb-6 space-y-3">
              <DetailRow label="Monto" value={formatMXN(selected.monto)} />
              <DetailRow
                label="Estado"
                value={selected.estado.charAt(0).toUpperCase() + selected.estado.slice(1)}
              />
              {selected.detalle && <DetailRow label="Detalle" value={selected.detalle} />}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="h-12 w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </AppPageBody>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="shrink-0 text-sm text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
