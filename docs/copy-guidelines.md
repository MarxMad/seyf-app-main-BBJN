# Seyf Copy Guidelines

**Voice, Vocabulary & UX Writing Standard**

---

## Voice & Tone

Seyf speaks to merchants and small business owners in **Mexican Spanish** with these principles:

### Core Voice Attributes

- **Cercano** (Close, warm, friendly) — feel like a trusted business advisor, not a bank
- **Claro** (Clear, direct, unambiguous) — short sentences, active voice, no jargon
- **Profesional sin ser frío** (Professional but not cold) — respectful of time and money, never condescending

### Examples

- ❌ "Configure su billetera Stellar" → ✅ "Conecta tu cuenta"
- ❌ "Operación completada exitosamente" → ✅ "Adelanto listo"
- ❌ "Liquidez garantizada mediante establecoins" → ✅ "Tu dinero disponible cuando lo necesites"

---

## Vocabulary: Do's & Don'ts

### Prohibited Crypto/Technical Terms

**Never use in user-visible copy:**

| Don't                         | Do Instead                                  | Notes                                                             |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| wallet, billetera             | cuenta, tu cuenta                           | "Your account" in merchant banking terms                          |
| blockchain, cadena de bloques | (omit if possible; backend only)            | Seyf is "sin cripto" — don't mention the tech layer               |
| Stellar, Horizon, Etherfuse   | (omit; backend only)                        | User never needs to know the infrastructure                       |
| MXNe, stablecoin              | pesos, capital, dinero                      | Users think in fiat; say "pesos en línea" if you must explain     |
| Stablebonds, CETES estable    | CETES, rendimiento, ganancias               | Use official asset name or benefit (yield, returns)               |
| crypto, criptografía          | (omit; use specific verb instead)           | e.g., "firma" (sign), "verifica" (verify)                         |
| on-chain                      | (omit; backend only)                        | Refer to business states: "confirmado", "liquidado", "en proceso" |
| XLM, native asset             | (avoid in user UI unless testnet dev mode)  | Show only MXN to users; XLM is internal                           |
| exchange rate, precio         | tasa, cotización, precio                    | "Tasa" for conversion; "precio" for cost                          |
| private key, secret           | clave privada, (manage via wallet provider) | Never ask user to enter it; use OAuth/wallet SDK                  |
| address, public key           | clave, identificador, (omit if possible)    | Use "clave pública" only in advanced account panel                |
| transaction, tx               | operación, transferencia, movimiento        | Depends on context: SPEI = transfer; purchase = order             |
| deploy                        | (omit; backend only)                        | Say "activar", "crear", "configurar" for user-facing verbs        |

### Domain-Specific Glossary

**Banking/Commerce Terms (do use)**

| English         | Spanish (Seyf)         | Example                        |
| --------------- | ---------------------- | ------------------------------ |
| account         | cuenta                 | "Tu cuenta está lista"         |
| deposit         | depósito, ingreso      | "Nuevo depósito: $500 MXN"     |
| withdrawal      | retiro                 | "Retiros desde tu banco"       |
| transfer (SPEI) | transferencia          | "Transferencia a tu banco"     |
| balance         | saldo                  | "Saldo disponible: $5,000 MXN" |
| available       | disponible             | "Capital disponible"           |
| yield, returns  | rendimiento, ganancias | "Rendimiento: 5.2% anual"      |
| advance         | adelanto, anticipo     | "Tu adelanto de $2,000 MXN"    |
| fee, commission | comisión, cargo        | "Comisión: 1.5%"               |
| rate (APY/%)    | tasa, porcentaje       | "Tasa anual: 5.2%"             |
| business day    | día hábil              | "Hasta el próximo día hábil"   |
| confirm, verify | confirmar, verificar   | "Confirma tu identidad"        |

---

## Capitalization & Punctuation

### Rules

1. **Sentence case for UI copy** — capitalize only the first word and proper nouns
   - ✅ "Conecta tu cuenta bancaria"
   - ❌ "Conecta Tu Cuenta Bancaria"

2. **Button text**: infinitive verb (preferred) or imperative
   - ✅ "Agregar fondos" or "Agregar"
   - ❌ "Agregue fondos" (formal usted form)
   - ❌ "Agregado" (past participle)

3. **Section headers**: Title Case for major section; sentence case for minor headers
   - ✅ Major: "Mis Adelantos"
   - ✅ Minor: "Saldo disponible"

