/**
 * Ollama client helper — call local Ollama REST API.
 *
 * Setup Ollama di Termux:
 *   pkg install ollama
 *   ollama serve &          # start server di background
 *   ollama pull deepseek-r1:1.5b   # download model (~1GB)
 *
 * Atau pakai Ollama di PC (HP akses via WiFi):
 *   1. Install Ollama di PC: https://ollama.com
 *   2. Set OLLAMA_URL=http://IP-PC-ANDA:11434 di .env
 *
 * Endpoint Ollama: POST /api/chat
 * Body: { model, messages: [{role, content}], stream: false }
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b'

/** Cek apakah Ollama jalan & model tersedia */
export async function checkOllama(): Promise<{ available: boolean; model: string; error?: string }> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) {
      return { available: false, model: OLLAMA_MODEL, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    const models = (data.models || []).map((m: any) => m.name)
    const modelAvailable =
      models.includes(OLLAMA_MODEL) ||
      models.some((m: string) => m.startsWith(OLLAMA_MODEL.split(':')[0]))
    if (!modelAvailable) {
      return {
        available: false,
        model: OLLAMA_MODEL,
        error: `Model "${OLLAMA_MODEL}" belum di-download. Jalankan: ollama pull ${OLLAMA_MODEL}`,
      }
    }
    return { available: true, model: OLLAMA_MODEL }
  } catch (e: any) {
    return {
      available: false,
      model: OLLAMA_MODEL,
      error: `Ollama tidak jalan di ${OLLAMA_URL}. Setup: pkg install ollama && ollama serve &`,
    }
  }
}

/** Call Ollama chat completion. Returns assistant message content. */
export async function askOllama(
  systemPrompt: string,
  userMessage: string,
  opts: { temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  const { temperature = 0.3, timeoutMs = 60000 } = opts

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      options: { temperature },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error')
    throw new Error(`Ollama error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const content = data?.message?.content
  if (!content) throw new Error('Ollama return response kosong')

  // deepseek-r1 kadang output <think>...</think> block sebelum jawaban asli
  // Hapus think block supaya user cuma lihat jawaban final
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}
