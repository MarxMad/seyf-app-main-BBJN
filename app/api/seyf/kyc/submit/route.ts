import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitEtherfuseKycIdentityData } from '@/lib/etherfuse/kyc'
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

    const submission = await submitEtherfuseKycIdentityData({
      customerId: ids.customerId,
      pubkey: publicKey,
      identity: {
        ...parsed.data.identity,
        idNumbers: parsed.data.identity.idNumbers.map((x) => ({
          id: x.id?.trim() || `${x.type.trim().toUpperCase()}-${x.value.trim()}`,
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
    return toErrorResponse(e, 'kyc/submit')
  }
}
