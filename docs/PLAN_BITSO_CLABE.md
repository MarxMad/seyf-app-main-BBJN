# Plan de Implementación: Integración Bitso/Juno para Creación de CLABE en SEYF

**Fecha:** Abril 2026  
**Proyecto destino:** `seyf-app-main-BBJN` (Next.js 16 App Router)  
**Proyecto fuente:** `puma-pay-campus-wallet` (Vite + React + Express)  
**Objetivo primario:** Crear cuentas CLABE vía API Juno para que los usuarios de SEYF puedan recibir depósitos SPEI.

---

## Contexto y diferencias de arquitectura

| Aspecto | Puma-Pay (fuente) | SEYF fork (destino) |
|---|---|---|
| Framework | Vite + React SPA | Next.js 16 App Router |
| Backend | Express en `backend/index.js` | API Routes en `app/api/` |
| Variables frontend | `VITE_*` (cliente) | `NEXT_PUBLIC_*` (cliente) |
| CLABE actual | Juno vía Express | Etherfuse (`depositClabe` en órdenes) |
| Variables Bitso | Configuradas y usadas | `BITSO_APIKEY` y `BITSO_SECRET_APIKEY` ya en `.env` ✅ |

**Regla de seguridad irrenunciable:** La firma HMAC **nunca sale del servidor**. Todo pasa por Next.js API Routes — nunca `NEXT_PUBLIC_BITSO_*`.

---

## Fase 0 — Hallazgos del análisis de la fuente ✅ COMPLETADA

### F0.1 — Algoritmo de firma HMAC (fuente: `backend/index.js` línea 69-74)

```typescript
// Traducción TypeScript del algoritmo original en Node.js
function buildJunoAuthHeader(
  apiKey: string,
  apiSecret: string,
  method: string,       // 'GET' | 'POST'
  path: string,         // e.g. '/mint_platform/v1/clabes'
  body: string = ''     // JSON string del body, vacío para GET
): string {
  const nonce = Date.now().toString();
  const data = `${nonce}${method}${path}${body}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  return `Bitso ${apiKey}:${nonce}:${signature}`;
}
```

**Formato final del header:** `Authorization: Bitso <apiKey>:<nonce>:<signature>`

### F0.2 — Endpoints Juno API (base: `https://stage.buildwithjuno.com`)

| Endpoint | Método | Path Juno | Notas |
|---|---|---|---|
| Listar CLABEs | GET | `/spei/v1/clabes?clabe_type=AUTO_PAYMENT` | Retorna array de `CLABEDetails` |
| **Crear CLABE** | POST | `/mint_platform/v1/clabes` | Body: `{}`. **Endpoint primario.** |
| Depósito mock | POST | `/spei/test/deposits` | Solo en stage/sandbox |
| Balance MXNB | GET | `/mint_platform/v1/balances` | Retorna `{ balances: MXNBBalance[] }` |
| Transacciones | GET | `/mint_platform/v1/transactions?limit=&offset=&status=&type=` | Paginado |
| Cuentas bancarias | GET | `/mint_platform/v1/accounts/banks` | Para redeem |
| Registrar banco | POST | `/mint_platform/v1/accounts/banks` | `{ tag, recipient_legal_name, clabe, ownership }` |
| Redimir MXNB | POST | `/mint_platform/v1/redemptions` | Requiere `X-Idempotency-Key` |
| Retiro on-chain | POST | `/mint_platform/v1/withdrawals` | Requiere `X-Idempotency-Key` |

### F0.3 — Variables de entorno

**Estado actual en `seyf-app-main-BBJN/.env`:**
- `BITSO_APIKEY` — presente con valor ✅
- `BITSO_SECRET_APIKEY` — presente con valor ✅
- Ninguna variable `NEXT_PUBLIC_BITSO_*` (correcto — deben ser server-only)

**Variables a agregar en `.env.example`:**
```bash
# Bitso / Juno — CLABE y MXNB
BITSO_APIKEY=
BITSO_SECRET_APIKEY=
BITSO_JUNO_BASE_URL=https://stage.buildwithjuno.com   # stage = sandbox; prod = https://buildwithjuno.com
SEYF_CLABE_PROVIDER=juno                              # juno | etherfuse (feature flag)
SEYF_ALLOW_BITSO_DEV_PANEL=false                      # true activa /dev/bitso-clabe
```

### F0.4 — Tipos TypeScript a portar (fuente: `src/config/backend.ts`)

