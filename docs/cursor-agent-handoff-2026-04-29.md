# Handoff para siguiente agente (Cursor)

Este documento resume el avance funcional y visual de Seyf para que el siguiente agente continúe sin perder contexto.

## Estado general

- Rama activa: `feature/kyc-ux-gates-clean-ui`
- Último commit empujado: `f77e547`
- Commits recientes relevantes:
  - `f77e547` feat(ui): estandarización de theming y branding.
  - `da403d4` fix(kyc-ux): pantalla pendiente KYC persistente + estado en dashboard.
  - `70a0b8a` fix(ui-kyc): estabilización refresh identidad + mejoras de cuenta/config.

## Avances implementados

## 1) KYC self-hosted (flujo principal)

- Formulario KYC en `/identidad` envía por API interna (`/api/seyf/kyc/submit`).
- Consulta de estado desacoplada con `GET /api/seyf/kyc/status`.
- Pantallas por estado:
  - `approved` => pantalla de cuenta verificada.
  - `proposed` => pantalla de "Verificación pendiente".
  - `rejected` => mensaje para corregir y reenviar.
- Estado pendiente estabilizado con persistencia en `sessionStorage` para evitar parpadeo al remount.

## 2) Guardas de KYC en operaciones sensibles

- Se mantiene enforcement KYC en rutas de rampa y cuenta CLABE en server.
- UX en dashboard refleja estado KYC (pendiente, en revisión, fallida, verificada).

## 3) UI/branding

- Paleta Seyf (verde claro en light, verde oscuro en dark) aplicada en:
  - dashboard (hero y resumen visual),
  - historial,
  - anadir,
  - estadisticas,
  - bloque de perfil en panel "Tu cuenta",
  - pantalla pendiente de identidad.
- Logo `SEYF.png` removido de tarjetas internas y movido a bienvenida (`HeroSection`) para limpiar composición.
- Tarjeta virtual (`/tarjeta`) rediseñada estilo `seyf-card.png`.

## 4) Organización de panel de cuenta

- "Apariencia" queda arriba.
- Se agregó botón de "Configuración".
- Notificaciones SMS pasan a bloque de configuración desplegable.

## Archivos clave tocados en esta etapa

- `app/(app)/identidad/identidad-client.tsx`
- `app/api/seyf/kyc/status/route.ts`
- `app/(app)/dev/etherfuse-ramp/etherfuse-ramp-dev-client.tsx`
- `app/api/seyf/etherfuse/quote/onramp/route.ts`
- `app/api/seyf/etherfuse/order/onramp/route.ts`
- `components/app/dashboard-client.tsx`
- `components/app/dashboard-hero-carousel.tsx`
- `app/(app)/historial/historial-page-client.tsx`
- `app/(app)/estadisticas/page.tsx`
- `components/app/app-user-account-panel.tsx`
- `components/hero-section.tsx`
- `app/(app)/tarjeta/page.tsx`
- `public/seyf-card.png`

## Estado actual pendiente (IMPORTANTE)

Hay cambios locales sin commit aún:

- `app/(app)/dev/etherfuse-ramp/etherfuse-ramp-dev-client.tsx`
- `app/api/seyf/etherfuse/order/onramp/route.ts`
- `app/api/seyf/etherfuse/quote/onramp/route.ts`

Estos cambios introducen bypass KYC en desarrollo para poder probar `/anadir`, pero todavía no están confirmados.

## Bug activo reportado antes del bypass

- Error al probar "Generar datos de depósito" en `/anadir`.
- Stack en cliente apunta a `etherfuse-ramp-dev-client.tsx` (`performQuote()`).
- En logs de server se vio: `POST /api/seyf/etherfuse/quote/onramp 401`.
- Causa más probable previa: falta de contexto rampa válido (cookie de onboarding o vars `ETHERFUSE_MVP_*`) o guarda backend.

## Próximos pasos recomendados para siguiente agente

1. Validar bypass dev:
   - Reiniciar `npm run dev`.
   - Probar `/anadir` con botón "Generar datos de depósito".
   - Confirmar si pasa de quote a order.
2. Si sigue 401:
   - Revisar respuesta JSON exacta de `/api/seyf/etherfuse/quote/onramp`.
   - Confirmar cookie `seyf_ef_onboarding` vigente.
   - Verificar si se requiere fallback dev más explícito en `getEtherfuseRampContext`.
3. Si bypass funciona:
   - Commit + push del bypass.
   - Documentar claramente que el bypass aplica solo en `NODE_ENV !== 'production'`.

## Variables de entorno observadas

- `ETHERFUSE_ONBOARDING_MODE=programmatic`
- `SEYF_ALLOW_ETHERFUSE_RAMP=true`
- `SEYF_ALLOW_KYC_RESET=true`
- `NEXT_PUBLIC_POLLAR_STELLAR_NETWORK=testnet`

## Nota para continuidad

- El usuario prioriza velocidad de iteración para salir a producción, pero pide mantener UX limpia y consistente.
- En respuestas al usuario, usar español.
