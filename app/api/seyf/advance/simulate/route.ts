import { NextResponse } from 'next/server'
import { getOrCreatePocUserId } from '@/lib/seyf/poc-user-cookie'
import { simulateAdvance } from '@/lib/seyf/advance/engine'
import { toErrorResponse } from '@/lib/seyf/api-error'

export async function GET() {
  try {
    const { userId } = await getOrCreatePocUserId()
    const result = await simulateAdvance(userId)
    
    return NextResponse.json(result)
  } catch (e) {
    return toErrorResponse(e, 'advance/simulate')
  }
}
