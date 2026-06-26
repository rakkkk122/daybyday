import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reminders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = { updatedAt: now() }
    if (body.title !== undefined) updates.title = body.title
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.datetime !== undefined) updates.datetime = parseDate(body.datetime)
    if (body.repeat !== undefined) updates.repeat = body.repeat
    if (body.done !== undefined) updates.done = body.done

    await db.update(reminders).set(updates).where(eq(reminders.id, id))
    const [updated] = await db.select().from(reminders).where(eq(reminders.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'reminders PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(reminders).where(eq(reminders.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'reminders DELETE')
  }
}
