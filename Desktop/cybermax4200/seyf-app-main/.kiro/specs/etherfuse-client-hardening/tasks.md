# Implementation Plan: etherfuse-client-hardening

## Overview

Harden the Etherfuse integration surface by introducing fail-fast config validation, a timeout/retry-aware HTTP client, a structured error mapper, and consistent `toErrorResponse` usage in route handlers. All changes are incremental — each task wires into the previous one.

## Tasks

- [x] 1. Implement `lib/etherfuse/config.ts` — Environment_Matrix and `getEtherfuseConfig()`
  - Define `EnvTier`, `EnvVarSpec`, and `ETHERFUSE_ENV_MATRIX` with all known Etherfuse env vars
  - Implement `getEtherfuseConfig()` that collects all validation errors before throwing a single `Error`
  - Validate `ETHERFUSE_API_KEY` (required, non-empty), `ETHERFUSE_API_BASE_URL` (must start with `https://`), `ETHERFUSE_WEBHOOK_SECRET` (required in production), and `SEYF_ALLOW_ETHERFUSE_RAMP` (must be `"true"` in production)
  - Strip trailing slash from `baseUrl`; apply `defaultValue` for optional vars
  - Export `EtherfuseConfig` type
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]\* 1.1 Write property test — P1: Config validation round-trip
    - **Property 1: Config validation round-trip**
    - Use `fc.record({ apiKey: fc.string({ minLength: 1 }), baseUrl: fc.webUrl() })` to generate valid inputs and assert returned `EtherfuseConfig` fields match
    - **Validates: Requirements 1.6**

  - [ ]\* 1.2 Write property test — P2: Missing API key always throws
    - **Property 2: Missing API key always throws**
    - Use `fc.oneof(fc.constant(""), fc.string().map(s => s.replace(/\S/g, " ")))` and assert thrown `Error` message contains `"ETHERFUSE_API_KEY"` and `".env.example"`
    - **Validates: Requirements 1.2**

  - [ ]\* 1.3 Write property test — P3: Non-HTTPS base URL always throws
    - **Property 3: Non-HTTPS base URL always throws**
    - Use `fc.string().filter(s => !s.startsWith("https://"))` for `ETHERFUSE_API_BASE_URL` and assert thrown `Error` message indicates invalid URL format
    - **Validates: Requirements 1.3**

  - [ ]\* 1.4 Write property test — P4: All validation errors collected before throwing
    - **Property 4: All validation errors collected before throwing**
    - Set multiple required vars to invalid values simultaneously and assert the single thrown `Error` message contains every failing variable name
    - **Validates: Requirements 1.7**

  - [ ]\* 1.5 Write unit tests for `getEtherfuseConfig()`
    - Valid config with all required vars → correct `EtherfuseConfig` shape
    - Production + missing `ETHERFUSE_WEBHOOK_SECRET` → throws (Req 1.4)
    - Production + `SEYF_ALLOW_ETHERFUSE_RAMP !== "true"` → throws (Req 1.5)
    - `ETHERFUSE_ENV_MATRIX` exported and contains entries for all known variables (Req 1.1)
    - _Requirements: 1.1, 1.4, 1.5_

