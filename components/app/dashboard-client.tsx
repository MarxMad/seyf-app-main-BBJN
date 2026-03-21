'use client'

import Link from 'next/link'
import { Plus, ArrowLeftRight, Building2, MoreHorizontal, ChevronRight } from 'lucide-react'
import { AppPageBody } from '@/components/app/app-page-body'
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

export default function DashboardClient() {
  const data = mockData
  const balanceCompact = Math.round(data.principal)

  return (
    <AppPageBody className="space-y-6 pt-4">
      {/* Hero — saldo */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-card to-blue-950/60" />
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
          <p className="text-[13px] font-medium text-muted-foreground">Personal · MXN</p>
          <p className="mt-1 text-[2.75rem] font-black leading-none tracking-tight tabular-nums text-foreground">
            {formatMXN(balanceCompact)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Disponible · {formatMXNFull(data.principal)} total</p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-muted"
            >
              Saldos
            </button>
          </div>
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="h-1 w-1.5 rounded-full bg-foreground" />
            <span className="h-1 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-1 w-1.5 rounded-full bg-muted-foreground/40" />
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
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary ring-1 ring-border">
                <Icon className="size-6 text-foreground" strokeWidth={2} />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Actividad reciente */}
      <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Actividad reciente</h2>
        </div>
        <ul className="divide-y divide-border">
          {mockTransactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                {tx.initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tx.title}</p>
                <p className="text-xs text-muted-foreground">{tx.subtitle}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-bold tabular-nums',
                  tx.amount < 0 ? 'text-foreground' : 'text-emerald-400/90',
                )}
              >
                {tx.amount < 0 ? '' : '+'}
                {formatMXN(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-2 py-2">
          <Link
            href="/historial"
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            Ver todo
          </Link>
        </div>
      </section>

      {/* Tarjetas / productos */}
      <section className="rounded-[1.5rem] border border-border bg-card/50 p-4">
        <Link href="/dashboard" className="flex items-center justify-between text-sm font-bold text-foreground">
          <span>Tus productos</span>
          <ChevronRight className="size-4 text-muted-foreground" />
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
                'min-w-[8.5rem] shrink-0 rounded-2xl bg-gradient-to-br p-4 ring-1 ring-border',
                card.tone,
              )}
            >
              <p className="text-[11px] font-medium text-white/80">{card.label}</p>
              <p className="mt-1 text-sm font-black tabular-nums text-white">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Adelanto destacado */}
      <section className="rounded-[1.5rem] border border-border bg-secondary/40 p-5">
        <p className="text-xs font-medium text-muted-foreground">Puedes pedir adelantado</p>
        <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-foreground">
          {formatMXNFull(data.adelantable)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Sin tocar tu ahorro. Solo parte de lo que ya generaste.
        </p>
        <Link href="/adelanto" className="mt-4 block">
          <Button className="h-12 w-full rounded-full bg-foreground text-base font-bold text-background hover:bg-foreground/90">
            Pedir adelanto
          </Button>
        </Link>
      </section>

      {data.saldoGasto > 0 && (
        <section className="flex items-center justify-between rounded-[1.5rem] border border-border bg-card px-4 py-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Saldo para gastar</p>
            <p className="text-xl font-black tabular-nums text-foreground">{formatMXNFull(data.saldoGasto)}</p>
          </div>
          <Link href="/gastar">
            <Button
              variant="outline"
              className="h-10 rounded-full border-border bg-transparent px-5 font-semibold text-foreground hover:bg-secondary"
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
          <p className="text-sm font-bold text-foreground">Completa tu verificación</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
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
    </AppPageBody>
  )
}
