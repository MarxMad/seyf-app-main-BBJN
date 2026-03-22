'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * PWA / Android: con una sola entrada en el historial, el gesto "atrás" cierra la pestaña o la app.
 * Insertamos una entrada "padre" bajo la URL actual para que el primer atrás sea navegación interna.
 * No toca el historial si ya hay más de una entrada (navegación normal con Link / push).
 */
export function AppMobileHistorySeed() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    if (typeof window === 'undefined') return
    if (window.history.length > 1) return

    const path = pathname
    if (path === '') return

    ran.current = true

    const full =
      window.location.pathname + window.location.search + window.location.hash

    const appHome = '/dashboard'
    const fallback =
      path === appHome || path === '/login' || path === '/registro' ? '/' : appHome

    window.history.replaceState(window.history.state, '', fallback)
    window.history.pushState(window.history.state, '', full)
    router.replace(full)
  }, [pathname, router])

  return null
}
