import { NextResponse } from "next/server";
import { createClabe } from "@/lib/bitso/clabe-api";
import { saveClabeMapping } from "@/lib/bitso/clabe-store";

/**
 * POST /api/seyf/bitso/create-clabe
 *
 * Crea una nueva CLABE en Juno y guarda el mapeo { stellarAddress ↔ clabe } en Vercel KV.
 *
 * Body: { stellarAddress: string }  — dirección pública Stellar del usuario (de Pollar).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { stellarAddress?: string }
    const { stellarAddress } = body

    if (!stellarAddress || typeof stellarAddress !== "string" || stellarAddress.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: { message: "stellarAddress es requerido." } },
        { status: 400 },
      )
    }

    const clabe = await createClabe()
    const record = await saveClabeMapping(stellarAddress.trim(), clabe)

    return NextResponse.json({ success: true, payload: record })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error creando CLABE"
    console.error("[bitso/create-clabe]", message)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    )
  }
}
