import { getRequestConfig } from 'next-intl/server'

/**
 * Static / server-only next-intl config.
 * The app always serves es-MX. en-US exists in the messages directory for
 * future expansion and is validated by scripts/i18n-check.mjs.
 * No URL-based locale routing is used.
 */
export default getRequestConfig(async () => {
  const locale = 'es-MX'
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