```typescript
export interface CLABEDetails {
  clabe: string;
  type: 'AUTO_PAYMENT';
  status: 'ENABLED' | 'DISABLED';
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

export interface MXNBBalance {
  asset: string;
  balance: number;
}

export interface BankAccount {
  id: string;
  tag: string;
  recipient_legal_name: string;
  clabe: string;
  ownership: 'COMPANY_OWNED' | 'THIRD_PARTY';
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: 'ISSUANCE' | 'REDEMPTION' | 'DEPOSIT';
  summary_status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
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
```

### F0.5 — Algoritmo de validación de CLABE (fuente: `junoService.ts` línea 292-309)

```typescript
static validateCLABE(clabe: string): boolean {
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
```

### F0.6 — Headers especiales requeridos

- **Idempotency Key** (UUID v4): obligatorio en `POST /mint_platform/v1/redemptions` y `POST /mint_platform/v1/withdrawals`.
- **Content-Type**: siempre `application/json`.
- **Timeout recomendado**: 30,000 ms.

---

## Fase 1 — Infraestructura: `lib/bitso/`

**Estado:** pendiente  
**Referencia:** `lib/etherfuse/` como patrón de estructura existente en SEYF.

Archivos a crear:

```
lib/bitso/
  config.ts        → BITSO_APIKEY, BITSO_SECRET_APIKEY, BITSO_JUNO_BASE_URL con defaults
  hmac.ts          → buildJunoAuthHeader() — Node.js crypto (server-side ONLY)
  client.ts        → fetch wrapper con firma automática, timeout, manejo de errores
  clabe-api.ts     → createClabe(), getAccountDetails()
  balance-api.ts   → getBalance(), getTransactions()
  bank-api.ts      → getBankAccounts(), registerBankAccount()
  redeem-api.ts    → redeemMXNB(), sendOnchainWithdrawal()
  types.ts         → CLABEDetails, MXNBBalance, BankAccount, Transaction, JunoApiResponse
  index.ts         → barrel export
```

### Detalle de `lib/bitso/config.ts`

```typescript
// NUNCA exportar con NEXT_PUBLIC_ — todo server-only
export const junoConfig = {
  apiKey:    process.env.BITSO_APIKEY ?? '',
  apiSecret: process.env.BITSO_SECRET_APIKEY ?? '',
  baseUrl:   process.env.BITSO_JUNO_BASE_URL ?? 'https://stage.buildwithjuno.com',
  timeout:   30_000,
} as const;
```

### Detalle de `lib/bitso/hmac.ts`

```typescript
import { createHmac } from 'crypto';

export function buildJunoAuthHeader(
  apiKey: string,
  apiSecret: string,
  method: 'GET' | 'POST',
  path: string,
  body = ''
): string {
  const nonce = Date.now().toString();
  const data = `${nonce}${method}${path}${body}`;
  const signature = createHmac('sha256', apiSecret).update(data).digest('hex');
  return `Bitso ${apiKey}:${nonce}:${signature}`;
}
```

---

## Fase 2 — API Routes de Next.js

**Estado:** pendiente

Equivalente al `backend/index.js` Express, adaptado a Next.js App Router:

```
app/api/seyf/bitso/
  create-clabe/route.ts       → POST — crea CLABE vía Juno
  account-details/route.ts    → GET  — lista CLABEs activas
  balance/route.ts            → GET  — balance MXNB
  transactions/route.ts       → GET  — historial de transacciones
  bank-accounts/route.ts      → GET  — cuentas bancarias registradas
  register-bank/route.ts      → POST — registrar cuenta para redeem
  redeem/route.ts             → POST — MXNB → MXN
```

### Patrón de cada route (ejemplo `create-clabe/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClabe } from '@/lib/bitso/clabe-api';

export async function POST() {
  try {
    const result = await createClabe();
    return NextResponse.json({ success: true, payload: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: String(error) } },
      { status: 500 }
    );
  }
}
```

---

## Fase 3 — Servicio frontend: `lib/seyf/bitso-service.ts`

**Estado:** pendiente

Adaptación de `junoService.ts` sin dependencia de `VITE_BACKEND_URL`. En Next.js las rutas son relativas.

```typescript
// lib/seyf/bitso-service.ts
export async function createUserClabe(): Promise<{ clabe: string; type: string }> {
  const res = await fetch('/api/seyf/bitso/create-clabe', { method: 'POST' });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const { payload } = await res.json();
  return payload;
}

