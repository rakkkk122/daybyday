import { NextRequest, NextResponse } from 'next/server'
import { askAISmartJSON } from '@/lib/ai'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const goal: string = (body.goal || '').trim()
    if (!goal) return NextResponse.json({ error: 'goal wajib diisi' }, { status: 400 })

    const timeframe: string = body.timeframe || 'month'
    const now = new Date()
    const targetDate = new Date(now)
    if (timeframe === 'week') targetDate.setDate(now.getDate() + 7)
    else if (timeframe === 'month') targetDate.setMonth(now.getMonth() + 1)
    else if (timeframe === 'quarter') targetDate.setMonth(now.getMonth() + 3)

    const systemPrompt = `Kamu adalah coach personal goal-setting.
Berdasarkan goal user, buat PLAN lengkap dengan milestones SMART.
Pilih warna: emerald (kesehatan/kebugaran), amber (kerja/karier), rose (kreatif/hobi), violet (belajar/skill), teal (finansial), orange (lainnya).
WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{"title":"...","description":"1-2 kalimat","color":"emerald","milestones":[{"title":"...","dueOffsetDays":7}]}`

    const userMessage = `Goal: ${goal}\nTimeframe: ${timeframe} (target tanggal: ${targetDate.toISOString().slice(0, 10)})\n${body.context ? `Konteks: ${body.context}` : ''}\n\nBuatkan plan lengkap dengan 3-6 milestone.`

    const { data: result, engine, model } = await askAISmartJSON<{
      title: string
      description: string
      color: string
      milestones: Array<{ title: string; dueOffsetDays: number }>
    }>(systemPrompt, userMessage, {
      temperature: 0.7,
      timeoutMs: 180000,
    })

    if (!result.title || !Array.isArray(result.milestones)) throw new Error('Format AI tidak valid')
    const validColors = ['emerald', 'amber', 'rose', 'violet', 'teal', 'orange']
    if (!validColors.includes(result.color)) result.color = 'emerald'

    return NextResponse.json({
      ok: true,
      engine,
      model,
      targetDate: targetDate.toISOString(),
      plan: {
        title: result.title,
        description: result.description || '',
        color: result.color,
        targetDate: targetDate.toISOString(),
        milestones: result.milestones.map((m, i) => ({
          title: m.title,
          dueOffsetDays: Math.max(1, Math.min(365, Number(m.dueOffsetDays) || (i + 1) * 7)),
        })),
      },
    })
  } catch (e: any) {
    return handleApiError(e, 'ai/plan-generate')
  }
}
