import { NextResponse } from "next/server";
import { getEtherfuseConfig } from "@/lib/etherfuse/config";
import { verifyEtherfuseWebhookSignature } from "@/lib/etherfuse/webhook-verify";
import { toErrorResponse } from "@/lib/seyf/api-error";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/etherfuse
 * Configura la URL en devnet (Ramp → Webhooks) apuntando a tu dominio + esta ruta.
 * Secreto en ETHERFUSE_WEBHOOK_SECRET (base64, el que devuelve create webhook una sola vez).
 *
 * @see https://docs.etherfuse.com/guides/verifying-webhooks
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    let payload: unknown;
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const { webhookSecret: secret } = getEtherfuseConfig();
    const sig = req.headers.get("x-signature");

    if (secret) {
      if (!verifyEtherfuseWebhookSignature(payload, sig, secret)) {
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "ETHERFUSE_WEBHOOK_SECRET no configurado" },
        { status: 503 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[webhook etherfuse]",
        typeof payload === "object" && payload !== null
          ? JSON.stringify(payload).slice(0, 2500)
          : String(payload),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e, "webhooks/etherfuse");
  }
}
