import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gymWorkouts, gymExercises } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, serializeRows, parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = { updatedAt: now() }
    if (body.date !== undefined) updates.date = parseDate(body.date)
    if (body.type !== undefined) updates.type = body.type
    if (body.duration !== undefined) updates.duration = body.duration
    if (body.notes !== undefined) updates.notes = body.notes

    await db.update(gymWorkouts).set(updates).where(eq(gymWorkouts.id, id))
    const [updated] = await db.select().from(gymWorkouts).where(eq(gymWorkouts.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const exercises = await db.select().from(gymExercises).where(eq(gymExercises.workoutId, id))
    return NextResponse.json({ ...serializeRow(updated as any), exercises: serializeRows(exercises as any[]) })
  } catch (e) {
    return handleApiError(e, 'gym/workouts PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(gymExercises).where(eq(gymExercises.workoutId, id))
    await db.delete(gymWorkouts).where(eq(gymWorkouts.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'gym/workouts DELETE')
  }
}
