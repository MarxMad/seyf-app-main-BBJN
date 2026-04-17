'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, RefreshCw, Landmark, AlertCircle, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSeyfWallet } from '@/lib/seyf/use-seyf-wallet'
import {
  type ClabeRecord,
  formatCLABE,
  validateCLABE,
  createUserClabe,
  getOrCreateClabe,
} from '@/lib/seyf/bitso-service'

// ─── tipos ───────────────────────────────────────────────────────────────────

type Props = {
  /** CLABE inicial pre-cargada desde servidor (puede ser null si el usuario aún no tiene). */
  initialClabe?: ClabeRecord | null
  className?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function ClabeSegments({ clabe }: { clabe: string }) {
  const formatted = formatCLABE(clabe)
  const parts = formatted.split(' ')
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
      {parts.map((segment, i) => (
        <span
          key={i}
          className={cn(
            'font-mono font-black tabular-nums leading-none tracking-widest',
            i < parts.length - 1
              ? 'text-[1.65rem] text-foreground sm:text-[1.9rem]'
              : 'text-[1.65rem] text-foreground/80 sm:text-[1.9rem]',
          )}
        >
          {segment}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: 'ENABLED' | 'DISABLED' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        status === 'ENABLED'
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
          : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'ENABLED' ? 'bg-emerald-400' : 'bg-muted-foreground',
        )}
      />
      {status === 'ENABLED' ? 'Activa' : 'Inactiva'}
    </span>
  )
}

// ─── sub-card vacío (sin CLABE) ───────────────────────────────────────────────

function EmptyState({
  onCrear,
  creating,
  error,
}: {
  onCrear: () => void
  creating: boolean
  error: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-5 px-2 py-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary/80 ring-1 ring-border">
        <Landmark className="size-6 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Aún no tienes una CLABE</p>
        <p className="text-[13px] leading-snug text-muted-foreground">
          Crea tu cuenta CLABE para recibir depósitos SPEI desde cualquier banco mexicano.
        </p>
      </div>
      {error && (
        <div className="flex w-full items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-left text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={onCrear}
        disabled={creating}
        className="h-11 w-full max-w-xs rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
      >
        {creating ? (
          <>
            <RefreshCw className="size-4 animate-spin" />
            Creando CLABE…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Obtener mi CLABE
          </>
        )}
      </Button>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export function ClabeDisplayCard({ initialClabe = null, className }: Props) {
  const { wallet } = useSeyfWallet()
  const [clabe, setClabe] = useState<ClabeRecord | null>(initialClabe)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const stellarAddress = wallet?.stellarAddress ?? null
  const isValid = clabe ? validateCLABE(clabe.clabe) : false

  async function handleCopy() {
    if (!clabe) return
    try {
      await navigator.clipboard.writeText(clabe.clabe)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard API no disponible — fallback silencioso
    }
  }

  function handleCrear() {
    if (!stellarAddress) {
      setError('Conecta tu wallet Stellar antes de crear una CLABE.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const nueva = await getOrCreateClabe(stellarAddress)
        setClabe(nueva)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error creando CLABE')
      }
    })
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border border-border',
        className,
      )}
      aria-label="Tu CLABE para depósitos SPEI"
    >
      {/* fondo degradado */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-950/80 via-card to-blue-950/60" />

      {/* glows */}
      <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-blue-500/15 blur-3xl" />

      {/* patrón de rombos (igual al hero) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative px-5 pb-6 pt-5">
        {/* cabecera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
              <Landmark className="size-4 text-foreground/80" strokeWidth={1.75} />
            </div>
            <span className="text-[13px] font-semibold text-muted-foreground">
              CLABE interbancaria
            </span>
          </div>
          {clabe && <StatusBadge status={clabe.status} />}
        </div>

        {/* cuerpo */}
        <div className="mt-5">
          {/* wallet no conectada */}
          {!stellarAddress && !clabe ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary/80 ring-1 ring-border">
                <Wallet className="size-5 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-[13px] leading-snug text-muted-foreground">
                Conecta tu wallet Stellar para ver o crear tu CLABE.
              </p>
            </div>
          ) : !clabe ? (
            <EmptyState onCrear={handleCrear} creating={isPending} error={error} />
          ) : (
            <div className="space-y-5">
              {/* CLABE grande */}
              <div className="space-y-3 text-center">
                <ClabeSegments clabe={clabe.clabe} />
                {!isValid && (
                  <p className="flex items-center justify-center gap-1 text-[11px] text-amber-400/90">
                    <AlertCircle className="size-3" />
                    Dígito verificador inválido
                  </p>
                )}
              </div>

              {/* botones de acción */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="h-10 gap-2 rounded-full px-5 ring-1 ring-border/60 transition-all"
                  aria-label="Copiar CLABE"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copiar CLABE
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCrear}
                  disabled={isPending}
                  className="size-10 rounded-full"
                  title="Crear nueva CLABE"
                  aria-label="Crear nueva CLABE"
                >
                  <RefreshCw className={cn('size-4', isPending && 'animate-spin')} />
                </Button>
              </div>

              {/* separador */}
              <div className="mx-auto h-px w-full bg-border/50" />

              {/* instrucciones SPEI */}
              <div className="space-y-3">
                <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Instrucciones para transferir
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <SpeiRow label="Banco receptor" value="Juno / Bitso" />
                  <SpeiRow
                    label="Wallet vinculada"
                    value={
                      stellarAddress
                        ? `${stellarAddress.slice(0, 6)}…${stellarAddress.slice(-4)}`
                        : 'Tu cuenta Seyf'
                    }
                  />
                  <SpeiRow
                    label="Monto mínimo"
                    value={
                      clabe.deposit_minimum_amount != null
                        ? `$${clabe.deposit_minimum_amount.toLocaleString('es-MX')} MXN`
                        : 'Sin mínimo'
                    }
                  />
                  <SpeiRow
                    label="Disponible en"
                    value="Inmediato (SPEI 24/7)"
                  />
                </div>

                {/* límites si existen */}
                {clabe.deposit_maximum_amounts.daily != null && (
                  <div className="rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      Límites de depósito
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                      {clabe.deposit_maximum_amounts.operation != null && (
                        <LimitRow
                          label="Por operación"
                          value={clabe.deposit_maximum_amounts.operation}
                        />
                      )}
                      {clabe.deposit_maximum_amounts.daily != null && (
                        <LimitRow label="Diario" value={clabe.deposit_maximum_amounts.daily} />
                      )}
                      {clabe.deposit_maximum_amounts.weekly != null && (
                        <LimitRow label="Semanal" value={clabe.deposit_maximum_amounts.weekly} />
                      )}
                      {clabe.deposit_maximum_amounts.monthly != null && (
                        <LimitRow label="Mensual" value={clabe.deposit_maximum_amounts.monthly} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── piezas pequeñas ─────────────────────────────────────────────────────────

function SpeiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

function LimitRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold tabular-nums text-foreground">
        ${value.toLocaleString('es-MX')}
      </span>
    </>
  )
}
