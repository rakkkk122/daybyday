import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { foodLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = { updatedAt: now() }
    if (body.date !== undefined) updates.date = parseDate(body.date)
    if (body.mealType !== undefined) updates.mealType = body.mealType
    if (body.foodName !== undefined) updates.foodName = body.foodName
    if (body.calories !== undefined) updates.calories = body.calories
    if (body.protein !== undefined) updates.protein = body.protein
    if (body.carbs !== undefined) updates.carbs = body.carbs
    if (body.fats !== undefined) updates.fats = body.fats
    if (body.notes !== undefined) updates.notes = body.notes

    await db.update(foodLogs).set(updates).where(eq(foodLogs.id, id))
    const [updated] = await db.select().from(foodLogs).where(eq(foodLogs.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'food/logs PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(foodLogs).where(eq(foodLogs.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'food/logs DELETE')
  }
}
