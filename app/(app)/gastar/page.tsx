'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AppPageBody } from '@/components/app/app-page-body'
import { cn } from '@/lib/utils'
import { AppBackLink } from '@/components/app/app-back-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SALDO_GASTO = 350

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

const backBtnClass =
  'mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground'

export default function GastarPage() {
  const [modo, setModo] = useState<'menu' | 'qr' | 'retiro' | 'exito'>('menu')
  const [clabe, setClabe] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRetiro = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setModo('exito')
    }, 1600)
  }

  if (modo === 'exito') {
    return (
      <AppPageBody className="flex min-h-[70vh] flex-col items-center justify-center text-center">
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
        <h2 className="mb-3 text-4xl font-black tracking-tight text-foreground leading-none">
          Retiro en
          <br />
          proceso
        </h2>
        <p className="max-w-xs text-base text-muted-foreground font-normal">
          Tu transferencia SPEI está en camino. Puede tardar unos minutos en acreditarse.
        </p>
        <Link href="/dashboard" className="mt-8 w-full max-w-sm">
          <Button className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90">
            Volver al inicio
          </Button>
        </Link>
      </AppPageBody>
    )
  }

  if (modo === 'qr') {
    return (
      <AppPageBody className="flex min-h-[60vh] flex-col">
        <button type="button" onClick={() => setModo('menu')} className={backBtnClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Regresar
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
            Pagar
            <br />
            con QR
          </h1>
          <p className="mt-4 text-base text-muted-foreground font-normal">
            Escanea el código QR del comercio para pagar con tu saldo.
          </p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-[1.5rem] border-2 border-border bg-secondary">
            <div className="absolute left-3 top-3 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-foreground" />
            <div className="absolute right-3 top-3 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-foreground" />
            <div className="absolute bottom-3 left-3 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-foreground" />
            <div className="absolute bottom-3 right-3 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-foreground" />
            <p className="px-8 text-center text-sm text-muted-foreground">Apunta la cámara al QR del comercio</p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Saldo disponible:{' '}
            <span className="font-bold text-foreground">{formatMXN(SALDO_GASTO)}</span>
          </p>
        </div>
      </AppPageBody>
    )
  }

  if (modo === 'retiro') {
    return (
      <AppPageBody>
        <button type="button" onClick={() => setModo('menu')} className={backBtnClass}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Regresar
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
            Retirar
            <br />
            a banco
          </h1>
          <p className="mt-4 text-base text-muted-foreground font-normal">
            Recibe tu saldo en cualquier cuenta bancaria vía SPEI.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-[1.5rem] border border-border bg-secondary p-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Disponible para retirar</p>
            <p className="text-3xl font-black tabular-nums tracking-tight text-foreground">{formatMXN(SALDO_GASTO)}</p>
          </div>
        </div>

        <form onSubmit={handleRetiro} className="space-y-4">
          <Input
            type="text"
            placeholder="CLABE interbancaria (18 dígitos)"
            value={clabe}
            onChange={(e) => setClabe(e.target.value)}
            maxLength={18}
            required
            className="h-14 rounded-full border-0 bg-secondary px-6 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
          />
          <div className="space-y-2 rounded-[1.25rem] border border-border bg-card/50 p-4">
            <SummaryRow label="Monto a retirar" value={formatMXN(SALDO_GASTO)} />
            <SummaryRow label="Comisión SPEI" value="$0.00" dim />
            <div className="border-t border-border pt-2">
              <SummaryRow label="Recibes en tu banco" value={formatMXN(SALDO_GASTO)} bold />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || clabe.length < 18}
            className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90 disabled:opacity-40"
          >
            {loading ? 'Enviando…' : 'Confirmar retiro'}
          </Button>
        </form>
      </AppPageBody>
    )
  }

  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
          Usar
          <br />
          mi adelanto
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">Elige cómo quieres usar tu saldo disponible.</p>
      </div>

      <div className="mb-8 rounded-[1.5rem] border border-border bg-gradient-to-br from-violet-600/40 to-indigo-900/50 p-6">
        <p className="text-sm font-medium text-white/80">Saldo para gastar</p>
        <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-white">{formatMXN(SALDO_GASTO)}</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setModo('qr')}
          className="flex w-full items-center justify-between rounded-[1.5rem] border border-border bg-secondary p-5 text-left transition hover:bg-muted"
        >
          <div>
            <p className="text-lg font-black text-foreground">Pagar con QR</p>
            <p className="mt-1 text-sm text-muted-foreground">En comercios que aceptan pagos digitales.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M17 21h3M21 17v3" />
            </svg>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setModo('retiro')}
          className="flex w-full items-center justify-between rounded-[1.5rem] border border-border bg-secondary p-5 text-left transition hover:bg-muted"
        >
          <div>
            <p className="text-lg font-black text-foreground">Retirar a banco</p>
            <p className="mt-1 text-sm text-muted-foreground">Recibe en tu cuenta bancaria vía SPEI.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 12 19 12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </div>
        </button>
      </div>
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
    <div className="flex items-center justify-between">
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
