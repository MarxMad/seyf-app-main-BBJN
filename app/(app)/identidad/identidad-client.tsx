'use client'

import Link from 'next/link'
import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EtherfuseKycSnapshot } from '@/lib/etherfuse/kyc'
import type { EtherfuseOnboardingSession } from '@/lib/etherfuse/onboarding-session'
import { resetKycTestSession } from './actions'
import { cn } from '@/lib/utils'
import { useSeyfWallet } from '@/lib/seyf/use-seyf-wallet'

function DevKycResetPanel({
  onAfterReset,
}: {
  onAfterReset: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="mt-8 rounded-[1.5rem] border border-dashed border-amber-500/25 bg-amber-500/[0.06] p-4">
      <p className="text-xs font-bold text-amber-200/90">Modo prueba</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Quita la sesión guardada en este navegador. El estado en Etherfuse sigue ligado a la misma
        cuenta Stellar: para un KYC «desde cero» usa otra clave en sandbox o borra el cliente/wallet en{' '}
        <span className="text-foreground/80">devnet</span>.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setMsg(null)
          startTransition(async () => {
            const r = await resetKycTestSession()
            if (!r.ok) {
              setMsg(r.error)
              return
            }
            onAfterReset()
          })
        }}
        className="mt-3 rounded-full border-border bg-transparent text-xs font-semibold text-foreground hover:bg-secondary"
      >
        {pending ? 'Reiniciando…' : 'Reiniciar prueba'}
      </Button>
      {msg && <p className="mt-2 text-xs text-destructive">{msg}</p>}
    </div>
  )
}

function formatApprovedDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { dateStyle: 'long' })
}

function VerifiedField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="border-b border-border py-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function kycSummary(status: EtherfuseKycSnapshot['status']): { title: string; tone: 'ok' | 'wait' | 'bad' | 'muted' } {
  switch (status) {
    case 'approved':
    case 'approved_chain_deploying':
      return { title: 'Identidad verificada', tone: 'ok' }
    case 'proposed':
      return { title: 'En revisión', tone: 'wait' }
    case 'rejected':
      return { title: 'No se pudo verificar', tone: 'bad' }
    case 'not_started':
    default:
      return { title: 'Falta completar el proceso', tone: 'muted' }
  }
}

