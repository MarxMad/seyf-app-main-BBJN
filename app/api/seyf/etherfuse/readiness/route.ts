import { NextResponse } from "next/server";
import { fetchRampableAssetsForWallet } from "@/lib/etherfuse/ramp-api";
import { fetchEtherfuseKycStatus } from "@/lib/etherfuse/kyc";
import { etherfuseFetch, etherfuseReadBody } from "@/lib/etherfuse/client";
import { resolveMvpPartnerCryptoWalletId } from "@/lib/etherfuse/partner-accounts";
import { toErrorResponse } from "@/lib/seyf/api-error";
import { getEtherfuseRampContext } from "@/lib/seyf/etherfuse-ramp-context";
import { guardEtherfuseRampRoutes } from "@/lib/seyf/etherfuse-ramp-guard";

type BankAccountRow = {
  bankAccountId?: string;
  id?: string;
  status?: string;
  compliant?: boolean;
  deletedAt?: string | null;
};

function pickBankAccountId(row: BankAccountRow): string | null {
  const id = row.bankAccountId ?? row.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/**
 * GET /api/seyf/etherfuse/readiness
 * Semáforos de readiness para habilitar onramp programático.
 */
export async function GET() {
  try {
    const denied = guardEtherfuseRampRoutes();
    if (denied) return denied;

    const ctx = await getEtherfuseRampContext();
    if (!ctx) {
      return NextResponse.json({
        contextReady: false,
        walletRegistered: false,
        kycApproved: false,
        documentsUploaded: false,
        bankAccountReady: false,
        trustlineReady: false,
        onrampEnabled: false,
        reasons: ["Sin contexto rampa: completa /identidad o configura MVP en desarrollo."],
      });
    }

    const reasons: string[] = [];

    let walletRegistered = false;
    let cryptoWalletId: string | null = null;
    try {
      cryptoWalletId = await resolveMvpPartnerCryptoWalletId(ctx.publicKey);
      walletRegistered = Boolean(cryptoWalletId);
    } catch (e) {
      reasons.push(
        e instanceof Error
          ? `Wallet no registrada en Etherfuse: ${e.message}`
          : "Wallet no registrada en Etherfuse.",
      );
    }

    let kycApproved = false;
    let kycStatus: string | null = null;
    let documentsUploaded = false;
    try {
      const kyc = await fetchEtherfuseKycStatus(ctx.customerId, ctx.publicKey);
      if (kyc.ok) {
        kycStatus = kyc.data.status;
        kycApproved =
          kyc.data.status === "approved" || kyc.data.status === "approved_chain_deploying";
        documentsUploaded = kyc.data.documentsCount > 0 && kyc.data.selfiesCount > 0;
      } else {
        reasons.push("No se encontró KYC para esta wallet.");
      }
    } catch (e) {
      reasons.push(
        e instanceof Error ? `No pudimos validar KYC: ${e.message}` : "No pudimos validar KYC.",
      );
    }
    if (!kycApproved) {
      reasons.push(`KYC no aprobado (status: ${kycStatus ?? "desconocido"}).`);
    }
    if (!documentsUploaded) {
      reasons.push("Faltan documentos KYC (ID y selfie).");
    }

    let bankAccountReady = false;
    try {
      const res = await etherfuseFetch("/ramp/bank-accounts", { method: "GET" });
      const { json } = await etherfuseReadBody<{ items?: BankAccountRow[] }>(res);
      const row = (json?.items ?? []).find((x) => pickBankAccountId(x) === ctx.bankAccountId);
      if (row) {
        const active = (row.status ?? "").toLowerCase() === "active";
        const compliant = row.compliant === true;
        const deleted = row.deletedAt != null;
        bankAccountReady = active && compliant && !deleted;
      }
    } catch (e) {
      reasons.push(
        e instanceof Error
          ? `No pudimos validar cuenta bancaria: ${e.message}`
          : "No pudimos validar cuenta bancaria.",
      );
    }
    if (!bankAccountReady) {
      reasons.push("Cuenta bancaria no activa/compliant para órdenes.");
    }

    let trustlineReady = false;
    try {
      const { assets } = await fetchRampableAssetsForWallet({
        walletPublicKey: ctx.publicKey,
      });
      trustlineReady = assets.some((a) => (a.symbol ?? "").toUpperCase() === "CETES");
    } catch (e) {
      reasons.push(
        e instanceof Error
          ? `No pudimos validar trustline/activos: ${e.message}`
          : "No pudimos validar trustline/activos.",
      );
    }
    if (!trustlineReady) {
      reasons.push("Wallet sin CETES disponible en /ramp/assets.");
    }

    const onrampEnabled =
      walletRegistered && kycApproved && documentsUploaded && bankAccountReady && trustlineReady;

    return NextResponse.json({
      contextReady: true,
      contextSource: ctx.source,
      customerId: ctx.customerId,
      publicKey: ctx.publicKey,
      bankAccountId: ctx.bankAccountId,
      cryptoWalletId,
      walletRegistered,
      kycStatus,
      kycApproved,
      documentsUploaded,
      bankAccountReady,
      trustlineReady,
      onrampEnabled,
      reasons,
    });
  } catch (e) {
    return toErrorResponse(e, "etherfuse/readiness");
  }
}
