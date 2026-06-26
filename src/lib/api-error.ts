import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context?: string): NextResponse {
  const err = error as any
  const msg = err?.message || String(error)
  const ctx = context ? `[${context}] ` : ''

  // AI belum ter-config (tidak ada API key)
  if (msg.includes('AI belum ter-config') || msg.includes('Configuration file not found')) {
    return NextResponse.json(
      {
        ok: false,
        error: 'AI belum ter-config. Tambahkan ZAI_API_KEY di file .env, lalu restart server.',
        setup: 'Dapatkan API key gratis di https://z.ai → Sign Up → Dashboard → API Keys',
      },
      { status: 500 }
    )
  }

  // AI request gagal (network/auth issue)
  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('403')) {
    return NextResponse.json(
      {
        ok: false,
        error: 'API key tidak valid atau expired. Cek ZAI_API_KEY di .env.',
      },
      { status: 500 }
    )
  }

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
