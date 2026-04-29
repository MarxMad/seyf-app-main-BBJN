import { etherfuseFetch, etherfuseReadBody, extractEtherfuseErrorMessage } from "@/lib/etherfuse/client";

export type EtherfuseWallet = {
  walletId: string;
  customerId: string;
  publicKey: string;
  blockchain: string;
  kycStatus?: string;
  claimedOwnership?: boolean;
};

/**
 * POST /ramp/wallet
 * Registra una wallet a nivel organización partner.
 * Es idempotente según docs (si ya existe, devuelve el registro actual).
 */
export async function registerOrganizationWallet(params: {
  publicKey: string;
  blockchain?: "stellar" | "solana" | "base" | "polygon" | "monad";
  claimOwnership?: boolean;
}): Promise<EtherfuseWallet> {
  const res = await etherfuseFetch("/ramp/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: params.publicKey,
      blockchain: params.blockchain ?? "stellar",
      claimOwnership: params.claimOwnership ?? true,
    }),
    retryable: false,
  });
  const { json, text } = await etherfuseReadBody<EtherfuseWallet | { error?: string }>(res);
  if (!res.ok) {
    const msg = extractEtherfuseErrorMessage(json, text, 500);
    throw new Error(`Etherfuse register wallet failed (${res.status}): ${msg}`);
  }
  if (!json || typeof json !== "object" || !("walletId" in json)) {
    throw new Error(`Etherfuse register wallet returned invalid payload: ${text.slice(0, 500)}`);
  }
  return json as EtherfuseWallet;
}
