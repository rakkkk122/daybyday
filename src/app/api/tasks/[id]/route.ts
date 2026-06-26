import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
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
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.category !== undefined) updates.category = body.category
    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === 'done') updates.completedAt = now()
    }
    if (body.dueDate !== undefined) updates.dueDate = parseDate(body.dueDate)

    await db.update(tasks).set(updates).where(eq(tasks.id, id))
    const [updated] = await db.select().from(tasks).where(eq(tasks.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'tasks PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(tasks).where(eq(tasks.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'tasks DELETE')
  }
}
