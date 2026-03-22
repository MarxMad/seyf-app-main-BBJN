/**
 * POST /ramp/order — localiza el UUID de orden para sandbox `fiat_received` y webhooks.
 * La forma documentada es `{ onramp: { orderId, depositClabe, ... } }`; en runtime pueden
 * aparecer `on_ramp`, envoltorios `data`/`order`, etc.
 *
 * @see https://docs.etherfuse.com/api-reference/orders/create-a-new-order
 */
export function extractOrderIdFromCreateOrderResponse(
  data: unknown,
  depth = 0,
): string | null {
  if (depth > 10 || !data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  const direct = root.orderId ?? root.order_id;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const legs = [
    root.onramp,
    root.onRamp,
    root.on_ramp,
    root.offramp,
    root.offRamp,
    root.off_ramp,
  ];
  for (const leg of legs) {
    if (leg && typeof leg === "object") {
      const o = leg as Record<string, unknown>;
      const id = o.orderId ?? o.order_id;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }

  for (const wrap of ["data", "result", "payload", "order"] as const) {
    const w = root[wrap];
    if (w && typeof w === "object") {
      const id = extractOrderIdFromCreateOrderResponse(w, depth + 1);
      if (id) return id;
    }
  }

  return null;
}

/** Tras POST /ramp/order: CLABE SPEI y monto MXN esperado (objeto `order` de la API). */
export function pickOnrampDepositSummary(order: unknown): {
  orderId: string | null;
  depositClabe: string | null;
  depositAmount: string | null;
} {
  const orderId = extractOrderIdFromCreateOrderResponse(order);
  if (!order || typeof order !== "object") {
    return { orderId, depositClabe: null, depositAmount: null };
  }
  const root = order as Record<string, unknown>;
  const leg = root.onramp ?? root.onRamp ?? root.on_ramp;
  if (!leg || typeof leg !== "object") {
    return { orderId, depositClabe: null, depositAmount: null };
  }
  const o = leg as Record<string, unknown>;
  const clabe =
    typeof o.depositClabe === "string"
      ? o.depositClabe
      : typeof o.deposit_clabe === "string"
        ? o.deposit_clabe
        : null;
  const raw = o.depositAmount ?? o.deposit_amount;
  const depositAmount =
    typeof raw === "number"
      ? String(raw)
      : typeof raw === "string"
        ? raw
        : null;
  return { orderId, depositClabe: clabe, depositAmount };
}
