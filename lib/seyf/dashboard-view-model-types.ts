import type { UserMovement } from "@/lib/seyf/user-movements-types";

/** Cuántas filas de actividad se muestran en inicio (el historial completo sigue en /historial). */
export const DASHBOARD_MOVEMENTS_PREVIEW_LIMIT = 8;

export type DashboardViewModel = {
  principalMxn: number;
  rendimientoMxn: number;
  adelantableMxn: number;
  puntos: number;
  tasaAnual: number;
  saldoGastoMxn: number;
  saldoNote: string | null;
  movementsRecent: UserMovement[];
  /** AC-6: true when the user has an active advance in progress. Greyes out the advance card.
   *  Populate from Etherfuse loan status once the endpoint is available. */
  advanceUsed: boolean;
};
