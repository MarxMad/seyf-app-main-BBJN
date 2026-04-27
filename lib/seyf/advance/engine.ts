import { SorobanAdvanceClient } from './soroban'
import { createAdvanceRecord, getAdvanceByCycle, updateAdvanceRecord } from './store'
import { getPocLedgerSnapshot, pocLedgerDebit, pocLedgerCredit } from '../poc-omnibus-ledger'
import { getLedgerMeta } from '../investment-mvp'

const soroban = new SorobanAdvanceClient()

const MOCK_RATE_BPS = 980
const MOCK_FEE_MXN = 25
const CYCLE_DAYS = 28

export type SimulationResult = {
  advance_available: boolean
  max_advance_mxn?: number
  fee_mxn?: number
  net_to_user_mxn?: number
  cycle_end_date?: string
  error?: "advance_already_used" | "no_active_cycle" | string
}

export async function simulateAdvance(userId: string): Promise<SimulationResult> {
  const { activeCycleId } = await getLedgerMeta()
  if (!activeCycleId) {
    return { advance_available: false, error: "no_active_cycle" }
  }

  const existing = await getAdvanceByCycle(userId, activeCycleId)
  if (existing) {
    return { advance_available: true, error: "advance_already_used" }
  }

  const { balanceMxn } = getPocLedgerSnapshot(userId)
  if (balanceMxn <= 0) {
    return { advance_available: false, max_advance_mxn: 0 }
  }

  const quote = soroban.calculateQuote(
    balanceMxn,
    MOCK_RATE_BPS,
    14,
    CYCLE_DAYS,
    MOCK_FEE_MXN
  )

  const max_advance_mxn = Number(quote.max_advance_mxn)
  
  const d = new Date()
  d.setDate(d.getDate() + 14)

  return {
    advance_available: true,
    max_advance_mxn,
    fee_mxn: MOCK_FEE_MXN,
    net_to_user_mxn: max_advance_mxn,
    cycle_end_date: d.toISOString()
  }
}

export async function confirmAdvance(userId: string, amountMxn: number, idempotencyKey?: string) {
  const { activeCycleId } = await getLedgerMeta()
  if (!activeCycleId) throw new Error("No active cycle")

  const existing = await getAdvanceByCycle(userId, activeCycleId)
  if (existing) return existing

  if (amountMxn < 100) throw new Error("Monto mínimo 100 MXN")

  const simulation = await simulateAdvance(userId)
  if (simulation.error) throw new Error(simulation.error)
  if (!simulation.max_advance_mxn || amountMxn > simulation.max_advance_mxn) {
    throw new Error("Monto excede el límite permitido")
  }

  const { balanceMxn } = getPocLedgerSnapshot(userId)
  const quote = soroban.calculateQuote(
    balanceMxn,
    MOCK_RATE_BPS,
    14,
    CYCLE_DAYS,
    MOCK_FEE_MXN
  )

  const record = await createAdvanceRecord({
    user_id: userId,
    cycle_id: activeCycleId,
    amount_mxn: amountMxn,
    fee_mxn: MOCK_FEE_MXN,
    net_mxn: amountMxn,
  })

  try {
    const result = await soroban.executeAdvance(userId, activeCycleId, amountMxn, quote)
    
    if (result.success) {
      pocLedgerCredit(userId, amountMxn, `Adelanto de rendimiento (Ciclo ${activeCycleId})`)
      pocLedgerDebit(userId, MOCK_FEE_MXN, `Comisión por adelanto`)

      await updateAdvanceRecord(record.id, {
        status: 'completed',
        stellar_tx_hash: result.stellar_tx_hash
      })
      
      return { ...record, status: 'completed', stellar_tx_hash: result.stellar_tx_hash }
    } else {
      await updateAdvanceRecord(record.id, { status: 'failed' })
      throw new Error(`Execution failed: ${result.error_code}`)
    }
  } catch (e) {
    await updateAdvanceRecord(record.id, { status: 'failed' })
    throw e
  }
}
