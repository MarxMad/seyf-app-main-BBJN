import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type AgreementsRow = {
  customerId: string;
  walletPublicKey: string;
  accepted: boolean;
  acceptedAt: string | null;
  updatedAt: string;
};

type AgreementsStore = {
  rows: AgreementsRow[];
};

function agreementsStorePath() {
  return path.join(process.cwd(), "data", "seyf-agreements-state.json");
}

async function loadStore(): Promise<AgreementsStore> {
  try {
    const raw = await readFile(agreementsStorePath(), "utf-8");
    const parsed = JSON.parse(raw) as AgreementsStore;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.rows)) {
      return { rows: [] };
    }
    return parsed;
  } catch {
    return { rows: [] };
  }
}

async function saveStore(store: AgreementsStore): Promise<void> {
  await mkdir(path.dirname(agreementsStorePath()), { recursive: true });
  await writeFile(agreementsStorePath(), JSON.stringify(store, null, 2), "utf-8");
}

export async function getStoredAgreementsStatus(
  customerId: string,
  walletPublicKey: string,
): Promise<{ accepted: boolean; acceptedAt: string | null } | null> {
  const store = await loadStore();
  const found = store.rows.find(
    (row) => row.customerId === customerId && row.walletPublicKey === walletPublicKey,
  );
  if (!found) return null;
  return { accepted: found.accepted, acceptedAt: found.acceptedAt };
}

export async function upsertStoredAgreementsAccepted(params: {
  customerId: string;
  walletPublicKey: string;
  acceptedAt?: string | null;
}): Promise<void> {
  const store = await loadStore();
  const idx = store.rows.findIndex(
    (row) => row.customerId === params.customerId && row.walletPublicKey === params.walletPublicKey,
  );
  const now = new Date().toISOString();
  const acceptedAt = params.acceptedAt ?? now;
  if (idx >= 0) {
    store.rows[idx] = {
      ...store.rows[idx],
      accepted: true,
      acceptedAt,
      updatedAt: now,
    };
  } else {
    store.rows.unshift({
      customerId: params.customerId,
      walletPublicKey: params.walletPublicKey,
      accepted: true,
      acceptedAt,
      updatedAt: now,
    });
  }
  await saveStore(store);
}
