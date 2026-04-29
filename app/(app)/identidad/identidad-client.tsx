'use client'

import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { AppBackLink } from '@/components/app/app-back-link'
import { AppPageBody } from '@/components/app/app-page-body'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EtherfuseKycSnapshot } from '@/lib/etherfuse/kyc'
import type { EtherfuseOnboardingSession } from '@/lib/etherfuse/onboarding-session'
import { resetKycTestSession } from './actions'
import { cn } from '@/lib/utils'
import { useSeyfWallet } from '@/lib/seyf/use-seyf-wallet'
import { useEnsureCetesTrustline } from '@/lib/seyf/use-ensure-cetes-trustline'

const KYC_PENDING_UI_KEY = 'seyf_kyc_pending_ui'
const MAX_FILE_BYTES = 10 * 1024 * 1024

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No pudimos convertir el archivo.'))
        return
      }
      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function validateImageFile(file: File | null, label: string): string | null {
  if (!file) return `${label} es requerido.`
  const allowed = ['image/jpeg', 'image/png']
  if (!allowed.includes(file.type)) return `${label} debe ser JPG o PNG.`
  if (file.size > MAX_FILE_BYTES) return `${label} excede 10MB.`
  return null
}

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

function kycStatusHint(status: EtherfuseKycSnapshot['status']): string {
  switch (status) {
    case 'proposed':
      return 'Tu información ya fue enviada. La validación puede tardar unos minutos.'
    case 'rejected':
      return 'Revisa tus datos y vuelve a enviar la verificación.'
    case 'approved':
    case 'approved_chain_deploying':
      return 'Tu verificación está aprobada.'
    case 'not_started':
    default:
      return 'Completa el formulario para iniciar tu verificación.'
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastErrorDetail, setLastErrorDetail] = useState<string | null>(null)
  const [docUploadError, setDocUploadError] = useState<string | null>(null)
  const [kycState, setKycState] = useState<EtherfuseKycSnapshot | null>(initialKyc)
  const [pendingConfirmation, setPendingConfirmation] = useState(initialKyc?.status === 'proposed')
  const [pending, startTransition] = useTransition()
  const [refreshing, setRefreshing] = useState(false)
  const { wallet, loading, connect } = useSeyfWallet()
  const { ensure: ensureCetesTrustline, busy: trustlineBusy } = useEnsureCetesTrustline()
  const [trustlineStatus, setTrustlineStatus] = useState<'idle' | 'done' | 'error'>('idle')

  const approved =
    kycState?.status === 'approved' || kycState?.status === 'approved_chain_deploying'
  const inReview = kycState?.status === 'proposed'
  const showPendingScreen = inReview || pendingConfirmation
  const rejected = kycState?.status === 'rejected'
  const canSubmitForm = !inReview
  const statusHint = useMemo(
    () => (kycState ? kycStatusHint(kycState.status) : 'Completa tus datos para validar identidad.'),
    [kycState],
  )

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(KYC_PENDING_UI_KEY)
      if (stored === '1') {
        setPendingConfirmation(true)
      }
    } catch {
      // noop
    }
  }, [])

  useEffect(() => {
    if (!approved || trustlineStatus !== 'idle') return
    void ensureCetesTrustline().then((r) => {
      setTrustlineStatus(r.ok ? 'done' : 'error')
      if (!r.ok) console.warn('[identidad] trustline CETES:', r.error)
    })
  }, [approved, trustlineStatus, ensureCetesTrustline])

  const runRefresh = useCallback(
    async (origin: 'submit' | 'button' | 'reset') => {
      const res = await fetch('/api/seyf/kyc/status', { cache: 'no-store' })
      const data = (await res.json().catch(() => ({}))) as { kyc?: EtherfuseKycSnapshot | null }
      if (res.ok) {
        const next = data.kyc ?? null
        if (next?.status === 'proposed') {
          setPendingConfirmation(true)
          try {
            window.sessionStorage.setItem(KYC_PENDING_UI_KEY, '1')
          } catch {
            // noop
          }
        }
        if (next && (next.status === 'approved' || next.status === 'approved_chain_deploying' || next.status === 'rejected')) {
          setPendingConfirmation(false)
          try {
            window.sessionStorage.removeItem(KYC_PENDING_UI_KEY)
          } catch {
            // noop
          }
        }
        setKycState((prev) => {
          if (!next && (pendingConfirmation || prev?.status === 'proposed')) return prev
          return next
        })
      } else {
        console.warn('[identidad] status refresh failed', { origin, status: res.status })
      }
    },
    [pendingConfirmation],
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLastErrorDetail(null)
    setDocUploadError(null)
    startTransition(async () => {
      const connectedPublicKey = wallet?.publicKey?.trim() ?? ''
      if (!connectedPublicKey) {
        setError('Primero inicia sesion con tu wallet para continuar con la verificacion.')
        return
      }
      const fd = new FormData(e.currentTarget as HTMLFormElement)
      const idFrontFile = (fd.get('idFront') as File | null) ?? null
      const idBackFile = (fd.get('idBack') as File | null) ?? null
      const selfieFile = (fd.get('selfie') as File | null) ?? null

      const frontErr = validateImageFile(idFrontFile, 'Frente de identificación')
      const backErr = validateImageFile(idBackFile, 'Reverso de identificación')
      const selfieErr = validateImageFile(selfieFile, 'Selfie')
      const validationErr = frontErr ?? backErr ?? selfieErr
      if (validationErr) {
        setDocUploadError(validationErr)
        return
      }

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
        | { ok: true; status: string; message?: string | null }
        | { error?: { message_es?: string }; debug_message?: string }
      if (!http.ok || !('ok' in json && json.ok)) {
        const debugDetail =
          json && typeof json === 'object' && 'debug_message' in json && typeof json.debug_message === 'string'
            ? json.debug_message
            : null
        if (debugDetail) setLastErrorDetail(debugDetail)
        console.warn('[identidad] KYC submit failed', {
          status: http.status,
          response: json,
          payload,
        })
        setError(json && 'error' in json && json.error?.message_es ? json.error.message_es : 'Error al enviar KYC.')
        return
      }
      let documentsStatus = json.status
      try {
        const [idFront, idBack, selfie] = await Promise.all([
          fileToDataUrl(idFrontFile as File),
          fileToDataUrl(idBackFile as File),
          fileToDataUrl(selfieFile as File),
        ])
        const docsRes = await fetch('/api/seyf/kyc/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: connectedPublicKey,
            document: {
              idFront: { label: 'id_front', image: idFront },
              idBack: { label: 'id_back', image: idBack },
            },
            selfie: { label: 'selfie', image: selfie },
          }),
        })
        const docsJson = (await docsRes.json().catch(() => ({}))) as {
          ok?: boolean
          status?: string
          error?: { message_es?: string }
          debug_message?: string
        }
        if (!docsRes.ok || !docsJson.ok) {
          const detail = docsJson.debug_message
          if (detail) setLastErrorDetail(detail)
          setDocUploadError(
            docsJson.error?.message_es ??
              'No pudimos subir tus documentos. Reintenta con imágenes claras.',
          )
          return
        }
        if (docsJson.status) documentsStatus = docsJson.status
      } catch (uploadErr) {
        setDocUploadError(
          uploadErr instanceof Error
            ? uploadErr.message
            : 'No pudimos procesar tus imágenes para KYC.',
        )
        return
      }

      setSuccess(`Datos y documentos enviados. Estado actual: ${documentsStatus}.`)
      if (
        documentsStatus === 'proposed' ||
        documentsStatus === 'approved' ||
        documentsStatus === 'approved_chain_deploying' ||
        documentsStatus === 'rejected'
      ) {
        if (documentsStatus === 'proposed') {
          setPendingConfirmation(true)
          try {
            window.sessionStorage.setItem(KYC_PENDING_UI_KEY, '1')
          } catch {
            // noop
          }
        }
        if (
          documentsStatus === 'approved' ||
          documentsStatus === 'approved_chain_deploying' ||
          documentsStatus === 'rejected'
        ) {
          setPendingConfirmation(false)
          try {
            window.sessionStorage.removeItem(KYC_PENDING_UI_KEY)
          } catch {
            // noop
          }
        }
        setKycState((prev) =>
          prev
            ? { ...prev, status: documentsStatus as EtherfuseKycSnapshot['status'] }
            : {
                customerId: '',
                walletPublicKey: connectedPublicKey,
                status: documentsStatus as EtherfuseKycSnapshot['status'],
                approvedAt: null,
                currentRejectionReason: null,
                verifiedProfile: null,
                documentsCount: 0,
                selfiesCount: 0,
              },
        )
      }
      void runRefresh('submit')
    })
  }

  const refresh = () => {
    setRefreshing(true)
    void runRefresh('button').finally(() => {
      setRefreshing(false)
    })
  }

  if (approved && kycState) {
    const profile = kycState.verifiedProfile
    const approvedLabel = formatApprovedDate(kycState.approvedAt)
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

        {trustlineBusy && (
          <div className="mb-4 rounded-[1.5rem] border border-blue-500/20 bg-blue-500/[0.07] p-4">
            <p className="text-sm text-muted-foreground">Configurando activos en tu wallet…</p>
          </div>
        )}
        {trustlineStatus === 'error' && (
          <div className="mb-4 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/[0.07] p-4">
            <p className="text-sm text-muted-foreground">
              No se pudo agregar CETES a tu wallet automaticamente.
              Puedes hacerlo manualmente desde la configuracion de tu wallet.
            </p>
          </div>
        )}

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
              void runRefresh('reset')
            }}
          />
        )}
      </AppPageBody>
    )
  }

  if (showPendingScreen) {
    return (
      <AppPageBody>
        <AppBackLink href="/dashboard" />

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-400/30">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
            Verificación pendiente
          </h1>
          <p className="mt-4 text-base text-muted-foreground font-normal">
            Tu información ya fue enviada correctamente y está en proceso de aprobación.
          </p>
        </div>

        <div className="mb-6 rounded-[1.5rem] border border-[#bfd6ca] bg-gradient-to-br from-[#edf6f2] via-[#e5efea] to-[#d6e3dd] p-5 dark:border-[#2b4a43] dark:bg-gradient-to-br dark:from-[#0f3b36] dark:via-[#15534a] dark:to-[#1b5b50]">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
            Estado actual: pendiente de aprobación
          </p>
          <p className="mt-2 text-sm text-[#4f6b5f] dark:text-[#d2e9df]">
            Etherfuse está validando tus datos. Esto puede tardar algunos minutos.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={refresh}
          className="h-12 w-full rounded-full border-border bg-transparent font-semibold text-foreground hover:bg-secondary"
        >
          {refreshing ? 'Actualizando…' : 'Actualizar estado'}
        </Button>

        <Link href="/dashboard" className="mt-3 block">
          <Button className="h-12 w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90">
            Volver al inicio
          </Button>
        </Link>

        {allowKycTestReset && (
          <DevKycResetPanel
            onAfterReset={() => {
              void runRefresh('reset')
            }}
          />
        )}
      </AppPageBody>
    )
  }

  const statusBlock = kycState ? kycSummary(kycState.status) : null

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

      {(initialSession || kycState) && (
        <div className="mb-8 rounded-[1.5rem] border border-border bg-card/50 p-5">
          {statusBlock ? (
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
              {kycState?.status === 'rejected' && kycState.currentRejectionReason && (
                <p className="mt-2 text-sm text-muted-foreground">{kycState.currentRejectionReason}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{statusHint}</p>
            </div>
          ) : null}
          {!kycState && initialSession && (
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

      {rejected ? (
        <section className="mb-6 rounded-[1.25rem] border border-destructive/30 bg-destructive/10 px-4 py-4">
          <p className="text-sm font-bold text-destructive">Verificación fallida</p>
          <p className="mt-1 text-sm text-destructive/90">
            Revisa tus datos y vuelve a enviar la verificación.
          </p>
        </section>
      ) : null}

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
        <section className="rounded-[1.25rem] border border-border bg-card/50 p-4">
          <p className="text-sm font-bold text-foreground">Documentos KYC</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sube imágenes claras (JPG/PNG, máximo 10MB): frente, reverso y selfie.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input
              name="idFront"
              type="file"
              accept="image/jpeg,image/png"
              required
              className="h-12 rounded-xl"
              disabled={!canSubmitForm}
              aria-label="Frente de identificación"
            />
            <Input
              name="idBack"
              type="file"
              accept="image/jpeg,image/png"
              required
              className="h-12 rounded-xl"
              disabled={!canSubmitForm}
              aria-label="Reverso de identificación"
            />
            <Input
              name="selfie"
              type="file"
              accept="image/jpeg,image/png"
              required
              className="h-12 rounded-xl"
              disabled={!canSubmitForm}
              aria-label="Selfie"
            />
          </div>
        </section>

        {error && (
          <section className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 px-4 py-4">
            <p className="text-sm font-semibold text-destructive">No pudimos enviar tu verificación</p>
            <p className="mt-1 text-sm text-destructive">{error}</p>
            {lastErrorDetail ? (
              <p className="mt-2 text-xs text-destructive/80">
                Detalle técnico: {lastErrorDetail}
              </p>
            ) : null}
          </section>
        )}
        {docUploadError && (
          <section className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 px-4 py-4">
            <p className="text-sm font-semibold text-destructive">No pudimos subir tus documentos</p>
            <p className="mt-1 text-sm text-destructive">{docUploadError}</p>
          </section>
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
        {inReview
          ? 'Tu estado está en revisión. Pulsa "Actualizar estado" para consultar cambios.'
          : 'Cuando envíes tus datos, verás aquí el estado de validación.'}
      </p>

      {allowKycTestReset && (
        <DevKycResetPanel
          onAfterReset={() => {
            void runRefresh('reset')
          }}
        />
      )}
    </AppPageBody>
  )
}
