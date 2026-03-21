'use client'

import Link from 'next/link'
import {
  Search,
  BarChart3,
  CreditCard,
  Plus,
  ArrowLeftRight,
  Building2,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const mockData = {
  nombre: 'Carlos',
  principal: 8500,
  rendimiento: 127.43,
  adelantable: 98.5,
  saldoGasto: 350,
  tasa: 9.8,
  diasRestantes: 18,
}

const mockTransactions = [
  {
    id: '1',
    title: 'Oxxo Cel',
    subtitle: 'Hoy · 12:32',
    amount: -323,
    initial: 'OC',
  },
  {
    id: '2',
    title: 'SPEI recibido',
    subtitle: 'Ayer',
    amount: 1500,
    initial: 'S',
  },
  {
    id: '3',
    title: 'Netflix',
    subtitle: '3 feb',
    amount: -199,
    initial: 'N',
  },
]

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMXNFull(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DashboardClient() {
  const data = mockData
  const balanceCompact = Math.round(data.principal)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-bold tracking-tight ring-1 ring-white/10"
            aria-label="Perfil"
          >
            {initials(data.nombre)}
          </button>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35"
              strokeWidth={2}
            />
            <div className="rounded-full bg-white/[0.06] py-2.5 pl-10 pr-4 ring-1 ring-white/[0.08]">
              <span className="text-sm text-white/40">Buscar</span>
            </div>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"
            aria-label="Analíticas"
          >
            <BarChart3 className="size-[1.15rem] text-white/80" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"
            aria-label="Tarjetas"
          >
            <CreditCard className="size-[1.15rem] text-white/80" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-4">
        {/* Hero — saldo */}
        <section className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-[#12121a] to-blue-950/60" />
          <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative px-6 pb-8 pt-10 text-center">
            <p className="text-[13px] font-medium text-white/55">Personal · MXN</p>
            <p className="mt-1 text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">
              {formatMXN(balanceCompact)}
            </p>
            <p className="mt-2 text-xs text-white/35">Disponible · {formatMXNFull(data.principal)} total</p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                className="rounded-full bg-white/[0.12] px-5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/[0.16]"
              >
                Saldos
              </button>
            </div>
            <div className="mt-6 flex justify-center gap-1.5">
              <span className="h-1 w-1.5 rounded-full bg-white" />
              <span className="h-1 w-1.5 rounded-full bg-white/25" />
              <span className="h-1 w-1.5 rounded-full bg-white/25" />
            </div>
          </div>
        </section>

        {/* Acciones rápidas */}
        <section>
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: '/depositar', label: 'Añadir', icon: Plus },
              { href: '/depositar', label: 'Cambio', icon: ArrowLeftRight },
              { href: '/dashboard', label: 'Datos', icon: Building2 },
              { href: '/historial', label: 'Más', icon: MoreHorizontal },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 rounded-2xl py-2 transition active:scale-[0.97]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-white/[0.1]">
                  <Icon className="size-6 text-white" strokeWidth={2} />
                </span>
                <span className="text-center text-[11px] font-medium leading-tight text-white/70">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Actividad reciente */}
        <section className="overflow-hidden rounded-[1.5rem] bg-white/[0.04] ring-1 ring-white/[0.06] backdrop-blur-xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-semibold text-white/90">Actividad reciente</h2>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {mockTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white/90">
                  {tx.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/95">{tx.title}</p>
                  <p className="text-xs text-white/40">{tx.subtitle}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold tabular-nums',
                    tx.amount < 0 ? 'text-white/90' : 'text-emerald-400/90',
                  )}
                >
                  {tx.amount < 0 ? '' : '+'}
                  {formatMXN(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/[0.06] px-2 py-2">
            <Link
              href="/historial"
              className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.04] hover:text-white"
            >
              Ver todo
            </Link>
          </div>
        </section>

        {/* Tarjetas / productos */}
        <section className="rounded-[1.5rem] bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
          <Link
            href="/dashboard"
            className="flex items-center justify-between text-sm font-semibold text-white/90"
          >
            <span>Tus productos</span>
            <ChevronRight className="size-4 text-white/40" />
          </Link>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { label: 'Ahorro', sub: formatMXNFull(data.principal), tone: 'from-violet-600/90 to-indigo-800/90' },
              { label: 'Rendimiento', sub: formatMXNFull(data.rendimiento), tone: 'from-zinc-600/90 to-zinc-800/90' },
              { label: 'Adelanto', sub: formatMXNFull(data.adelantable), tone: 'from-slate-600/90 to-slate-800/90' },
            ].map((card) => (
              <div
                key={card.label}
                className={cn(
                  'min-w-[8.5rem] shrink-0 rounded-2xl bg-gradient-to-br p-4 ring-1 ring-white/10',
                  card.tone,
                )}
              >
                <p className="text-[11px] font-medium text-white/80">{card.label}</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-white">{card.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Adelanto destacado */}
        <section className="rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-5">
          <p className="text-xs font-medium text-white/50">Puedes pedir adelantado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{formatMXNFull(data.adelantable)}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Sin tocar tu ahorro. Solo parte de lo que ya generaste.
          </p>
          <Link href="/adelanto" className="mt-4 block">
            <Button className="h-12 w-full rounded-full bg-white font-bold text-zinc-950 hover:bg-white/90">
              Pedir adelanto
            </Button>
          </Link>
        </section>

        {data.saldoGasto > 0 && (
          <section className="flex items-center justify-between rounded-[1.5rem] bg-white/[0.04] px-4 py-4 ring-1 ring-white/[0.06]">
            <div>
              <p className="text-xs font-medium text-white/45">Saldo para gastar</p>
              <p className="text-xl font-bold tabular-nums">{formatMXNFull(data.saldoGasto)}</p>
            </div>
            <Link href="/gastar">
              <Button
                variant="outline"
                className="h-10 rounded-full border-white/15 bg-transparent px-5 font-semibold text-white hover:bg-white/10"
              >
                Usar
              </Button>
            </Link>
          </section>
        )}

        {/* Verificación */}
        <section className="flex gap-3 rounded-[1.25rem] border border-amber-500/20 bg-amber-500/[0.07] p-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-200">
            <span className="text-sm font-bold">!</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Completa tu verificación</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/55">
              Para depositar más, verifica tu identidad.
            </p>
            <Link
              href="/verificacion"
              className="mt-2 inline-block text-xs font-bold text-amber-200/90 underline-offset-4 hover:underline"
            >
              Verificar ahora
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