export default function IdentidadClient({
  initialSession,
  initialKyc,
  allowKycTestReset,
}: {
  initialSession: EtherfuseOnboardingSession | null
  initialKyc: EtherfuseKycSnapshot | null
  allowKycTestReset: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [refreshing, setRefreshing] = useState(false)
  const { wallet, loading, connect } = useSeyfWallet()

  const approved =
    initialKyc?.status === 'approved' || initialKyc?.status === 'approved_chain_deploying'
  const inReview = initialKyc?.status === 'proposed'
  const canSubmitForm = !inReview

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const connectedPublicKey = wallet?.publicKey?.trim() ?? ''
      if (!connectedPublicKey) {
        setError('Primero inicia sesion con tu wallet para continuar con la verificacion.')
        return
      }
      const fd = new FormData(e.currentTarget as HTMLFormElement)
      const payload = {
        publicKey: connectedPublicKey,
        identity: {
          name: {
            givenName: String(fd.get('givenName') ?? ''),
            familyName: String(fd.get('familyName') ?? ''),
          },
          dateOfBirth: String(fd.get('dateOfBirth') ?? ''),
          address: {
            street: String(fd.get('street') ?? ''),
            city: String(fd.get('city') ?? ''),
            region: String(fd.get('region') ?? ''),
            postalCode: String(fd.get('postalCode') ?? ''),
            country: String(fd.get('country') ?? ''),
          },
          idNumbers: [
            {
              type: String(fd.get('idType') ?? ''),
              value: String(fd.get('idValue') ?? ''),
            },
          ],
        },
      }
      const http = await fetch('/api/seyf/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await http.json().catch(() => ({}))) as
        | { ok: true; status: string }
        | { error?: { message_es?: string } }
      if (!http.ok || !('ok' in json && json.ok)) {
        setError(json && 'error' in json && json.error?.message_es ? json.error.message_es : 'Error al enviar KYC.')
        return
      }
      setSuccess(`Datos enviados. Estado actual: ${json.status}.`)
      router.refresh()
    })
  }

  const refresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  if (approved && initialKyc) {
    const profile = initialKyc.verifiedProfile
    const approvedLabel = formatApprovedDate(initialKyc.approvedAt)
    const hasDetails =
      profile &&
      (profile.fullName || profile.email || profile.phoneNumber || profile.addressLine)

    return (
      <AppPageBody>
        <AppBackLink href="/dashboard" />

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
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
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
            Cuenta verificada
          </h1>
          <p className="mt-4 text-base text-muted-foreground font-normal">
            Tu identidad quedó confirmada. Ya puedes usar Seyf según los límites de tu cuenta.
          </p>
        </div>

        <div className="mb-8 rounded-[1.5rem] border border-border bg-card/50 p-5">
          <p className="text-sm font-bold text-foreground">Datos verificados</p>
          {hasDetails && profile ? (
            <div className="mt-1">
              <VerifiedField label="Nombre" value={profile.fullName} />
              <VerifiedField label="Correo" value={profile.email} />
              <VerifiedField label="Teléfono" value={profile.phoneNumber} />
              <VerifiedField label="Dirección" value={profile.addressLine} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Etherfuse aún no devolvió el detalle del perfil en esta respuesta; tu cuenta sigue
              verificada.
            </p>
          )}
          {approvedLabel && (
            <p className="mt-4 text-xs text-muted-foreground">
              Verificación efectiva: <span className="font-semibold text-foreground">{approvedLabel}</span>
            </p>
          )}
        </div>

        <div className="mb-8 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si actualizas datos en el futuro, te avisaremos desde la app.
          </p>
        </div>

        <Link href="/dashboard" className="block">
          <Button className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90">
            Volver al inicio
          </Button>
        </Link>

        {allowKycTestReset && (
          <DevKycResetPanel
            onAfterReset={() => {
              router.refresh()
            }}
          />
        )}
      </AppPageBody>
    )
  }

  const statusBlock = initialKyc ? kycSummary(initialKyc.status) : null

  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
          Verificar
          <br />
          identidad
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">
          Un proceso seguro para cumplir la regulación. Completa tus datos de identidad en Seyf para
          enviarlos a validación con Etherfuse.
        </p>
      </div>

      {(initialSession || initialKyc) && (
        <div className="mb-8 rounded-[1.5rem] border border-border bg-card/50 p-5">
          {statusBlock && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground">Estado</p>
              <p
                className={cn(
                  'mt-1 text-sm font-bold text-foreground',
                  statusBlock.tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                  statusBlock.tone === 'wait' && 'text-amber-200/90',
                  statusBlock.tone === 'bad' && 'text-destructive',
                )}
              >
                {statusBlock.title}
              </p>
              {initialKyc?.status === 'rejected' && initialKyc.currentRejectionReason && (
                <p className="mt-2 text-sm text-muted-foreground">{initialKyc.currentRejectionReason}</p>
              )}
            </div>
          )}
          {!initialKyc && initialSession && (
            <p className="mb-4 text-sm text-muted-foreground">
              Guardamos tu sesión en este dispositivo. Cuando completes el portal, pulsa actualizar.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={refresh}
            className="rounded-full border-border bg-transparent font-semibold text-foreground hover:bg-secondary"
          >
            {refreshing ? 'Actualizando…' : 'Actualizar estado'}
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-[1.25rem] border border-border bg-secondary p-4">
          <p className="text-xs font-medium text-muted-foreground">Wallet Stellar</p>
          <p className="mt-2 text-sm text-foreground">
            {wallet?.publicKey
              ? `Usaremos tu wallet conectada: ${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
              : 'Conecta tu wallet para iniciar la verificacion de identidad.'}
          </p>
          {!wallet?.publicKey ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-full"
              disabled={loading}
              onClick={() => void connect()}
            >
              {loading ? 'Cargando wallet...' : 'Conectar wallet'}
            </Button>
          ) : null}
        </div>
        {inReview ? (
          <div className="rounded-[1rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Tu verificación está en revisión. Mientras tanto, no es necesario reenviar datos.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="givenName" placeholder="Nombre(s)" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
          <Input name="familyName" placeholder="Apellido(s)" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
        </div>
        <Input
          name="dateOfBirth"
          type="date"
          required
          className="h-12 rounded-xl"
          aria-label="Fecha de nacimiento"
          disabled={!canSubmitForm}
        />
        <Input name="street" placeholder="Calle y número" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="city" placeholder="Ciudad" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
          <Input name="region" placeholder="Estado" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="postalCode" placeholder="Código postal" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
          <Input
            name="country"
            placeholder="País ISO-2 (MX)"
            defaultValue="MX"
            required
            className="h-12 rounded-xl uppercase"
            disabled={!canSubmitForm}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="idType" placeholder="Tipo de ID (RFC/CURP)" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
          <Input name="idValue" placeholder="Número de ID" required className="h-12 rounded-xl" disabled={!canSubmitForm} />
        </div>

        {error && (
          <p className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-[1.25rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending || !wallet?.publicKey || !canSubmitForm}
          className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all hover:bg-foreground/90 disabled:opacity-40"
        >
          {pending ? 'Enviando…' : inReview ? 'En revisión' : 'Enviar verificación'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Revisaremos tu estado automáticamente cuando Etherfuse actualice la validación.
      </p>

      {allowKycTestReset && (
        <DevKycResetPanel
          onAfterReset={() => {
            router.refresh()
          }}
        />
      )}
    </AppPageBody>
  )
}
