import { NextResponse, type NextRequest } from "next/server"
import { getClabeForWallet } from "@/lib/bitso/clabe-store"

/**
 * GET /api/seyf/bitso/my-clabe?wallet={stellarAddress}
 *
 * Retorna la CLABE guardada en KV para el stellarAddress dado.
 * Si el usuario aún no tiene CLABE, retorna payload: null (no crea una nueva —
 * eso lo hace POST /api/seyf/bitso/create-clabe).
 */
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get("wallet")?.trim()

    if (!wallet || wallet.length < 10) {
      return NextResponse.json(
        { success: false, error: { message: "Parámetro wallet requerido." } },
        { status: 400 },
      )
    }

    const record = await getClabeForWallet(wallet)

    return NextResponse.json({ success: true, payload: record ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error buscando CLABE"
    console.error("[bitso/my-clabe]", message)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    )
  }
}
