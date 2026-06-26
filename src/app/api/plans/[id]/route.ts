import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { plans, planMilestones } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, serializeRows, parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = { updatedAt: now() }
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.color !== undefined) updates.color = body.color
    if (body.status !== undefined) updates.status = body.status
    if (body.targetDate !== undefined) updates.targetDate = parseDate(body.targetDate)

    await db.update(plans).set(updates).where(eq(plans.id, id))
    const [updated] = await db.select().from(plans).where(eq(plans.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const milestones = await db.select().from(planMilestones).where(eq(planMilestones.planId, id))
    return NextResponse.json({ ...serializeRow(updated as any), milestones: serializeRows(milestones as any[]) })
  } catch (e) {
    return handleApiError(e, 'plans PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(planMilestones).where(eq(planMilestones.planId, id))
    await db.delete(plans).where(eq(plans.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'plans DELETE')
  }
}
