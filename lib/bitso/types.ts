export interface CLABEDetails {
  clabe: string;
  type: "AUTO_PAYMENT";
  status: "ENABLED" | "DISABLED";
  deposit_minimum_amount: number | null;
  deposit_maximum_amounts: {
    operation: number | null;
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  created_at: string;
  updated_at: string | null;
}

export interface JunoApiResponse<T = unknown> {
  success: boolean;
  payload?: T;
  error?: {
    message: string;
    code?: string | number;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/** Valida que una CLABE mexicana de 18 dígitos sea correcta según su dígito verificador. */
export function validateCLABE(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(clabe[i]) * weights[i];
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit === parseInt(clabe[17]);
}

/** Formatea una CLABE de 18 dígitos como XXXX XXXX XXXX XXXXXX. */
export function formatCLABE(clabe: string): string {
  if (clabe.length !== 18) return clabe;
  return clabe.replace(/(\d{4})(\d{4})(\d{4})(\d{6})/, "$1 $2 $3 $4");
}
