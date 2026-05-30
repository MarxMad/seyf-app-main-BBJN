'use client'

import { useEffect, useRef, useState } from 'react'

const DISMISSED_KEY = 'seyf_install_dismissed_until'
const DISMISS_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed && Date.now() < Number(dismissed)) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.current = null
    }
    setVisible(false)
  }

  function handleDismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISSED_KEY, String(until))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#15534a] px-4 py-3 shadow-xl sm:left-auto sm:right-6 sm:max-w-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/SEYF.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">Instalar Seyf</p>
        <p className="truncate text-xs text-white/60">Acceso rápido desde tu pantalla de inicio</p>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          onClick={handleInstall}
          className="rounded-lg bg-[#2dd4a7] px-3 py-1.5 text-xs font-semibold text-[#0d3531] transition-opacity active:opacity-75"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-opacity hover:text-white/80"
        >
          Más tarde
        </button>
      </div>
    </div>
  )
}
