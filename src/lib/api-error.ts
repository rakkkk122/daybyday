import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context?: string): NextResponse {
  const err = error as any
  const msg = err?.message || String(error)
  const ctx = context ? `[${context}] ` : ''

  if (msg.includes('did not initialize yet') || msg.includes("Cannot find module '.prisma/client")) {
    return NextResponse.json(
      { ok: false, error: 'Database client belum siap. Restart server.', detail: msg },
      { status: 500 }
    )
  }

  if (msg.includes('EM_X86_64') || msg.includes('EM_AARCH64') || msg.includes('compatible with your system')) {
    return NextResponse.json(
      { ok: false, error: 'DB engine architecture mismatch.', detail: msg },
      { status: 500 }
    )
  }

  if (msg.includes('P1003') || msg.includes("database file") || msg.includes("Can't reach database")) {
    return NextResponse.json(
      { ok: false, error: 'Database tidak ditemukan.', detail: msg },
      { status: 500 }
    )
  }

  console.error(`${ctx}API Error:`, error)
  return NextResponse.json({ ok: false, error: msg.slice(0, 500) }, { status: 500 })
}
