/** Tipos y formatos de fecha para movimientos — seguro en cliente (sin `fs`). */

export type MovimientoTipo =
  | "deposito"
  | "rendimiento"
  | "adelanto"
  | "retiro"
  | "pago"
  | "inversion";

export type MovimientoEstado = "completado" | "pendiente" | "fallido";

export type UserMovement = {
  id: string;
  source: "etherfuse" | "ledger" | "stellar";
  tipo: MovimientoTipo;
  titulo: string;
  monto: number;
  createdAt: string;
  estado: MovimientoEstado;
  detalle: string;
  orderId: string | null;
  stellarTxSignature: string | null;
  /** Si existe, el monto es en esta unidad on-chain (no MXN). */
  chainAssetCode?: string | null;
  /** Red Stellar del movimiento (solo `source === 'stellar'`). */
  stellarNetwork?: "testnet" | "mainnet" | null;
};

export function formatMovementListSubtitle(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `Hoy · ${d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatMovementFechaHora(iso: string): {
  fecha: string;
  hora: string;
} {
  const d = new Date(iso);
  return {
    fecha: d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
  };
}
