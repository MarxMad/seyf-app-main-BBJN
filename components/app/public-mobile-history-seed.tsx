'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const PUBLIC_AUTH = new Set(['/login', '/registro'])

/**
 * Misma lógica que AppMobileHistorySeed, para rutas públicas fuera de (app).
 */
export function PublicMobileHistorySeed() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const ran = useRef(false)
  const SESSION_KEY = 'seyf_public_history_seed_done'

  useEffect(() => {
    if (!PUBLIC_AUTH.has(pathname)) return
    if (ran.current) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return
    if (window.history.length > 1) return

    ran.current = true
    window.sessionStorage.setItem(SESSION_KEY, '1')

    const full =
      window.location.pathname + window.location.search + window.location.hash
    const fallback = '/'

    window.history.replaceState(window.history.state, '', fallback)
    window.history.pushState(window.history.state, '', full)
    router.replace(full)
  }, [pathname, router, SESSION_KEY])

  return null
}
