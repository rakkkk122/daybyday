import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = {}
    if (body.end !== undefined) {
      updates.end = parseDate(body.end)
      const [existing] = await db.select().from(workSessions).where(eq(workSessions.id, id))
      if (existing && updates.end) {
        updates.duration = Math.round((updates.end - existing.start) / 60000)
      }
    }
    if (body.notes !== undefined) updates.notes = body.notes

    await db.update(workSessions).set(updates).where(eq(workSessions.id, id))
    const [updated] = await db.select().from(workSessions).where(eq(workSessions.id, id))
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'work/sessions PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(workSessions).where(eq(workSessions.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'work/sessions DELETE')
  }
}
