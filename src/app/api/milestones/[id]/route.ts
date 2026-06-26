import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { planMilestones } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = { updatedAt: now() }
    if (body.title !== undefined) updates.title = body.title
    if (body.done !== undefined) updates.done = body.done
    if (body.dueDate !== undefined) updates.dueDate = parseDate(body.dueDate)

    await db.update(planMilestones).set(updates).where(eq(planMilestones.id, id))
    const [updated] = await db.select().from(planMilestones).where(eq(planMilestones.id, id))
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'milestones PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(planMilestones).where(eq(planMilestones.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'milestones DELETE')
  }
}
