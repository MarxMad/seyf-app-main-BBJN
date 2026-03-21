'use client'

import Link from 'next/link'
import { Search, BarChart3, CreditCard } from 'lucide-react'

/** Mismo mock que el dashboard hasta conectar auth */
const DISPLAY_NAME = 'Carlos'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function AppTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-6 py-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tracking-tight text-foreground ring-1 ring-border"
          aria-label="Inicio"
        >
          {initials(DISPLAY_NAME)}
        </Link>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <div className="rounded-full bg-secondary py-2.5 pl-10 pr-4 ring-1 ring-border">
            <span className="text-sm text-muted-foreground">Buscar</span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary ring-1 ring-border"
          aria-label="Analíticas"
        >
          <BarChart3 className="size-[1.15rem] text-foreground" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary ring-1 ring-border"
          aria-label="Tarjetas"
        >
          <CreditCard className="size-[1.15rem] text-foreground" strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
