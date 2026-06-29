import { NextRequest, NextResponse } from 'next/server'
import { askOllama, checkOllama } from '@/lib/ollama'
import { askAI } from '@/lib/ai'
import { handleApiError } from '@/lib/api-error'

/**
 * POST /api/ai/grammar-check
 * Body: { text: string, mode: 'fix-english' | 'fix-indonesian' | 'translate-to-english' | 'translate-to-indonesian' }
 *
 * Flow:
 *   1. Cek Ollama (prefer offline, no API key)
 *   2. Kalau Ollama gagal, fallback ke ZAI (kalau ada API key)
 *   3. Kalau keduanya gagal, return error yang informatif
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const text: string = (body.text || '').trim()
    const mode: string = body.mode || 'fix-english'

    if (!text) {
      return NextResponse.json({ error: 'text wajib diisi' }, { status: 400 })
    }
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'text terlalu panjang (max 5000 karakter)' },
        { status: 400 }
      )
    }

    const { systemPrompt, userMessage } = buildPrompt(text, mode)

    // ===== 1. CEK OLLAMA =====
    const ollamaStatus = await checkOllama()

    if (ollamaStatus.available) {
      try {
        const result = await askOllama(systemPrompt, userMessage, {
          temperature: 0.2,
          timeoutMs: 90000,
        })
        return NextResponse.json({
          ok: true,
          engine: 'ollama',
          model: ollamaStatus.model,
          result,
        })
      } catch (e: any) {
        console.warn('[grammar-check] Ollama failed, fallback to ZAI:', e.message)
      }
    }

    // ===== 2. FALLBACK KE ZAI =====
    try {
      const result = await askAI(systemPrompt, userMessage, {
        temperature: 0.2,
        maxRetries: 1,
      })
      return NextResponse.json({
        ok: true,
        engine: 'zai',
        model: 'glm-4',
        result,
        ollamaError: ollamaStatus.error,
      })
    } catch (e: any) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tidak ada AI yang tersedia.',
          ollamaError: ollamaStatus.error,
          zaiError: e.message,
          setup:
            'Setup salah satu:\n' +
            '1. Ollama (offline, gratis): pkg install ollama && ollama serve & && ollama pull deepseek-r1:1.5b\n' +
            '2. ZAI (online, free tier): bash setup-ai.sh',
        },
        { status: 500 }
      )
    }
  } catch (e) {
    return handleApiError(e, 'grammar-check')
  }
}

function buildPrompt(text: string, mode: string) {
  let systemPrompt = ''
  let userMessage = ''

  switch (mode) {
    case 'fix-english':
      systemPrompt = `You are a grammar checker for English text.
Fix grammar, spelling, and punctuation errors in the user's text.
Return ONLY the corrected text, no explanations, no markdown.
Preserve the original meaning and tone.
If the text is already correct, return it unchanged.`
      userMessage = `Fix this English text:\n\n${text}`
      break

    case 'fix-indonesian':
      systemPrompt = `Anda adalah pemeriksa tata bahasa untuk teks Bahasa Indonesia.
Perbaiki kesalahan tata bahasa, ejaan, dan tanda baca dalam teks pengguna.
Kembalikan HANYA teks yang sudah diperbaiki, tanpa penjelasan, tanpa markdown.
Pertahankan makna dan nada asli.
Jika teks sudah benar, kembalikan tanpa perubahan.`
      userMessage = `Perbaiki teks Bahasa Indonesia ini:\n\n${text}`
      break

    case 'translate-to-english':
      systemPrompt = `You are a translator. Translate the user's text to English.
Fix any grammar errors in the translation.
Return ONLY the translated English text, no explanations, no markdown.
Preserve the original meaning and tone.`
      userMessage = `Translate to English:\n\n${text}`
      break

    case 'translate-to-indonesian':
      systemPrompt = `Anda adalah penerjemah. Terjemahkan teks pengguna ke Bahasa Indonesia.
Perbaiki kesalahan tata bahasa dalam terjemahan.
Kembalikan HANYA teks terjemahan, tanpa penjelasan, tanpa markdown.
Pertahankan makna dan nada asli.`
      userMessage = `Terjemahkan ke Bahasa Indonesia:\n\n${text}`
      break

    default:
      systemPrompt = `You are a grammar checker. Fix grammar errors and return only the corrected text.`
      userMessage = text
  }

  return { systemPrompt, userMessage }
}

/** GET endpoint untuk cek status AI */
export async function GET() {
  const ollamaStatus = await checkOllama()
  const zaiAvailable = !!process.env.ZAI_API_KEY

  return NextResponse.json({
    ollama: ollamaStatus,
    zai: zaiAvailable
      ? { available: true, model: 'glm-4' }
      : { available: false, error: 'ZAI_API_KEY belum di-set' },
    recommendation: ollamaStatus.available
      ? 'Pakai Ollama (offline, gratis)'
      : zaiAvailable
      ? 'Pakai ZAI (online)'
      : 'Setup salah satu: Ollama atau ZAI',
  })
}
