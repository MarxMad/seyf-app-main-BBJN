import { NextResponse } from "next/server";
import { getAccountDetails } from "@/lib/bitso/clabe-api";

/**
 * GET /api/seyf/bitso/account-details
 *
 * Retorna las CLABEs AUTO_PAYMENT de la cuenta Juno.
 * Útil para comprobar si el usuario ya tiene una CLABE antes de crear una nueva.
 */
export async function GET() {
  try {
    const clabes = await getAccountDetails();
    return NextResponse.json({ success: true, payload: clabes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error obteniendo CLABEs";
    console.error("[bitso/account-details]", message);
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
