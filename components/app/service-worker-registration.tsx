'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/seyf-sw.js', { scope: '/' })
      .catch((err) => console.warn('[seyf-sw] registration failed:', err))
  }, [])

  return null
}