4. **Punctuation**:
   - No periods in button text or alert messages (they're fragments)
   - Colons after field labels in forms
   - Commas in lists of 3+ items

---

## Number & Currency Formatting

### Currency (MXN)

- **Always use**: `$` prefix + space + 2 decimal places (formatted via `Intl.NumberFormat`)
- ✅ `$1,234.56 MXN` or just `$1,234.56` in context
- ❌ `MXN1234.56` (no space, ISO code first)
- ❌ `1234.56 MXN` (missing $)
- **Code reference**: use `formatMXN()` function from `lib/formatters.ts`

### Percentages

- Use `%` symbol without space: `5.2%`, `1.5%`
- Include `anual` if APY: `5.2% anual`

### Dates

- Use locale-aware formatting: `new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })`
- ✅ `15 de mayo de 2026`
- ❌ `05/15/2026` (ambiguous; US format)
- ❌ `2026-05-15` (ISO; not merchant-friendly)

### Thousands separator

- Use comma (`,`) as thousands separator per es-MX locale
- ✅ `$1,234,567.89 MXN`
- ❌ `$1.234.567,89 MXN` (European format; wrong for Mexico)

---

## Button Verbs & CTAs

### Primary Button (Main Action)

Use **infinitive** form for clarity and inclusivity:

| Context               | Primary Button              | Notes                                    |
| --------------------- | --------------------------- | ---------------------------------------- |
| Deposit flow          | "Agregar fondos"            | Clear action                             |
| Withdrawal            | "Retirar"                   | Short and direct                         |
| Advance request       | "Solicitar adelanto"        | Explains what happens                    |
| Identity verification | "Verificar identidad"       | User knows outcome                       |
| Sign document         | "Firmar"                    | "Sign" not "Aceptar" (which means agree) |
| Confirm SPEI details  | "Confirmar"                 | Minimal but clear in context             |
| Onboarding → next     | "Continuar" or "Siguiente"  | Neutral progression                      |
| Submit form           | "Guardar" or "Crear cuenta" | Specific action                          |
| Retry after error     | "Reintentar"                | Explicit retry intent                    |

### Secondary/Tertiary Buttons

- "Cancelar", "Atrás", "Cerrar", "Más tarde" (all clear exits)
- "Ver detalles", "Descargar", "Compartir", "Copiar" (all actions)

### Micro-interactions (Toast/Inline Messages)

Use **past participle** only after action completes:

- ✅ Toast shows after click: "Fondos agregados" (done)
- ✅ Email input: placeholder="Correo electrónico" (expectation)
- ❌ Button before: "Verificado" (confusing; sounds like already done)

---

## Error Message Recipe

Every error message (from API or UI validation) follows the **"Qué pasó → Por qué → Qué hacer"** structure:

### Structure

```
[Qué pasó]
{Lo que salió mal, en lenguaje neutral}

[Por qué] (optional; include only if helpful)
{Brief reason, user's perspective}

[Qué hacer]
{Next action: retry, fix input, contact support, etc.}
```

### Examples

**Validation Error (missing field)**

```
Falta completar el campo de teléfono.
Por favor verifica e intenta de nuevo.
```

**Network/Retry Error**

```
Tu transferencia SPEI sigue en proceso.
Las transferencias pueden tardar hasta el siguiente día hábil.
Vuelve en 24 horas para ver si se completó.
```

**Auth Error**

```
Tu sesión expiró.
Por seguridad, cerramos sesiones después de 2 horas sin actividad.
Inicia sesión nuevamente para continuar.
```

**API Error (generic, per error-codes.md policy)**

```
Algo salió mal. Estamos en ello.
{No additional detail; per PRD §2.8}
Intenta de nuevo en unos minutos.
```

**KYC Rejection**

```
No pudimos verificar tu identidad.
Revisa que tus documentos sean claros, completamente visibles y válidos.
Sube los documentos de nuevo o contáctanos si necesitas ayuda.
```

### Tone Rules for Errors

1. **Never blame the user** — "El sistema no pudo procesar…" not "Ingresaste mal…"
2. **Admit uncertainty** — "Algo salió mal" is fine; don't guess why
3. **Offer next step** — suggest retry, contact, or clear path forward
4. **Use `tú` consistently** — "Tu sesión expiró" not "Su sesión expiró"
5. **Be specific about timing** — "24 horas", "unos minutos", "próximo día hábil"

---

## Component-Level Guidelines

### Forms & Labels

- **Labels**: sentence case, colon suffix (`Email:`) or no punctuation
- **Placeholders**: hints only, not instructions (no periods)
  - ✅ `placeholder="nombre@empresa.com"`
  - ❌ `placeholder="Ingresa tu email"`
- **Help text**: one short sentence, no period
  - ✅ "Necesitamos tu RFC para validar tu negocio"
  - ❌ "Esta información es requerida por el SAT."

### Cards & Sections

- **Card titles**: sentence case, no period
  - ✅ "Tu capital disponible"
  - ❌ "Tu Capital Disponible"
- **Metadata**: "Actualizado hace 2 horas", "3 movimientos", "Próximo retiro: 15 de mayo"

### Empty States

- **Heading**: sentence case; action-oriented
  - ✅ "Aún no hay movimientos"
  - ✅ "Agrega fondos para empezar"
- **Body**: explain why + CTA button
  - ✅ "Tu primer depósito toma 24 horas. Mientras esperas, verifica tu identidad."

### Modals & Confirmations

- **Title**: short, declarative
  - ✅ "Retiro de $500 MXN"
  - ❌ "¿Deseas retirar $500 MXN?" (use for content, not title)
- **Action button**: verb (see Button Verbs section)
- **Cancel**: always available and labeled "Cancelar"

### Notifications & Banners

- **Success**: past participle + optional next step
  - ✅ "Cuenta verificada. Ahora puedes solicitar adelantos."
- **Warning**: imperative or "Por favor"
  - ✅ "Completa tu identidad para acceder a adelantos"
  - ✅ "Por favor agrega una cuenta bancaria para retirar fondos"
- **Error**: follow error recipe above

---

## Special Cases

### Onboarding Screens

- Use **"Crea tu cuenta"** not "Registrate" or "Abre una cuenta" (bank language)
- **"Bienvenido de vuelta"** for login (warm, not formal)
- KYC screen: **"Verificar identidad"** not "Hacer KYC" or "Completar proceso de validación"

### Dashboard

- **Hero card**: "Tu capital disponible" + amount
  - Show **one number** (MXN available); break down only on drill-in
  - Never show XLM, CETES code, or Stellar address on public dash
- **Yield card**: "Rendimiento neto: 5.2% anual" (always include "anual")
- **Movement list**: timestamp, partner bank/counterparty, amount (green/red), description

### Advance (Adelanto)

- **Button**: "Solicitar adelanto" (not "Pedir", "Activar", or "Tomar")
- **Confirmation**: "Tu adelanto de $X,XXX MXN está listo"
- **Summary**: list fee, days (e.g., "Liquidación automática: 28 de mayo")

### Deposit & Withdrawal

- **Deposit**: "Agregar fondos" or "Hacer depósito"
- **Withdrawal**: "Retirar"
- **SPEI details card**: "Instrucciones para transferir" (not "Datos bancarios" or "Wallet vinculada")
- **CLABE label**: "CLABE del destinatario" not "Wallet address" or "Public key"

### Notifications Settings

- Checkbox labels: sentence case, no period
  - ✅ "Notificarme cuando haya movimientos"
  - ✅ "Recordarme mi rendimiento semanal"

### Error Boundary / Global Error

- **Page error**: "Algo salió mal. Intenta recargar."
- **Network offline**: "No hay conexión. Verifica tu wifi o datos."
- **Session expired**: "Tu sesión expiró. Inicia sesión de nuevo."

---

## Implementation Checklist

When adding or updating copy:

- [ ] No "wallet", "blockchain", "Stellar", "MXNe", "Stablebonds", "crypto" in user-visible strings
- [ ] Button verbs are infinitive or imperative (tú form)
- [ ] Numbers use `formatMXN()` and locale-aware date formatting
- [ ] Error messages follow "qué pasó → por qué → qué hacer" recipe
- [ ] Tone is cercano, claro, and profesional (not cold or condescending)
- [ ] Test on mobile (avoid jargon that looks worse on small screens)
- [ ] Align with `docs/error-codes.md` for API error message_es values

---

## Glossary by Feature

### Onboarding / Identity

- "verificar identidad" (verify identity)
- "subir documentos" (upload documents)
- "completar perfil" (complete profile)
- "foto de frente" (face photo)
- "documento de identidad" (ID document)

### Deposits

- "agregar fondos" (add funds)
- "instrucciones para transferir" (transfer instructions)
- "CLABE del destinatario" (recipient CLABE)
- "banco receptor" (receiving bank)
- "monto mínimo" (minimum amount)
- "disponible en" (available in — timing)

### Advances

- "solicitar adelanto" (request advance)
- "rendimiento neto" (net yield)
- "comisión" (fee)
- "liquidación automática" (automatic settlement)
- "días seleccionados" (selected days)

### Withdrawals

- "retirar" (withdraw)
- "cuenta bancaria" (bank account)
- "siguiente día hábil" (next business day)

### History & Movements

- "movimientos" or "transacciones" (movements/transactions)
- "depositado" (deposited — past)
- "invertido" (invested — in CETES)
- "rendimiento ganado" (yield earned)
- "retiro" (withdrawal)

### Notifications

- "notificación" (notification)
- "movimiento importante" (significant movement)
- "rendimiento semanal" (weekly yield)
- "tu dinero está seguro" (your money is safe)

---

## Links & References

- **Error codes**: `docs/error-codes.md` — consult `message_es` for API error strings
- **Formatters**: `lib/formatters.ts` — use `formatMXN()` for all currency display
- **PRD**: `docs/prd-seyf-mvp.md` — original voice/tone spec
- **Merchant tone philosophy**: "cercano, claro, profesional sin ser frío" (PRD §1.2)
- **No crypto vocabulary**: PRD §2.1, §2.4, §2.8

---

**Last Updated**: 2026-05-27  
**Owner**: UX & Product  
**Version**: 1.0
