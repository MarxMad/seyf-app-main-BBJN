import type { UserMovement } from '@/lib/seyf/user-movements-types'

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pointsFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const chainAmountFormatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 7 })

export const formatMXN = (amount: number): string =>
  mxnFormatter.format(amount)

export const formatPuntos = (points: number): string =>
  pointsFormatter.format(points)

export const formatMXNToParts = (amount: number) =>
  mxnFormatter.formatToParts(amount)

export function splitCurrencyForDisplay(amount: number): { main: string; cents: string } {
  const parts = formatMXNToParts(amount)
  let main = ''
  let fraction = ''
  let decimalSep = '.'
  for (const p of parts) {
    if (p.type === 'fraction') { fraction = p.value; continue }
    if (p.type === 'decimal')  { decimalSep = p.value; continue }
    main += p.value
  }
  return { main: main.trim(), cents: fraction ? `${decimalSep}${fraction}` : '' }
}

export function formatLoUltimoMonto(mov: UserMovement): string {
  const code = mov.chainAssetCode?.trim()
  const sign = mov.monto < 0 ? '− ' : mov.monto > 0 ? '+' : ''
  if (code) {
    const abs = Math.abs(mov.monto)
    const n = chainAmountFormatter.format(abs)
    return `${sign}${n} ${code}`
  }
  return `${sign}${formatMXN(Math.abs(mov.monto))}`
}
