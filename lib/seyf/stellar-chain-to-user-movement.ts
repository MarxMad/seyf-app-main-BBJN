import type { ChainMovement, HorizonNetwork } from '@/lib/seyf/horizon-payments'
import type { UserMovement } from '@/lib/seyf/user-movements-types'

const NET_LABEL: Record<HorizonNetwork, string> = {
  testnet: 'Testnet',
  mainnet: 'Mainnet',
}

/** Convierte un pago Horizon en movimiento de lista (mismo shape que Etherfuse/ledger). */
export function chainMovementToUserMovement(
  m: ChainMovement,
  network: HorizonNetwork,
): UserMovement {
  const incoming = m.tipoUi === 'entrada'
  const signedAmount = incoming ? m.amount : -m.amount
  return {
    id: `stellar-${network}-${m.txHash}-${m.id}`,
    source: 'stellar',
    tipo: incoming ? 'deposito' : 'retiro',
    titulo: incoming ? `Recibiste ${m.assetCode}` : `Enviaste ${m.assetCode}`,
    monto: signedAmount,
    createdAt: m.at,
    estado: 'completado',
    detalle: `${m.detail} · operación ${m.opType} · ${NET_LABEL[network]}`,
    stellarNetwork: network,
    orderId: null,
    stellarTxSignature: m.txHash,
    chainAssetCode: m.assetCode,
  }
}
