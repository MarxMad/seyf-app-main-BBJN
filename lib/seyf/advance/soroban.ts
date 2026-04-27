import { 
  BASE_FEE, 
  Horizon, 
  Networks, 
  TransactionBuilder 
} from '@stellar/stellar-sdk'

const RATE_BPS_DENOMINATOR = 10_000n
const BUFFER_BPS = 1_000n

export type AdvanceQuote = {
  principal_mxn: bigint
  rate_bps: bigint
  days_elapsed: number
  days_total: number
  fee_flat_mxn: bigint
  projected_yield_mxn: bigint
  buffer_mxn: bigint
  max_advance_mxn: bigint
}

export type AdvanceResult = {
  success: boolean
  stellar_tx_hash?: string
  error_code?: number
  record?: any
}

export class SorobanAdvanceClient {
  calculateQuote(
    principal_mxn: number,
    rate_bps: number,
    days_elapsed: number,
    days_total: number,
    fee_flat_mxn: number
  ): AdvanceQuote {
    const p = BigInt(Math.floor(principal_mxn))
    const r = BigInt(Math.floor(rate_bps))
    const de = BigInt(days_elapsed)
    const dt = BigInt(days_total)
    const f = BigInt(Math.floor(fee_flat_mxn))

    if (dt === 0n) throw new Error("days_total cannot be zero")

    const projected_yield_mxn = (p * r * de) / (RATE_BPS_DENOMINATOR * dt)
    const buffer_mxn = (projected_yield_mxn * BUFFER_BPS) / RATE_BPS_DENOMINATOR
    
    let max_after_buffer_mxn = projected_yield_mxn - buffer_mxn
    if (max_after_buffer_mxn < 0n) max_after_buffer_mxn = 0n

    const max_advance_mxn = f >= max_after_buffer_mxn ? 0n : max_after_buffer_mxn - f

    return {
      principal_mxn: p,
      rate_bps: r,
      days_elapsed,
      days_total,
      fee_flat_mxn: f,
      projected_yield_mxn,
      buffer_mxn,
      max_advance_mxn
    }
  }

  async executeAdvance(
    userId: string,
    cycleId: string,
    amountMxn: number,
    quote: AdvanceQuote
  ): Promise<AdvanceResult> {
    await new Promise(r => setTimeout(r, 1000))

    if (BigInt(Math.floor(amountMxn)) > quote.max_advance_mxn) {
      return { success: false, error_code: 3 }
    }

    const mockHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')

    return {
      success: true,
      stellar_tx_hash: mockHash,
      record: {
        cycle_id: cycleId,
        approved_mxn: amountMxn,
        stellar_tx_hash: mockHash
      }
    }
  }
}
