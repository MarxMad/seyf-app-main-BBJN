const DEFAULT_JUNO_BASE = "https://stage.buildwithjuno.com";

export type JunoConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
};

/**
 * Configuración del cliente Juno/Bitso — solo servidor.
 * Nunca exponer estas variables con NEXT_PUBLIC_.
 */
export function getJunoConfig(): JunoConfig {
  const apiKey = process.env.BITSO_APIKEY?.trim();
  const apiSecret = process.env.BITSO_SECRET_APIKEY?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error(
      "BITSO_APIKEY y BITSO_SECRET_APIKEY son requeridas. " +
        "Cópialas de tu cuenta Juno/Bitso en .env.local.",
    );
  }

  const raw = process.env.BITSO_JUNO_BASE_URL?.trim();
  const baseUrl = (raw && raw.length > 0 ? raw : DEFAULT_JUNO_BASE).replace(
    /\/$/,
    "",
  );

  return { apiKey, apiSecret, baseUrl };
}