export async function getAccountDetails(): Promise<CLABEDetails[]> {
  const res = await fetch('/api/seyf/bitso/account-details');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const { payload } = await res.json();
  return payload?.response ?? [];
}
// ... getBalance, getTransactions, etc.
```

---

## Fase 4 — Variables de entorno

**Estado:** pendiente  
**Archivos a modificar:** `.env.example`

Agregar al final de `.env.example`:

```bash
# ── Bitso / Juno ─────────────────────────────────────────────
# Obtener credenciales en: https://stage.buildwithjuno.com
# NUNCA usar NEXT_PUBLIC_ para estas variables
BITSO_APIKEY=
BITSO_SECRET_APIKEY=
# URL base de Juno: stage (sandbox) o producción
BITSO_JUNO_BASE_URL=https://stage.buildwithjuno.com
# Provider CLABE: juno | etherfuse
SEYF_CLABE_PROVIDER=juno
# Panel dev en /dev/bitso-clabe (false en producción)
SEYF_ALLOW_BITSO_DEV_PANEL=false
```

---

## Fase 5 — Feature principal: Creación de CLABE

**Estado:** pendiente

Flujo completo de usuario:

```
app/(app)/depositar/page.tsx
  → lee SEYF_CLABE_PROVIDER
  → si 'juno': llama getAccountDetails()
    → si no hay CLABE activa → llama createUserClabe()
    → muestra ClabeDisplayCard con CLABE + instrucciones SPEI
  → si 'etherfuse': flujo existente sin cambios
