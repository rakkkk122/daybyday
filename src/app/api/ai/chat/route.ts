import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai/chat
 * Body: {
 *   baseUrl: string,        // e.g., https://api.openai.com/v1
 *   apiKey?: string,        // Bearer token
 *   model: string,          // e.g., gpt-4o-mini
 *   messages: Array<{ role: 'system'|'user'|'assistant', content: string }>,
 *   temperature?: number,
 * }
 *
 * Proxy chat request ke OpenAI-compatible API.
 * Server-side proxy supaya avoid CORS issues.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const baseUrl: string = (body.baseUrl || '').trim().replace(/\/+$/, '')
    const apiKey: string = (body.apiKey || '').trim()
    const model: string = (body.model || '').trim()
    const messages: Array<{ role: string; content: string }> = body.messages || []
    const temperature: number = body.temperature ?? 0.7

    if (!baseUrl) return NextResponse.json({ error: 'baseUrl wajib diisi' }, { status: 400 })
    if (!model) return NextResponse.json({ error: 'model wajib diisi' }, { status: 400 })
    if (messages.length === 0) return NextResponse.json({ error: 'messages wajib diisi' }, { status: 400 })

    // Build URL — OpenAI-compatible /v1/chat/completions
    const chatUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const res = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json(
        {
          ok: false,
          error: `API error (HTTP ${res.status})`,
          detail: errText.slice(0, 500),
        },
        { status: 400 }
      )
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { ok: false, error: 'Response kosong dari API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      content,
      model: data?.model || model,
      usage: data?.usage || null,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || 'Gagal chat request' },
      { status: 500 }
    )
  }
}
