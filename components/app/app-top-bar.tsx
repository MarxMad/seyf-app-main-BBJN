'use client'

import Link from 'next/link'
import { Search, BarChart3, CreditCard } from 'lucide-react'
import { useAccesly } from 'accesly'

function avatarLabel(wallet: { email?: string; stellarAddress: string } | null, loading: boolean) {
  if (loading) return '…'
  if (!wallet) return '?'
  const local = wallet.email?.split('@')[0]?.trim()
  if (local && local.length >= 1) return local.slice(0, 2).toUpperCase()
  return wallet.stellarAddress.slice(0, 2).toUpperCase()
}

export default function AppTopBar() {
  const { wallet, loading } = useAccesly()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-6 py-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tracking-tight text-foreground ring-1 ring-border"
          aria-label="Inicio"
        >
          {avatarLabel(wallet, loading)}
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
