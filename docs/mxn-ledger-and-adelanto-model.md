# Modelo MXN Ledger + Adelanto

Documento de diseño para unificar `Añadir fondos` (CLABE/SPEI) y `Adelanto` sin exponer complejidad blockchain al usuario.

## Objetivo

- Mantener `Añadir` como flujo bancario (CLABE + SPEI).
- Hacer `Adelanto` dependiente de KYC y saldo disponible.
- Soportar producción (SPEI real) y sandbox/testnet (MXN simulado) con la misma UX.

---

## 1) Definiciones de saldo (fuente de verdad)

Se propone un **ledger interno MXN** por usuario con estos buckets:

- `mxn_available`:
  - saldo MXN libre para usar (adelantar, invertir, retirar según reglas de producto).
- `mxn_blocked`:
  - saldo MXN reservado por operaciones en curso (ej. cobertura onramp/compra CETES pendiente).
- `mxn_settling`:
  - saldo MXN en conciliación (SPEI detectado pero no finalizado en estado de negocio).
- `advance_outstanding_mxn`:
  - monto total de adelantos abiertos por liquidar.
- `advance_limit_mxn`:
  - límite dinámico máximo de adelanto del usuario.

Campos derivados (vista):

- `mxn_total = mxn_available + mxn_blocked + mxn_settling`
- `mxn_spendable = max(mxn_available - reservas_riesgo, 0)`

---

## 2) Eventos de ledger

Todos los cambios deben registrarse como eventos inmutables:

- `spei_received`
- `spei_settled`
- `onramp_order_created`
- `onramp_order_failed`
- `onramp_asset_accredited`
- `advance_requested`
- `advance_disbursed`
- `advance_repaid`
- `advance_expired_or_defaulted`
- `manual_adjustment` (solo admin, auditado)

Cada evento debe incluir:

- `event_id` (UUID)
- `user_id`
- `amount_mxn`
- `currency` (mxn)
- `source` (etherfuse_webhook, api_internal, admin)
- `correlation_id` (orderId/quoteId/txHash según aplique)
- `created_at`

---

## 3) Flujo de usuario final

### A) Añadir fondos (no desaparece)

1. Usuario entra a `Añadir`.
2. Si no existe, Seyf crea contexto de onboarding:
   - wallet (Pollar)
   - registro wallet en Etherfuse
   - customer/bankAccount context
3. Usuario ve CLABE/referencia y transfiere SPEI.
4. Al detectar SPEI:
   - `spei_received` -> `mxn_settling`
   - al confirmar negocio -> `spei_settled` y pasa a `mxn_available`.

### B) Adelanto (producto principal)

Precondiciones:

- `kyc_status` en `approved|approved_chain_deploying`
- agreements aceptados
- bank account operativa
- `mxn_spendable > 0`

Flujo:

1. Usuario solicita adelanto.
2. Motor calcula:
   - `advance_limit_mxn`
   - costo/fee
   - fecha de liquidación
3. Al confirmar:
   - bloquear MXN (`mxn_available -> mxn_blocked`)
   - ejecutar cobertura (onramp CETES o estrategia interna)
   - desembolsar MXN al usuario (según rail disponible)
   - registrar `advance_outstanding_mxn`.

---

## 4) Reglas de habilitación de UI

`Añadir`:

- visible siempre que usuario esté autenticado.
- si falta KYC, mostrar CTA claro para completar verificación.

`Adelanto`:

- habilitar solo si:
  - `kycApproved = true`
  - `agreementsAccepted = true`
  - `bankAccountReady = true`
  - `mxn_spendable >= monto_mínimo`

Si bloqueado, mostrar causas humanas (sin jerga técnica):

- “Completa tu verificación de identidad”
- “Tu cuenta bancaria aún se está activando”
- “Aún no tienes saldo disponible para adelanto”

---

## 5) Producción vs testnet/sandbox

### Producción

- Entrada de MXN: SPEI real hacia CLABE asignada.
- Saldo visible al usuario: ledger interno MXN (no depender de parsear directamente blockchain).
- Onramp/cobertura: rail interno (Etherfuse) detrás de escenas.

### Testnet/Sandbox

- Entrada de MXN: simulada por `fiat_received` o endpoint interno de seed.
- UI debe etiquetar claramente:
  - “Modo prueba”
  - “Saldo simulado”
- El mismo motor de reglas/ledger debe operar igual que en prod.

---

## 6) Pregunta clave: “¿Se necesita KYC aprobado para crear CLABE?”

Política recomendada en Seyf:

- Permitir creación inicial de contexto de cuenta.
- **No habilitar operaciones de valor (`Adelanto` y `Order` de onramp) hasta KYC aprobado + account operativa.**

Esto mantiene UX fluida, pero compliance estricto en la ejecución.

---

## 7) Endpoints recomendados (capa Seyf)

- `GET /api/seyf/etherfuse/readiness`
  - semáforos operativos.
- `GET /api/seyf/ledger/mxn`
  - `mxn_available`, `mxn_blocked`, `mxn_settling`, `advance_outstanding_mxn`.
- `POST /api/seyf/advance/quote`
  - calcula límite, costo, neto.
- `POST /api/seyf/advance/confirm`
  - ejecuta bloqueo + cobertura + desembolso.
- `GET /api/seyf/advance/status`
  - timeline del adelanto.

---

## 8) Criterio de “alto valor”

La app se percibe bancaria/tradicional si:

- el usuario solo ve CLABE, transferencia, saldo, fecha de liquidación.
- nunca ve “wallet”, “issuer”, “trustline”, “tx hash” en flujo principal.
- hay trazabilidad fuerte y errores accionables, sin lenguaje técnico.

