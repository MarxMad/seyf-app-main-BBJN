'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useSeyfWallet } from '@/lib/seyf/use-seyf-wallet'
import styles from './seyf-landing-page.module.css'

const RATE_ANNUAL = 0.104
const TERM_DAYS = 28

const numberFmt = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})
const intFmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })

const fmt = (n: number) => numberFmt.format(n)
const fmtInt = (n: number) => intFmt.format(Math.round(n))

function useLandingWalletRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const didRedirectRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const { wallet, loading, creating, error, connect } = useSeyfWallet()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!wallet?.stellarAddress) {
      didRedirectRef.current = false
      return
    }
    if (!mounted || loading || creating) return
    if (pathname !== '/' || didRedirectRef.current) return
    didRedirectRef.current = true
    router.replace('/dashboard')
  }, [mounted, loading, creating, wallet?.stellarAddress, router, pathname])

  return { mounted, loading, creating, error, connect }
}

function useSliderPercent(min: number, max: number, value: number) {
  const pct = ((value - min) / (max - min)) * 100
  return { '--pct': `${pct}%` } as React.CSSProperties
}

export default function SeyfLandingPage() {
  const { mounted, loading, creating, error, connect } = useLandingWalletRedirect()
  const busy = !mounted || loading || creating
  const start = () => {
    if (busy) return
    connect()
  }

  // Hero calculator state — fixed 5% advance, slider over deposit.
  const [heroDeposit, setHeroDeposit] = useState(10000)
  const hero = useMemo(() => {
    const yieldYear = heroDeposit * RATE_ANNUAL
    const yieldMonth = yieldYear * (TERM_DAYS / 365)
    const advance = yieldMonth * 0.05
    return { yieldYear, yieldMonth, advance }
  }, [heroDeposit])
  const heroSliderStyle = useSliderPercent(1000, 200000, heroDeposit)

  // Big calculator state — deposit + percent.
  const [bigDeposit, setBigDeposit] = useState(25000)
  const [bigPercent, setBigPercent] = useState(5)
  const big = useMemo(() => {
    const yieldYear = bigDeposit * RATE_ANNUAL
    const yieldMonth = yieldYear * (TERM_DAYS / 365)
    const advance = yieldMonth * (bigPercent / 100)
    return { yieldMonth, advance, final: bigDeposit + yieldMonth }
  }, [bigDeposit, bigPercent])
  const bigDepositStyle = useSliderPercent(1000, 200000, bigDeposit)
  const bigPercentStyle = useSliderPercent(1, 5, bigPercent)

  return (
    <div className={styles.root}>
      {/* ============================ NAV ============================ */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoGlyph}>S</span>
            S E Y F
          </Link>
          <div className={styles.navLinks}>
            <a href="#como">Cómo funciona</a>
            <a href="#calc">Calculadora</a>
            <a href="#tarjeta">Tarjeta</a>
            <a href="#seguridad">Seguridad</a>
          </div>
          <div className={styles.navCta}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost} ${styles.navCtaLogin}`}
              onClick={start}
              disabled={busy}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={start}
              disabled={busy}
            >
              {creating ? 'Preparando…' : 'Crear cuenta →'}
            </button>
          </div>
        </div>
      </nav>

      {/* ============================ HERO ============================ */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroGrid} aria-hidden />
        <div className={`${styles.container} ${styles.heroInner}`}>
          <div>
            <div className={styles.pill}>
              <span className="dot" />
              Powered by Etherfuse · Stellar · Soroban
            </div>
            <h1 className={styles.huge}>
              Buy Now,
              <br />
              <span className={styles.ital}>Pay Never.</span>
            </h1>
            <p className={styles.heroSub}>
              Tu dinero genera rendimiento con <strong>CETES tokenizados</strong>, y nosotros te
              adelantamos las ganancias futuras — sin tocar tu capital, sin intereses, sin sorpresas.
            </p>
            <div className={styles.heroCta}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                onClick={start}
                disabled={busy}
              >
                {creating ? 'Preparando…' : 'Comenzar gratis →'}
              </button>
              <a
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnLg} ${styles.btnGhostBordered}`}
                href="#calc"
              >
                Calcular mi adelanto
              </a>
            </div>
            {error ? (
              <p style={{ marginTop: 16, color: '#ff8a80', fontSize: 14 }}>{error}</p>
            ) : null}
            <div className={styles.heroStrip}>
              <span>
                <span className={styles.stripDot} /> CNBV · Sandbox
              </span>
              <span>
                <span className={styles.stripDot} /> Custodia en INDEVAL
              </span>
              <span>
                <span className={styles.stripDot} /> Auditado on-chain
              </span>
            </div>
          </div>

          {/* Live calculator card */}
          <div className={styles.calc}>
            <div className={styles.calcHead}>
              <span className="label">Simulador de adelanto</span>
              <span className="live">
                <span className="dot" /> En vivo · MXN
              </span>
            </div>

            <div className={styles.calcRow}>
              <div className="rowLabel">
                <span className="lbl">Tu depósito</span>
                <span className="lblHint">CETES · 10.4% anual</span>
              </div>
              <div className="amount">
                ${fmtInt(heroDeposit)}
                <span className="cents">.00</span>
              </div>
              <input
                type="range"
                min={1000}
                max={200000}
                step={1000}
                value={heroDeposit}
                onChange={(e) => setHeroDeposit(Number(e.target.value))}
                style={heroSliderStyle}
                aria-label="Depósito"
              />
              <div className={styles.calcTick}>
                <span>$1K</span>
                <span>$50K</span>
                <span>$100K</span>
                <span>$200K</span>
              </div>
            </div>

            <div className={styles.calcResults}>
              <div className={styles.calcResultsGrid}>
                <div className={styles.calcCell}>
                  <div className="clbl">Adelanto hoy</div>
                  <div className="cval">${fmt(hero.advance)}</div>
                  <div className="csub">5% del rendimiento proyectado</div>
                </div>
                <div className={styles.calcCell}>
                  <div className="clbl">Rendimiento mensual</div>
                  <div className="cval">${fmt(hero.yieldMonth)}</div>
                  <div className="csub">CETES soberanos · 28 días</div>
                </div>
                <div className={styles.calcCell}>
                  <div className="clbl">Ganancia anual</div>
                  <div className="cval">${fmtInt(hero.yieldYear)}</div>
                  <div className="csub">Capital intacto al cierre</div>
                </div>
                <div className={styles.calcCell}>
                  <div className="clbl">Costo del adelanto</div>
                  <div className={`cval ${styles.mintText}`}>$0.00</div>
                  <div className="csub">Buy Now, Pay Never</div>
                </div>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.calcCta}`}
                onClick={start}
                disabled={busy}
              >
                {creating ? 'Preparando…' : `Comenzar con $${fmtInt(heroDeposit)} →`}
              </button>
            </div>

            <div className={styles.calcDisclosure}>
              Tasa CETES referencia · puede variar al alza o a la baja diariamente
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {[0, 1].map((rep) => (
            <Fragment key={rep}>
              <span>
                BUY NOW <span className="sep">●</span> PAY NEVER
              </span>
              <span className="sep">/</span>
              <span>SIN INTERESES</span>
              <span className="sep">/</span>
              <span>SIN AVAL</span>
              <span className="sep">/</span>
              <span>SIN BURÓ</span>
              <span className="sep">/</span>
              <span>CAPITAL INTACTO</span>
              <span className="sep">/</span>
              <span>CETES TOKENIZADOS</span>
              <span className="sep">/</span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* ============================ PROBLEMA (light) ============================ */}
      <section className={`${styles.band} ${styles.bandLight}`}>
        <div className={styles.container}>
          <div className={styles.sectionEyebrow}>01 · El problema</div>
          <h2 className={`${styles.sectionHead} ${styles.darkSectionHead}`}>
            El dinero llega tarde. <span className={styles.softInk}>La oportunidad no espera.</span>
          </h2>
          <p className={styles.sectionSub}>
            El comerciante informal vive entre tasas imposibles, prestamistas de piso y ahorro
            inmovilizado. Treinta días sin liquidez es media oportunidad perdida.
          </p>

          <div className={styles.painGrid}>
            <div className={styles.painCard}>
              <div className="pcEyebrow">Bancos formales</div>
              <div className="pcNum">
                60<span className="pcSmall">–</span>120<span className="pcMint">%</span>
              </div>
              <div className="pcBody">
                Tasa anual efectiva. Requisitos imposibles para un comerciante que mueve efectivo
                todos los días.
              </div>
              <div className="pcTag">CONDUSEF · Banxico 2024</div>
            </div>
            <div className={styles.painCard}>
              <div className="pcEyebrow">Prestamistas en la CEDA</div>
              <div className="pcNum">
                81<span className="pcMint">%</span>
              </div>
              <div className="pcBody">
                O más. El capital de trabajo se consume antes de generar ganancia. Una sola semana
                mala y se pierde el ciclo.
              </div>
              <div className="pcTag">Trabajo de campo · 2026</div>
            </div>
            <div className={styles.painCard}>
              <div className="pcEyebrow">Ahorro tradicional · CETES</div>
              <div className="pcNum">
                28<span className="pcSmall"> días</span>
              </div>
              <div className="pcBody">
                Mínimo para ver una sola ganancia. La liquidez queda congelada y la oportunidad no
                espera.
              </div>
              <div className="pcTag">Banxico · Tesofe</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TESTIMONIAL ============================ */}
      <section className={`${styles.band} ${styles.bandMidnight}`}>
        <div className={styles.container}>
          <div className={styles.sectionEyebrow}>Voz de campo · Central de Abastos CDMX</div>
          <div className={styles.testi}>
            <div className={styles.testiInner}>
              <div>
                <blockquote>
                  <span className="quote">“</span>Todo mi ahorro
                  <br />
                  está aquí<span className="quote">.”</span>
                </blockquote>
                <cite>
                  — Braulio · vendedor de granos · Señala bajo su terminal de ventas · Abril 2026
                </cite>
              </div>
              <div className={styles.testiPhoto}>
                [ FOTO CEDA ]
                <br />
                <br />
                BRAULIO · PUESTO DE GRANOS
                <br />
                CDMX
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ CÓMO FUNCIONA ============================ */}
      <section
        id="como"
        className={`${styles.band} ${styles.bandMidnight}`}
        style={{ paddingTop: 0 }}
      >
        <div className={styles.container}>
          <div className={styles.sectionEyebrow}>02 · Cómo funciona</div>
          <h2 className={styles.sectionHead}>
            Cuatro pasos. <span className={styles.muteInk}>Cero papeles.</span>
          </h2>
          <p className={styles.sectionSub}>
            Desde un depósito SPEI familiar hasta un adelanto on-chain — sin que el usuario tenga
            que entender ni una línea de código.
          </p>

          <div className={styles.steps}>
            <div>
              <div className={styles.step}>
                <div className={styles.stepNum}>01</div>
                <h3>Depositas por SPEI</h3>
                <p>
                  Usa el mismo rail que ya usas todos los días. Pesos mexicanos, transferencia
                  familiar, sin nuevos hábitos.
                </p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>02</div>
                <h3>Convertimos a CETES tokenizados</h3>
                <p>
                  Tu depósito se convierte en Stablebonds de Etherfuse — bonos soberanos custodiados
                  en INDEVAL. Sin volatilidad cripto.
                </p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>03</div>
                <h3>Proyectamos tu rendimiento on-chain</h3>
                <p>
                  Soroban ejecuta de forma transparente la proyección de ganancias en tiempo real.
                  Tú lo ves crecer en la app.
                </p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNum}>04</div>
                <h3>Te adelantamos hasta 5%</h3>
                <p>
                  Recibes una parte de tu rendimiento <em>hoy</em> — sin tocar tu capital. El
                  adelanto se liquida al vencimiento del plazo.
                </p>
              </div>
            </div>

            <div className={styles.stepsVisual}>
              <div className={styles.svFrame}>
                <svg viewBox="0 0 360 480" className={styles.svSvg}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7fe8cc" stopOpacity="0" />
                      <stop offset="50%" stopColor="#7fe8cc" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#7fe8cc" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <line x1="60" y1="40" x2="60" y2="460" stroke="url(#lineGrad)" strokeWidth="2" />

                  <g transform="translate(60, 60)">
                    <circle r="20" fill="#07100d" stroke="#45b596" strokeWidth="2" />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#45b596"
                      fontFamily="Geist Mono"
                      fontWeight="700"
                      fontSize="13"
                    >
                      01
                    </text>
                  </g>
                  <g transform="translate(120, 60)">
                    <rect
                      x="0"
                      y="-22"
                      width="200"
                      height="44"
                      rx="10"
                      fill="rgba(69,181,150,0.06)"
                      stroke="#2a4039"
                      strokeWidth="1"
                    />
                    <text
                      x="14"
                      y="-4"
                      fill="#7fe8cc"
                      fontFamily="Geist Mono"
                      fontSize="9"
                      letterSpacing="2"
                    >
                      SPEI · MXN
                    </text>
                    <text x="14" y="14" fill="#f3f7f5" fontFamily="Geist" fontWeight="600" fontSize="14">
                      Depósito tradicional
                    </text>
                  </g>

                  <g transform="translate(60, 180)">
                    <circle r="20" fill="#07100d" stroke="#45b596" strokeWidth="2" />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#45b596"
                      fontFamily="Geist Mono"
                      fontWeight="700"
                      fontSize="13"
                    >
                      02
                    </text>
                  </g>
                  <g transform="translate(120, 180)">
                    <rect
                      x="0"
                      y="-22"
                      width="220"
                      height="44"
                      rx="10"
                      fill="rgba(69,181,150,0.06)"
                      stroke="#2a4039"
                      strokeWidth="1"
                    />
                    <text
                      x="14"
                      y="-4"
                      fill="#7fe8cc"
                      fontFamily="Geist Mono"
                      fontSize="9"
                      letterSpacing="2"
                    >
                      ETHERFUSE · STELLAR
                    </text>
                    <text x="14" y="14" fill="#f3f7f5" fontFamily="Geist" fontWeight="600" fontSize="14">
                      CETES tokenizados
                    </text>
                  </g>

                  <g transform="translate(60, 300)">
                    <circle r="20" fill="#07100d" stroke="#45b596" strokeWidth="2" />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#45b596"
                      fontFamily="Geist Mono"
                      fontWeight="700"
                      fontSize="13"
                    >
                      03
                    </text>
                  </g>
                  <g transform="translate(120, 300)">
                    <rect
                      x="0"
                      y="-22"
                      width="200"
                      height="44"
                      rx="10"
                      fill="rgba(69,181,150,0.06)"
                      stroke="#2a4039"
                      strokeWidth="1"
                    />
                    <text
                      x="14"
                      y="-4"
                      fill="#7fe8cc"
                      fontFamily="Geist Mono"
                      fontSize="9"
                      letterSpacing="2"
                    >
                      SOROBAN
                    </text>
                    <text x="14" y="14" fill="#f3f7f5" fontFamily="Geist" fontWeight="600" fontSize="14">
                      Proyección on-chain
                    </text>
                  </g>

                  <g transform="translate(60, 420)">
                    <circle r="22" fill="#45b596" stroke="#7fe8cc" strokeWidth="2" filter="url(#glow)" />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#07100d"
                      fontFamily="Geist Mono"
                      fontWeight="800"
                      fontSize="13"
                    >
                      04
                    </text>
                  </g>
                  <g transform="translate(120, 420)">
                    <rect
                      x="0"
                      y="-24"
                      width="220"
                      height="48"
                      rx="10"
                      fill="rgba(127,232,204,0.12)"
                      stroke="#45b596"
                      strokeWidth="1"
                    />
                    <text
                      x="14"
                      y="-6"
                      fill="#7fe8cc"
                      fontFamily="Geist Mono"
                      fontSize="9"
                      letterSpacing="2"
                    >
                      BUY NOW, PAY NEVER
                    </text>
                    <text x="14" y="14" fill="#f3f7f5" fontFamily="Geist" fontWeight="700" fontSize="15">
                      Adelanto en un tap
                    </text>
                  </g>

                  <circle r="3" fill="#7fe8cc" filter="url(#glow)">
                    <animateMotion dur="6s" repeatCount="indefinite" path="M 60,60 L 60,420" />
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ BIG CALCULATOR ============================ */}
      <section id="calc" className={`${styles.band} ${styles.bandMidnight}`}>
        <div className={styles.container}>
          <div className={styles.sectionEyebrow}>03 · Tu dinero, claro</div>
          <h2 className={styles.sectionHead}>
            ¿Cuánto adelantarías <span className={styles.mintText}>hoy</span>?
          </h2>
          <p className={styles.sectionSub}>
            Mueve el depósito. Sin trampa. Sin asterisco que te cobre después. Todo lo que ves es lo
            que recibes.
          </p>

          <div className={styles.bigCalc}>
            <div className={styles.bigCalcSide}>
              <div className={`${styles.sectionEyebrow} ${styles.bigCalcSideEyebrow}`}>
                Sin intereses · sin avales · sin buró
              </div>
              <h3>
                El adelanto se paga <span className="mint">solo</span>, con tu rendimiento
                bloqueado.
              </h3>
              <p>
                Tu capital nunca sale del protocolo. Si no repagas, el plazo vence y el adelanto se
                absorbe del rendimiento acumulado. Para ti, el costo siempre es cero.
              </p>
              <ul className={styles.bigCalcList}>
                <li>
                  <span className="ic">✓</span> El capital regresa íntegro al cierre del ciclo
                </li>
                <li>
                  <span className="ic">✓</span> El rendimiento neto compensa el adelanto recibido
                </li>
                <li>
                  <span className="ic">✓</span> Tasa CETES referencia, vigilada por Banxico
                </li>
                <li>
                  <span className="ic">✓</span> Custodia regulada · cero exposición a volatilidad
                  cripto
                </li>
              </ul>
            </div>

            <div className={styles.calc}>
              <div className={styles.calcHead}>
                <span className="label">Simulador detallado</span>
                <span className="live">
                  <span className="dot" /> Tasa de hoy
                </span>
              </div>

              <div className={styles.calcRow}>
                <div className="rowLabel">
                  <span className="lbl">Depósito (MXN)</span>
                  <span className="lblHint">Plazo · 28 días</span>
                </div>
                <div className="amount">
                  ${fmtInt(bigDeposit)}
                  <span className="cents">.00</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={200000}
                  step={1000}
                  value={bigDeposit}
                  onChange={(e) => setBigDeposit(Number(e.target.value))}
                  style={bigDepositStyle}
                  aria-label="Depósito"
                />
                <div className={styles.calcTick}>
                  <span>$1K</span>
                  <span>$50K</span>
                  <span>$100K</span>
                  <span>$200K</span>
                </div>
              </div>

              <div className={styles.calcRow}>
                <div className="rowLabel">
                  <span className="lbl">% Adelanto solicitado</span>
                  <span className="lblHint">Máx · 5% del rendimiento</span>
                </div>
                <div className="amount">{bigPercent}%</div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  value={bigPercent}
                  onChange={(e) => setBigPercent(Number(e.target.value))}
                  style={bigPercentStyle}
                  aria-label="Porcentaje de adelanto"
                />
                <div className={styles.calcTick}>
                  <span>1%</span>
                  <span>2%</span>
                  <span>3%</span>
                  <span>4%</span>
                  <span>5%</span>
                </div>
              </div>

              <div className={styles.calcResults}>
                <div className={styles.calcResultsGrid}>
                  <div className={styles.calcCell}>
                    <div className="clbl">Recibes hoy</div>
                    <div className={`cval ${styles.mintText}`} style={{ fontSize: 38 }}>
                      ${fmt(big.advance)}
                    </div>
                    <div className="csub">SPEI al instante</div>
                  </div>
                  <div className={styles.calcCell}>
                    <div className="clbl">A los 28 días</div>
                    <div className="cval">${fmt(big.final)}</div>
                    <div className="csub">Capital + rendimiento neto</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.calcCta}`}
                onClick={start}
                disabled={busy}
              >
                {creating ? 'Preparando…' : `Comenzar con $${fmtInt(bigDeposit)} →`}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TARJETA / PRODUCT ============================ */}
      <section id="tarjeta" className={styles.productSection}>
        <div className={`${styles.container} ${styles.productInner}`}>
          <div>
            <div className={styles.sectionEyebrow}>04 · Tarjeta de Abastos Comerciales</div>
            <h2 className={styles.sectionHead} style={{ marginTop: 16 }}>
              Identidad de gremio. <span className={styles.mintText}>Medio de pago.</span>
            </h2>
            <p className={`${styles.sectionSub} ${styles.productSubLight}`}>
              Tu cuenta SEYF viene con tarjeta física diseñada para el piso del mercado. Acepta
              pagos, recibe depósitos, cobra ventas — todo conectado a tu rendimiento on-chain.
            </p>
            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnLight} ${styles.btnLg}`}
                onClick={start}
                disabled={busy}
              >
                {creating ? 'Preparando…' : 'Quiero mi tarjeta →'}
              </button>
            </div>
          </div>
          <div className={styles.cardStack}>
            <div className={`${styles.seyfCard} ${styles.seyfCardBack}`}>
              <div className="top">
                <div className="chip" />
                <div className="brand">Seyf</div>
              </div>
              <div>
                <div className="meta">Tarjeta de Abastos Comerciales</div>
                <div className="num">2026 ·· 11 / 28</div>
              </div>
            </div>
            <div className={`${styles.seyfCard} ${styles.seyfCardFront}`}>
              <div className="top">
                <div className="chip" />
                <div className="brand">Seyf</div>
              </div>
              <div>
                <div className="meta">Tarjeta de Abastos Comerciales</div>
                <div className="num">●●●● ●●●● ●●●● 4720</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ SEGURIDAD ============================ */}
      <section id="seguridad" className={`${styles.band} ${styles.bandMidnight}`}>
        <div className={styles.container}>
          <div className={styles.sectionEyebrow}>05 · Seguridad y custodia</div>
          <h2 className={styles.sectionHead}>
            Tu dinero, donde <span className={styles.mintText}>debe estar.</span>
          </h2>
          <p className={styles.sectionSub}>
            No somos una caja. Somos infraestructura sobre instrumentos soberanos custodiados.
            Auditable, regulado, transparente.
          </p>

          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <div className="tcEyebrow">CETES</div>
              <div className="tcTitle">Bonos soberanos</div>
              <div className="tcBody">
                Tu depósito se respalda con deuda del Gobierno Federal Mexicano custodiada en
                INDEVAL.
              </div>
            </div>
            <div className={styles.trustCard}>
              <div className="tcEyebrow">Etherfuse</div>
              <div className="tcTitle">Stablebonds</div>
              <div className="tcBody">
                Tokenización institucional. Cero exposición a stablecoins privados o a volatilidad
                cripto.
              </div>
            </div>
            <div className={styles.trustCard}>
              <div className="tcEyebrow">Stellar · Soroban</div>
              <div className="tcTitle">Liquidación on-chain</div>
              <div className="tcBody">
                Movimientos auditables en una red consolidada con relación directa al SDF.
              </div>
            </div>
            <div className={styles.trustCard}>
              <div className="tcEyebrow">CNBV</div>
              <div className="tcTitle">Sandbox regulatorio</div>
              <div className="tcBody">
                Aplicación en curso. Estructura legal y KYC/AML alineados desde el primer usuario.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className={styles.finalCta}>
        <div className={`${styles.container} ${styles.finalCtaInner}`}>
          <div className={styles.finalCtaEyebrow}>
            El capital de quien mueve la economía real
          </div>
          <h2>
            Tu futuro,
            <br />
            <span className={styles.ital}>pagado por adelantado.</span>
          </h2>
          <p>
            Activa tu cuenta SEYF en minutos. Sin score crediticio. Sin estados bancarios. Sin
            papeles. Solo tu identidad y tu primer depósito.
          </p>
          <div className={styles.finalCtaRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDark} ${styles.btnLg}`}
              onClick={start}
              disabled={busy}
            >
              {creating ? 'Preparando…' : 'Crear cuenta gratis →'}
            </button>
            <a
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnLg} ${styles.btnGhostLight}`}
              href="#calc"
            >
              Calcular mi adelanto
            </a>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <div>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoGlyph}>S</span>
                S E Y F
              </Link>
              <p className={styles.footerLead}>
                Liquidez inmediata respaldada por el rendimiento de CETES tokenizados. Una
                infraestructura de Seyfert Labs para la economía real mexicana.
              </p>
            </div>
            <div className={styles.footerCol}>
              <h5>Producto</h5>
              <a href="#como">Cómo funciona</a>
              <a href="#calc">Calculadora</a>
              <a href="#tarjeta">Tarjeta SEYF</a>
              <a href="#seguridad">Seguridad</a>
            </div>
            <div className={styles.footerCol}>
              <h5>Empresa</h5>
              <a href="#">Sobre nosotros</a>
              <a href="#">Blog</a>
              <a href="#">Prensa</a>
              <a href="#">Trabaja con nosotros</a>
            </div>
            <div className={styles.footerCol}>
              <h5>Legal</h5>
              <a href="#">Términos</a>
              <a href="#">Privacidad</a>
              <a href="#">Cumplimiento</a>
              <a href="#">Contacto</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div>© {new Date().getFullYear()} Seyfert Labs · CDMX</div>
            <div>Hecho con cuidado en el corazón de la economía informal</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
