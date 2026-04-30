import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/seyf/api-error";
import { listUserAdvances } from "@/lib/seyf/advance/store";
import { getPocLedgerSnapshot } from "@/lib/seyf/poc-omnibus-ledger";
import { POC_USER_COOKIE, getOrCreatePocUserId } from "@/lib/seyf/poc-user-cookie";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

/**
 * GET /api/seyf/ledger/mxn
 * Saldo MXN normalizado para UI de Adelanto/Añadir.
 */
export async function GET() {
  try {
    const { userId, isNew } = await getOrCreatePocUserId();
    const snap = getPocLedgerSnapshot(userId);
    const advances = await listUserAdvances(userId);

    const advanceOutstandingMxn = advances
      .filter((a) => a.status === "completed" || a.status === "pending")
      .reduce((sum, a) => sum + a.amount_mxn, 0);

    // Primera versión: no hay settle pipeline separado aún.
    const mxnSettling = 0;
    // Primera versión: bloqueos explícitos aún no persistidos.
    const mxnBlocked = 0;
    const mxnAvailable = Math.max(0, snap.balanceMxn);
    const mxnTotal = mxnAvailable + mxnBlocked + mxnSettling;

    const res = NextResponse.json(
      {
        userId,
        model: "mxn_ledger_v1",
        currency: "MXN",
        balances: {
          mxn_available: mxnAvailable,
          mxn_blocked: mxnBlocked,
          mxn_settling: mxnSettling,
          mxn_total: mxnTotal,
          advance_outstanding_mxn: advanceOutstandingMxn,
        },
        constraints: {
          mxn_spendable: mxnAvailable,
          note: "v1: sin reservas dinámicas ni settle por etapas",
        },
        entries_preview: snap.entries.slice(0, 20),
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
    if (isNew) {
      res.cookies.set(POC_USER_COOKIE, userId, cookieOptions());
    }
    return res;
  } catch (e) {
    return toErrorResponse(e, "ledger/mxn");
  }
}