- [x] 2. Implement `lib/etherfuse/errors.ts` — `mapEtherfuseHttpError()` and `mapEtherfuseNetworkError()`
  - Create new file; import `AppError` from `@/lib/seyf/api-error`
  - Implement `mapEtherfuseHttpError(status, providerMessage)` using the mapping table: 429 → `provider_unavailable`/429/retryable, 502–503 → `provider_unavailable`/502/retryable, 504 → `provider_unavailable`/504/retryable, other 5xx → `provider_unavailable`/502, 4xx (≠429) → `generic_error`/400
  - Implement `mapEtherfuseNetworkError(cause)` — detects `AbortError` and returns `AppError("provider_unavailable", { statusCode: 504 })`; wraps all other network errors as `provider_unavailable`/502
  - Store raw `providerMessage` in `AppError.message` only; never expose it in response bodies
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]\* 2.1 Write property test — P11: HTTP 5xx maps to `provider_unavailable` 502
    - **Property 11: HTTP 5xx maps to provider_unavailable 502**
    - Use `fc.integer({ min: 500, max: 599 }).filter(s => s !== 504)` and assert `code === "provider_unavailable"` and `statusCode === 502`
    - **Validates: Requirements 4.1**

  - [ ]\* 2.2 Write property test — P12: HTTP 4xx (not 429) maps to `generic_error` 400
    - **Property 12: HTTP 4xx (not 429) maps to generic_error 400**
    - Use `fc.integer({ min: 400, max: 499 }).filter(s => s !== 429)` and assert `code === "generic_error"` and `statusCode === 400`
    - **Validates: Requirements 4.4**

  - [ ]\* 2.3 Write property test — P13: Raw provider message stays server-side
    - **Property 13: Raw provider message stays server-side**
    - Use `fc.string({ minLength: 1 })` for `providerMessage`; assert `AppError.message` contains it and `toErrorResponse(...)` JSON body does NOT
    - **Validates: Requirements 4.5**

  - [ ]\* 2.4 Write unit tests for `mapEtherfuseHttpError`
    - `mapEtherfuseHttpError(429, ...)` → `retryable: true`, `statusCode: 429` (Req 4.3)
    - `mapEtherfuseHttpError(504, ...)` → `statusCode: 504` (Req 4.2)
    - _Requirements: 4.2, 4.3_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement `lib/etherfuse/client.ts` — timeout, retry, and backoff
  - Export `ETHERFUSE_DEFAULT_TIMEOUT_MS = 10_000` and `ETHERFUSE_MAX_RETRIES = 3`
  - Add `timeoutMs` and `retryable` to `EtherfuseFetchOptions`
  - Per-request `AbortController`; signal passed to `fetch`; on `AbortError` call `mapEtherfuseNetworkError`
  - Retry loop: GET (or explicit `retryable: true`) retries up to `ETHERFUSE_MAX_RETRIES` on network errors or status 429/502/503/504; no retry on other 4xx; POST/PUT/PATCH/DELETE never retry unless `retryable: true`
  - Backoff: `await sleep(200 * 2 ** attempt)` before each retry attempt (attempt 0-indexed)
  - On non-OK response call `mapEtherfuseHttpError`; on exhausted retries throw `AppError("provider_unavailable")` with last status in message
  - Use `getEtherfuseConfig()` for `baseUrl` and `apiKey`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]\* 4.1 Write property test — P5: Timeout produces `AppError` `provider_unavailable` 504
    - **Property 5: Timeout produces AppError provider_unavailable 504**
    - Use `fc.integer({ min: 1, max: 500 })` for `timeoutMs`; mock `fetch` to never resolve; assert thrown `AppError` has `code === "provider_unavailable"` and `statusCode === 504`
    - **Validates: Requirements 2.3**

  - [x]\* 4.2 Write property test — P6: Custom `timeoutMs` overrides the default
    - **Property 6: Custom timeoutMs overrides the default**
    - Use `fc.integer({ min: 50, max: 2000 })` for `timeoutMs`; assert abort fires after `t` ms, not after `ETHERFUSE_DEFAULT_TIMEOUT_MS`
    - **Validates: Requirements 2.2**

  - [x]\* 4.3 Write property test — P7: GET retries if and only if status is retryable
    - **Property 7: GET retries if and only if the status is retryable**
    - Use `fc.constantFrom(429, 502, 503, 504)` for retryable statuses and other 4xx/5xx for non-retryable; assert attempt count accordingly; total attempts ≤ `ETHERFUSE_MAX_RETRIES + 1`
    - **Validates: Requirements 3.1, 3.4, 3.5**

  - [x]\* 4.4 Write property test — P8: Non-GET writes do not retry without explicit opt-in
    - **Property 8: Non-GET writes do not retry without explicit opt-in**
    - Use `fc.constantFrom("POST", "PUT", "PATCH", "DELETE")`; mock returns 503; assert `fetch` called exactly once
    - **Validates: Requirements 3.2**

  - [x]\* 4.5 Write property test — P9: Exponential backoff between retry attempts
    - **Property 9: Exponential backoff between retry attempts**
    - Use `fc.integer({ min: 0, max: 2 })` for attempt index; assert delay equals `200 * 2 ** attempt` ms
    - **Validates: Requirements 3.3**

  - [x]\* 4.6 Write property test — P10: Exhausted retries throw `AppError` `provider_unavailable`
    - **Property 10: Exhausted retries throw AppError provider_unavailable**
    - Mock always returns 503; assert thrown `AppError` has `code === "provider_unavailable"` after `ETHERFUSE_MAX_RETRIES` retries
    - **Validates: Requirements 3.6**

  - [x]\* 4.7 Write unit tests for `etherfuseFetch`
    - `ETHERFUSE_DEFAULT_TIMEOUT_MS === 10_000` (Req 2.4)
    - `ETHERFUSE_MAX_RETRIES === 3` (Req 3.7)
    - Mock fetch: 503 → 503 → 200 on GET → client retries and returns 200 (Req 3.1)
    - Mock fetch: 400 on GET → no retry (Req 3.5)
    - Mock fetch: 503 on POST without `retryable` → no retry (Req 3.2)
    - _Requirements: 2.4, 3.1, 3.2, 3.5, 3.7_

- [x] 5. Update `lib/etherfuse/ramp-api.ts` — replace raw `Error` throws with `mapEtherfuseHttpError`
  - Replace every `throw new Error(...)` block that handles an HTTP error response with `throw mapEtherfuseHttpError(res.status, rawMessage)`
  - Remove any direct `process.env` reads; use `getEtherfuseConfig()` if config values are needed
  - No interface changes to exported functions
  - _Requirements: 4.6_

- [x] 6. Update `lib/etherfuse/orders-api.ts` — replace raw `Error` throws and remove ad-hoc retry loop
  - Replace every `throw new Error(...)` block with `throw mapEtherfuseHttpError(res.status, rawMessage)`
  - Remove the ad-hoc retry loop in `fetchOrderDetailsWithRetry`; delegate retry responsibility to `etherfuseFetch` (pass `retryable: true` if the call is intentionally retryable)
  - No interface changes to exported functions
  - _Requirements: 4.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update `app/api/webhooks/etherfuse/route.ts` — use `getEtherfuseConfig()` and `toErrorResponse`
  - Remove direct `process.env.ETHERFUSE_WEBHOOK_SECRET` read; obtain secret via `getEtherfuseConfig().webhookSecret`
  - Wrap the entire handler body in `try/catch`; return `toErrorResponse(e, "webhooks/etherfuse")` on any caught error
  - _Requirements: 4.7_

- [x] 9. Update `app/api/seyf/etherfuse/ramp-context/route.ts` — use `toErrorResponse`
  - Wrap the entire handler body in `try/catch`; return `toErrorResponse(e, "ramp-context")` on any caught error
  - Remove `toErrorMessage` import; replace all error-path returns with `toErrorResponse`
  - _Requirements: 4.8_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Run tests with `pnpm test --run` (Vitest single-pass, no watch mode)
