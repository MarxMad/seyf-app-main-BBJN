import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitEtherfuseKycIdentityData } from '@/lib/etherfuse/kyc'
import { generateOnboardingPresignedUrlResolving409 } from '@/lib/etherfuse/onboarding'
import {
  getEtherfuseOnboardingSession,
  resolveOnboardingIds,
  saveEtherfuseOnboardingSession,
} from '@/lib/etherfuse/onboarding-session'
import { newEtherfuseOnboardingIds } from '@/lib/etherfuse/integration-model'
import {
  isValidStellarPublicKey,
  normalizeStellarPublicKey,
} from '@/lib/etherfuse/stellar-public-key'
import { AppError, toErrorResponse } from '@/lib/seyf/api-error'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const bodySchema = z.object({
  publicKey: z.string().trim().min(1),
  identity: z.object({
    id: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phoneNumber: z.string().trim().min(5).optional(),
    occupation: z.string().trim().min(2).optional(),
    name: z.object({
      givenName: z.string().trim().min(1),
      familyName: z.string().trim().min(1),
    }),
    dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    address: z.object({
      street: z.string().trim().min(1),
      city: z.string().trim().min(1),
      region: z.string().trim().min(1),
      postalCode: z.string().trim().min(1),
      country: z.string().trim().length(2),
    }),
    idNumbers: z
      .array(
        z.object({
          id: z.string().trim().min(1).optional(),
          type: z.string().trim().min(1),
          value: z.string().trim().min(1),
        }),
      )
      .min(1),
  }),
})

function mapKycProviderSetupError(message: string): AppError | null {
  const m = message.toLowerCase()
  if (m.includes('already added user with this address') || m.includes('see org:')) {
    return new AppError('validation_error', {
      statusCode: 409,
      retryable: false,
      message:
        'Esta wallet ya está vinculada a otra organización de Etherfuse. Usa una wallet nueva o alinea tu API key con la org correcta.',
    })
  }
  if (m.includes('organization not found')) {
    return new AppError('validation_error', {
      statusCode: 400,
      retryable: false,
      message:
        'No encontramos tu organización en Etherfuse para esta API key/entorno. Revisa ETHERFUSE_API_BASE_URL y ETHERFUSE_API_KEY.',
    })
  }
  return null
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => null)) as unknown
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      throw new AppError('validation_error', {
        statusCode: 400,
        retryable: false,
        message: `Invalid KYC payload: ${parsed.error.message}`,
      })
    }

    const publicKey = normalizeStellarPublicKey(parsed.data.publicKey)
    if (!isValidStellarPublicKey(publicKey)) {
      throw new AppError('validation_error', {
        statusCode: 400,
        retryable: false,
        message: 'Invalid Stellar public key.',
      })
    }

    const existing = await getEtherfuseOnboardingSession()
    const fresh = newEtherfuseOnboardingIds()
    const ids = resolveOnboardingIds(existing, publicKey, fresh)
    await saveEtherfuseOnboardingSession({
      customerId: ids.customerId,
      bankAccountId: ids.bankAccountId,
      publicKey,
    })
    // Ensure customer/bank-account context exists in Etherfuse before programmatic KYC submit.
    let resolved: { customerId: string; bankAccountId: string; presignedUrl: string }
    try {
      resolved = await generateOnboardingPresignedUrlResolving409({
        customerId: ids.customerId,
        bankAccountId: ids.bankAccountId,
        publicKey,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const mapped = mapKycProviderSetupError(msg)
      if (mapped) throw mapped
      throw e
    }
    await saveEtherfuseOnboardingSession({
      customerId: resolved.customerId,
      bankAccountId: resolved.bankAccountId,
      publicKey,
    })

    const submission = await submitEtherfuseKycIdentityData({
      customerId: resolved.customerId,
      pubkey: publicKey,
      identity: {
        ...parsed.data.identity,
        id: parsed.data.identity.id?.trim() || publicKey,
        ...(parsed.data.identity.email ? { email: parsed.data.identity.email.trim() } : {}),
        ...(parsed.data.identity.phoneNumber
          ? { phoneNumber: parsed.data.identity.phoneNumber.trim() }
          : {}),
        ...(parsed.data.identity.occupation
          ? { occupation: parsed.data.identity.occupation.trim() }
          : {}),
        idNumbers: parsed.data.identity.idNumbers.map((x) => ({
          id: x.id?.trim() || x.value.trim(),
          type: x.type.trim(),
          value: x.value.trim(),
        })),
        address: {
          ...parsed.data.identity.address,
          country: parsed.data.identity.address.country.toUpperCase(),
        },
      },
    })

    return NextResponse.json(
      {
        ok: true,
        status: submission.status,
        message: submission.message,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && e instanceof Error) {
      const base = toErrorResponse(e, 'kyc/submit')
      const body = (await base.json()) as { error?: unknown }
      return NextResponse.json(
        {
          ...(typeof body === 'object' && body ? body : {}),
          debug_message: e.message,
        },
        { status: base.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return toErrorResponse(e, 'kyc/submit')
  }
}