```

**Archivos a crear/modificar:**

| Archivo | Acción |
|---|---|
| `components/app/clabe-display-card.tsx` | Crear — muestra CLABE, botón copiar, instrucciones SPEI |
| `app/(app)/depositar/page.tsx` | Modificar — integrar flujo Juno con feature flag |

### ClabeDisplayCard — datos a mostrar

- CLABE formateada: `XXXX XXXX XXXX XXXXXX`
- Banco receptor (Juno/Bitso)
- Monto mínimo / máximo si aplica
- Instrucciones: "Transfiere desde cualquier banco mexicano"
- Botón: copiar CLABE al clipboard
- Estado: activa / inactiva

---

## Fase 6 — Webhook Bitso

**Estado:** pendiente  
**Archivo:** `app/api/webhooks/bitso/route.ts`

Seguir el patrón de `app/api/webhooks/etherfuse/route.ts` ya existente:

```typescript
export async function POST(request: Request) {
  // 1. Verificar firma del webhook (header X-Bitso-Signature)
  // 2. Parsear evento: 'deposit.confirmed' | 'clabe.created'
  // 3. Revalidar caché o emitir notificación al cliente
}
```

Eventos relevantes:
- `deposit.confirmed` — depósito SPEI recibido → actualizar balance
- `clabe.created` — confirmación de creación exitosa

---

## Fase 7 — Panel dev: `/dev/bitso-clabe`

**Estado:** pendiente  
**Condición:** solo visible si `SEYF_ALLOW_BITSO_DEV_PANEL=true`

```
app/(app)/dev/bitso-clabe/page.tsx
```

Controles:
- Crear CLABE (POST)
- Ver CLABEs activas (GET)
- Ver balance MXNB
- Ver transacciones recientes
- Simular depósito mock (POST `/spei/test/deposits`)

---

## Fase 8 — Pruebas en orden

Secuencia de smoke test:

1. `GET /api/seyf/bitso/account-details` → 200, array (puede estar vacío)
2. `POST /api/seyf/bitso/create-clabe` → 200, `{ clabe: "XXXXXXXXXXXXXXXXXX" }` (18 dígitos)
3. Validar CLABE con `validateCLABE()` → `true`
4. `GET /api/seyf/bitso/balance` → balance sandbox
5. Panel dev `/dev/bitso-clabe` — flujo visual completo
6. Simular depósito mock → confirmar que llega en historial

---

## Diagrama de dependencias

```
.env (BITSO_APIKEY, BITSO_SECRET_APIKEY, BITSO_JUNO_BASE_URL)
  └── lib/bitso/config.ts
        └── lib/bitso/hmac.ts            ← crypto Node.js server-only
              └── lib/bitso/client.ts
                    ├── lib/bitso/clabe-api.ts
                    ├── lib/bitso/balance-api.ts
                    └── lib/bitso/bank-api.ts
                          └── app/api/seyf/bitso/*/route.ts
                                └── lib/seyf/bitso-service.ts  ← llamadas desde cliente
                                      └── components/app/clabe-display-card.tsx
                                            └── app/(app)/depositar/page.tsx
```

---

## Checklist de progreso

### Fase 0 — Análisis fuente
- [x] Leer `src/services/junoService.ts`
- [x] Leer `backend/index.js`
- [x] Leer `src/config/backend.ts`
- [x] Leer `src/services/bitso.ts`
- [x] Verificar variables en `.env` de SEYF
- [x] Documentar hallazgos

### Fase 1 — `lib/bitso/`
- [ ] `types.ts`
- [ ] `config.ts`
- [ ] `hmac.ts`
- [ ] `client.ts`
- [ ] `clabe-api.ts`
- [ ] `balance-api.ts`
- [ ] `bank-api.ts`
- [ ] `redeem-api.ts`
- [ ] `index.ts`

### Fase 2 — API Routes
- [ ] `create-clabe/route.ts`
- [ ] `account-details/route.ts`
- [ ] `balance/route.ts`
- [ ] `transactions/route.ts`
- [ ] `bank-accounts/route.ts`
- [ ] `register-bank/route.ts`
- [ ] `redeem/route.ts`

### Fase 3 — Servicio frontend
- [ ] `lib/seyf/bitso-service.ts`

### Fase 4 — Variables de entorno
- [ ] Actualizar `.env.example`

### Fase 5 — Feature CLABE
- [x] `components/app/clabe-display-card.tsx`
- [ ] Integrar en `app/(app)/depositar/page.tsx`

### Fase 6 — Webhook
- [ ] `app/api/webhooks/bitso/route.ts`

### Fase 7 — Panel dev
- [ ] `app/(app)/dev/bitso-clabe/page.tsx`

### Fase 8 — Smoke tests
- [ ] GET account-details
- [ ] POST create-clabe
- [ ] Validación CLABE
- [ ] GET balance
- [ ] Panel dev visual

---

## Mapeo wallet ↔ CLABE (Vercel KV)

### Esquema de claves

```
clabe:wallet:{stellarAddress}  →  ClabeRecord   (usuario → su CLABE)
clabe:reverse:{clabe18digits}  →  string         (CLABE → stellarAddress, para webhooks)
```

### Archivos implementados

| Archivo | Rol |
|---|---|
| `lib/bitso/clabe-store.ts` | `getClabeForWallet()`, `saveClabeMapping()`, `getWalletForClabe()` |
| `app/api/seyf/bitso/my-clabe/route.ts` | `GET ?wallet=GBXXX` — CLABE del usuario |
| `app/api/seyf/bitso/create-clabe/route.ts` | `POST { stellarAddress }` — crea + guarda en KV |
| `app/api/webhooks/bitso/route.ts` | Recibe eventos Juno, busca wallet por CLABE en KV |

### Variables de entorno requeridas

```bash
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

Obtener desde: Vercel Dashboard → Storage → Create KV Store → `.env.local`

### Flujo completo con KV

```
Usuario abre la app (wallet Stellar conectada via Pollar)
  → ClabeDisplayCard monta
  → getOrCreateClabe(stellarAddress)
    → GET /api/seyf/bitso/my-clabe?wallet=GBXXX
      → KV lookup "clabe:wallet:GBXXX"
      → null → createUserClabe(stellarAddress)
        → Juno POST /mint_platform/v1/clabes
        → saveClabeMapping: KV.set("clabe:wallet:GBXXX", record)
                            KV.set("clabe:reverse:727400...", "GBXXX")
      → retorna ClabeRecord con CLABE
  → muestra CLABE en tarjeta

Webhook Juno (depósito SPEI confirmado)
  → POST /api/webhooks/bitso
  → getWalletForClabe("727400...")
  → KV.get("clabe:reverse:727400...") → "GBXXX"
  → acreditar MXNB en wallet GBXXX  ← TODO (siguiente fase)
```

---

## Referencias

- [Documentación Juno/Bitso](https://docs.bitso.com/juno/docs)
- Proyecto fuente: `puma-pay-campus-wallet/backend/index.js`
- Patrón Etherfuse en SEYF: `lib/etherfuse/`
- Webhook existente: `app/api/webhooks/etherfuse/route.ts`
