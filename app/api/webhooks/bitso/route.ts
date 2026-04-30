import { NextResponse, type NextRequest } from "next/server"
import { getWalletForClabe } from "@/lib/bitso/clabe-store"

/**
 * POST /api/webhooks/bitso
 *
 * Recibe eventos de Juno/Bitso (depósitos SPEI confirmados, etc.).
 * Usa el índice inverso KV para identificar a qué wallet Stellar acreditar.
 *
 * Registrar esta URL en el dashboard de Juno:
 *   https://TU-DOMINIO/api/webhooks/bitso
 */

type JunoWebhookEvent = {
  event: string
  data?: {
    clabe?: string
    amount?: string | number
    status?: string
    transaction_id?: string
    [key: string]: unknown
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as JunoWebhookEvent

    console.log("[webhook/bitso] evento recibido:", body.event)

    // Depósito SPEI confirmado
    if (body.event === "deposit.confirmed" || body.event === "SPEI_DEPOSIT") {
      const clabe = body.data?.clabe
      const amount = body.data?.amount
      const txId = body.data?.transaction_id

      if (!clabe) {
        console.warn("[webhook/bitso] evento sin clabe:", body)
        return NextResponse.json({ received: true })
      }

      // Buscar a qué wallet pertenece esta CLABE
      const stellarAddress = await getWalletForClabe(clabe)

      if (!stellarAddress) {
        console.warn("[webhook/bitso] CLABE sin wallet asociada:", clabe)
        // Retornar 200 de todas formas para que Juno no reintente
        return NextResponse.json({ received: true })
      }

      console.log(
        `[webhook/bitso] depósito ${amount} MXN para wallet ${stellarAddress} (tx: ${txId})`,
      )

      // TODO: acreditar MXNB en la wallet Stellar del usuario
      // Aquí irá la llamada a Juno issuance o Stellar directamente
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[webhook/bitso] error procesando evento:", error)
    // Retornar 200 para evitar reintentos de Juno por errores internos
    return NextResponse.json({ received: true })
  }
}
