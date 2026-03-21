'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, UserRound } from 'lucide-react'
import { useAccesly } from 'accesly'
import { Button } from '@/components/ui/button'

function maskAddress(value?: string | null) {
  if (!value) return '—'
  if (value.length < 14) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function shortKey(value?: string | null, head = 8, tail = 4) {
  if (!value) return '—'
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

function formatNetwork() {
  const n = process.env.NEXT_PUBLIC_ACCESLY_NETWORK
  if (n === 'mainnet' || n === 'testnet') return n
  return 'testnet'
}

export default function AppUserAccountPanel() {
  const router = useRouter()
  const { wallet, balance, loading, disconnect } = useAccesly()

  function handleLogout() {
    disconnect()
    router.push('/')
  }

  if (loading) {
    return (
      <section
        className="animate-pulse rounded-[1.5rem] border border-border bg-card"
        aria-hidden
      >
        <div className="h-12 border-b border-border bg-secondary/50" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-2/3 rounded bg-secondary" />
          <div className="h-4 w-full rounded bg-secondary" />
          <div className="h-4 w-5/6 rounded bg-secondary" />
        </div>
        <div className="h-14 border-t border-border bg-secondary/30" />
      </section>
    )
  }

  if (!wallet) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-card px-4 py-5 text-center">
        <UserRound className="mx-auto size-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-semibold text-foreground">Sin sesión Accesly</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Conecta tu wallet desde el inicio para ver tu cuenta aquí.
        </p>
        <Button asChild className="mt-4 h-11 w-full rounded-full font-bold">
          <Link href="/">Ir a conectar</Link>
        </Button>
      </section>
    )
  }

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Correo', value: wallet.email?.trim() || '—' },
    { label: 'Red', value: formatNetwork() },
    { label: 'Cuenta Stellar', value: maskAddress(wallet.stellarAddress), mono: true },
    { label: 'Clave pública', value: shortKey(wallet.publicKey), mono: true },
    { label: 'Contrato', value: shortKey(wallet.contractId), mono: true },
    {
      label: 'Balance XLM',
      value: balance != null && balance !== '' ? `${balance} XLM` : '—',
      mono: true,
    },
  ]

  if (wallet.createdAt) {
    try {
      const d = new Date(wallet.createdAt)
      if (!Number.isNaN(d.getTime())) {
        rows.push({
          label: 'Cuenta desde',
          value: new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium',
          }).format(d),
        })
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-black text-foreground ring-1 ring-border">
          {(wallet.email?.split('@')[0]?.slice(0, 2) ?? wallet.stellarAddress.slice(0, 2)).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">Tu perfil</h2>
          <p className="truncate text-xs text-muted-foreground">Accesly · Stellar</p>
        </div>
      </div>

      <dl className="divide-y divide-border px-4">
        {rows.map(({ label, value, mono }) => (
          <div key={label} className="grid gap-0.5 py-3 sm:grid-cols-[7.5rem_1fr] sm:items-baseline sm:gap-3">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd
              className={`text-sm font-semibold text-foreground break-all sm:break-normal ${mono ? 'font-mono text-[13px] font-medium tracking-tight' : ''}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-border p-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 rounded-full border-destructive/35 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" strokeWidth={2} />
          Cerrar sesión
        </Button>
      </div>
    </section>
  )
}
