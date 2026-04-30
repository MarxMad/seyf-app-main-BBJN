import { NextResponse } from 'next/server'
import { AppError, toErrorResponse } from '@/lib/seyf/api-error'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=MXN&to=USD,EUR'

type FxResponse = {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

export async function GET() {
  try {
    const upstream = await fetch(FRANKFURTER_URL, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!upstream.ok) {
      throw new AppError('provider_unavailable', {
        statusCode: 502,
        retryable: true,
        message: `Frankfurter upstream failed with HTTP ${upstream.status}`,
      })
    }

    const payload = (await upstream.json()) as FxResponse
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  } catch (e) {
    return toErrorResponse(e, 'fx/latest')
  }
}

