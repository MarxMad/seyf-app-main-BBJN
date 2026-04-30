import { NextResponse } from 'next/server'

const FRANKFURTER_BASE = 'https://api.frankfurter.app'

/**
 * Proxy server-side para Frankfurter: el API no envía CORS adecuado para
 * llamadas desde el browser en producción (Vercel), así que el cliente
 * llama a esta ruta same-origin.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')?.trim().toUpperCase() || 'MXN'
  const to = searchParams.get('to')?.trim() || 'USD,EUR'
  if (!/^[A-Z]{3}$/.test(from)) {
    return NextResponse.json({ error: 'Invalid from' }, { status: 400 })
  }
  const toList = to
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{3}$/.test(c))
  if (toList.length === 0) {
    return NextResponse.json({ error: 'Invalid to' }, { status: 400 })
  }

  const upstream = `${FRANKFURTER_BASE}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(toList.join(','))}`

  try {
    const res = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Frankfurter HTTP ${res.status}` },
        { status: 502 },
      )
    }
    const data = (await res.json()) as Record<string, unknown>
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }
}
