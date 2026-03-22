import type { ChainMovement } from '@/lib/seyf/horizon-payments'
import type { UserMovement } from '@/lib/seyf/user-movements-types'

/** Convierte un pago Horizon en movimiento de lista (mismo shape que Etherfuse/ledger). */
export function chainMovementToUserMovement(m: ChainMovement): UserMovement {
  const incoming = m.tipoUi === 'entrada'
  const signedAmount = incoming ? m.amount : -m.amount
  return {
    id: `stellar-${m.txHash}-${m.id}`,
    source: 'stellar',
    tipo: incoming ? 'deposito' : 'retiro',
    titulo: incoming ? `Recibiste ${m.assetCode}` : `Enviaste ${m.assetCode}`,
    monto: signedAmount,
    createdAt: m.at,
    estado: 'completado',
    detalle: `${m.detail} · operación ${m.opType}`,
    orderId: null,
    stellarTxSignature: m.txHash,
    chainAssetCode: m.assetCode,
  }
}
