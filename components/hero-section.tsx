'use client'

import ThreeDMarquee from '@/components/ui/3d-marquee'
import { Button } from '@/components/ui/button'

const LANDING_SESION_ID = 'landing-sesion'

function scrollToSesion() {
  document.getElementById(LANDING_SESION_ID)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const fintechImages = [
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&h=300&fit=crop',
]

export default function HeroSection() {
  return (
    <section className="relative isolate h-full min-h-screen w-full overflow-hidden bg-background">
      {/* Fondo: debe ir absolute; si no, el marquee ocupa el flujo y empuja el copy abajo */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <ThreeDMarquee
          images={fintechImages}
          className="opacity-50 !h-full !min-h-full w-full max-w-none rounded-none xl:!h-full xl:!min-h-0"
        />
      </div>

      {/* Contenido encima (pointer-events para clicks sobre el fondo inerte) */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-auto rounded-3xl border border-foreground/10 bg-background/40 px-8 py-10 backdrop-blur-sm">
          <h1 className="text-6xl font-black tracking-tight text-foreground sm:text-7xl md:text-8xl">
            Seyf
          </h1>

          <p className="mt-6 max-w-sm text-xl font-bold text-foreground sm:text-2xl md:max-w-lg text-balance leading-snug">
            Buy now, Pay never.
          </p>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg font-normal text-balance max-w-md mx-auto">
            Compra cuando quieras; el pago encaja con tu flujo. Ahorro, adelantos y liquidez sin perder el control.
          </p>

          <Button
            type="button"
            size="lg"
            className="mt-8 h-12 min-w-[11rem] rounded-full px-8 text-base font-bold"
            onClick={scrollToSesion}
          >
            Iniciar
          </Button>
        </div>
      </div>
    </section>
  )
}
