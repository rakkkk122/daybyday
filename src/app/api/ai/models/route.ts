import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai/models
 * Body: { baseUrl: string, apiKey?: string }
 *
 * Fetch available models dari OpenAI-compatible API.
 * Works dengan: OpenAI, Groq, OpenRouter, Ollama (/v1), LM Studio, dll.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const baseUrl: string = (body.baseUrl || '').trim().replace(/\/+$/, '')
    const apiKey: string = (body.apiKey || '').trim()

    if (!baseUrl) {
      return NextResponse.json({ error: 'baseUrl wajib diisi' }, { status: 400 })
    }

    // Build URL — OpenAI-compatible /v1/models endpoint
    const modelsUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/models`
      : `${baseUrl}/v1/models`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const res = await fetch(modelsUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json(
        {
          ok: false,
          error: `Gagal fetch models (HTTP ${res.status}). Cek URL & API key.`,
          detail: errText.slice(0, 300),
        },
        { status: 400 }
      )
    }

    const data = await res.json()
    // OpenAI format: { data: [{ id: "gpt-4", ... }, ...] }
    // Ollama format: { models: [{ name: "llama3", ... }, ...] }
    const models: Array<{ id: string; name?: string }> =
      data.data?.map((m: any) => ({ id: m.id, name: m.id })) ||
      data.models?.map((m: any) => ({ id: m.name || m.id, name: m.name || m.id })) ||
      []

    if (models.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Tidak ada model tersedia di URL tersebut.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      models: models.sort((a, b) => a.id.localeCompare(b.id)),
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || 'Gagal connect ke URL' },
      { status: 500 }
    )
  }
}
