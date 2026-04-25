# Requirements Document

## Introduction

Harden the shared Etherfuse integration surface so every ramp flow (on-ramp and off-ramp) uses a
single, consistently configured HTTP client. This covers: environment variable validation with
fail-fast startup, explicit HTTP timeout and retry policies, and structured mapping of all
provider-level failures into the stable Seyf error shape (`SeyfErrorCode` / `SeyfErrorBody`).
The goal is to eliminate flaky orders, duplicate webhook processing, and unclear logs that arise
from the current ad-hoc error handling spread across `lib/etherfuse/*` and
`app/api/seyf/etherfuse/**`.

---

## Glossary

- **Config_Module**: The module `lib/etherfuse/config.ts` responsible for reading, validating, and
  exposing all Etherfuse environment variables.
- **HTTP_Client**: The module `lib/etherfuse/client.ts` that wraps `fetch` with auth headers,
  timeout enforcement, and retry logic.
- **Ramp_API**: The module `lib/etherfuse/ramp-api.ts` that calls Etherfuse quote and order
  endpoints.
- **Orders_API**: The module `lib/etherfuse/orders-api.ts` that calls Etherfuse order-listing and
  order-detail endpoints.
- **Error_Mapper**: The component within `lib/etherfuse/client.ts` (or a dedicated
  `lib/etherfuse/errors.ts`) that translates raw Etherfuse HTTP responses into `AppError` instances
  using `SeyfErrorCode` values.
- **Webhook_Handler**: The route `app/api/webhooks/etherfuse/route.ts`.
- **Ramp_Context_Route**: The route `app/api/seyf/etherfuse/ramp-context/route.ts`.
- **SeyfErrorCode**: The union type defined in `lib/seyf/api-error.ts`:
  `"spei_timeout" | "deploy_failed" | "provider_unavailable" | "generic_error"`.
- **AppError**: The class defined in `lib/seyf/api-error.ts` that carries a `SeyfErrorCode`,
  HTTP status, and retryable flag.
- **Environment_Matrix**: The documented table of environment variables per deployment tier
  (local / sandbox / production), including which are required, which are optional, and their
  default values.
- **Idempotent_Read**: An HTTP GET request that has no side effects and can safely be retried.
- **Non_Idempotent_Write**: An HTTP POST/PUT/PATCH/DELETE request that may create or mutate state
  and MUST NOT be retried automatically unless explicitly marked safe.
- **Backoff**: An exponential delay strategy applied between retry attempts to avoid thundering-herd
  effects against the Etherfuse API.

---

## Requirements

### Requirement 1: Environment Variable Validation (Fail-Fast)

**User Story:** As a platform engineer, I want the application to refuse to start when required
Etherfuse environment variables are missing or malformed, so that misconfiguration is caught at
deploy time rather than at runtime during a live transaction.

#### Acceptance Criteria

1. THE Config_Module SHALL define and export the Environment_Matrix as a typed schema listing every
   Etherfuse-related environment variable, its tier applicability (local / sandbox / production),
   whether it is required or optional, and its default value when optional.
2. WHEN the application initializes the Config_Module and `ETHERFUSE_API_KEY` is absent or empty,
   THE Config_Module SHALL throw an `Error` with a message that names the missing variable and
   references `.env.example`.
3. WHEN the application initializes the Config_Module and `ETHERFUSE_API_BASE_URL` is present but
   does not begin with `https://`, THE Config_Module SHALL throw an `Error` with a message
   indicating the invalid URL format.
4. WHEN `NODE_ENV` is `"production"` and `ETHERFUSE_WEBHOOK_SECRET` is absent or empty, THE
   Config_Module SHALL throw an `Error` with a message stating that the webhook secret is required
   in production.
5. WHEN `NODE_ENV` is `"production"` and `SEYF_ALLOW_ETHERFUSE_RAMP` is not set to `"true"`, THE
   Config_Module SHALL throw an `Error` indicating that ramp routes are disabled.
6. THE Config_Module SHALL export a single `getEtherfuseConfig()` function that returns a fully
   validated `EtherfuseConfig` object, replacing all direct `process.env` reads scattered across
   other modules.
7. IF any required variable fails validation, THEN THE Config_Module SHALL collect all validation
   errors and throw a single `Error` listing every failing variable, rather than stopping at the
   first failure.

---

### Requirement 2: HTTP Client Policy — Timeouts

**User Story:** As a platform engineer, I want every outbound HTTP request to the Etherfuse API to
have an explicit timeout, so that a slow or unresponsive provider cannot hold a Next.js route
handler open indefinitely.

#### Acceptance Criteria

1. THE HTTP_Client SHALL apply a default request timeout of 10 000 ms to every call made via
   `etherfuseFetch`.
2. WHERE a caller explicitly passes a `timeoutMs` option, THE HTTP_Client SHALL use that value
   instead of the default.
3. WHEN a request exceeds its timeout, THE HTTP_Client SHALL abort the request using
   `AbortController` and throw an `AppError` with code `"provider_unavailable"` and
   `statusCode` 504.
4. THE HTTP_Client SHALL expose the default timeout value as an exported constant
   `ETHERFUSE_DEFAULT_TIMEOUT_MS` so tests and callers can reference it without magic numbers.

---

### Requirement 3: HTTP Client Policy — Retry with Backoff

**User Story:** As a platform engineer, I want the HTTP client to automatically retry transient
failures on safe read operations, so that brief network hiccups do not surface as user-visible
errors, while ensuring that write operations are never silently duplicated.

#### Acceptance Criteria

1. THE HTTP_Client SHALL retry a failed request at most 3 times for Idempotent_Read operations
   (HTTP GET).
2. THE HTTP_Client SHALL NOT automatically retry Non_Idempotent_Write operations (HTTP POST, PUT,
   PATCH, DELETE) unless the caller explicitly passes `retryable: true` in the request options.
3. WHEN a retry is warranted, THE HTTP_Client SHALL wait `200 * 2^attempt` ms between attempts
   (exponential Backoff), where `attempt` starts at 0.
4. THE HTTP_Client SHALL only retry on network errors or HTTP responses with status 429, 502, 503,
   or 504.
5. THE HTTP_Client SHALL NOT retry on HTTP responses with status 4xx (except 429), as these
   indicate client errors that will not resolve on retry.
6. WHEN all retry attempts are exhausted, THE HTTP_Client SHALL throw an `AppError` with code
   `"provider_unavailable"` and include the last HTTP status code in the internal message.
7. THE HTTP_Client SHALL expose the maximum retry count as an exported constant
   `ETHERFUSE_MAX_RETRIES` so tests can reference it without magic numbers.

---

### Requirement 4: Structured Error Mapping

**User Story:** As a backend developer, I want all Etherfuse provider failures to be translated
into `AppError` instances with stable `SeyfErrorCode` values before they reach route handlers, so
that raw provider response bodies are never forwarded to API clients.

#### Acceptance Criteria

1. THE Error_Mapper SHALL translate any Etherfuse HTTP 5xx response into an `AppError` with code
   `"provider_unavailable"` and `statusCode` 502.
2. THE Error_Mapper SHALL translate an Etherfuse HTTP 504 or timeout into an `AppError` with code
   `"provider_unavailable"` and `statusCode` 504.
3. THE Error_Mapper SHALL translate an Etherfuse HTTP 429 (rate-limit) into an `AppError` with
   code `"provider_unavailable"`, `statusCode` 429, and `retryable: true`.
4. THE Error_Mapper SHALL translate an Etherfuse HTTP 4xx response (excluding 429) into an
   `AppError` with code `"generic_error"` and `statusCode` 400.
5. WHEN the Error_Mapper creates an `AppError`, THE Error_Mapper SHALL include the raw provider
   error message in the `AppError`'s internal `message` field for server-side logging, and SHALL
   NOT include it in any response body sent to the client.
6. THE Ramp_API and Orders_API SHALL use the Error_Mapper for all HTTP error handling, replacing
   the current pattern of throwing plain `Error` instances with raw provider text.
7. THE Webhook_Handler SHALL use `toErrorResponse` from `lib/seyf/api-error.ts` for all error
   responses, ensuring no raw Etherfuse body is returned to the webhook caller.
8. THE Ramp_Context_Route SHALL use `toErrorResponse` from `lib/seyf/api-error.ts` for all error
   responses.

---

### Requirement 5: Retry Classification Unit Tests

**User Story:** As a developer, I want unit tests that verify config parsing and retry
classification logic using a mocked `fetch`, so that regressions in the HTTP guardrails are caught
in CI before reaching staging.

#### Acceptance Criteria

1. THE test suite SHALL include tests for Config_Module validation that assert an `Error` is thrown
   for each missing required variable scenario defined in Requirement 1.
2. THE test suite SHALL include tests for Config_Module validation that assert a valid
   `EtherfuseConfig` object is returned when all required variables are present and well-formed.
3. THE test suite SHALL include tests for HTTP_Client retry logic using a mock `fetch` that
   simulates 503 responses followed by a 200, asserting that the client retries and returns the
   successful response.
4. THE test suite SHALL include tests asserting that HTTP_Client does NOT retry a POST request that
   returns 503 unless `retryable: true` is passed.
5. THE test suite SHALL include tests asserting that HTTP_Client does NOT retry a GET request that
   returns 400.
6. THE test suite SHALL include tests asserting that a timeout (simulated via a mock that never
   resolves within `timeoutMs`) causes the HTTP_Client to throw an `AppError` with code
   `"provider_unavailable"`.
7. WHEN the test suite is run via the project test command, THE test suite SHALL pass without
   errors in CI.
