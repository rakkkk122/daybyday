import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gymExercises } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.sets !== undefined) updates.sets = body.sets
    if (body.reps !== undefined) updates.reps = body.reps
    if (body.weight !== undefined) updates.weight = body.weight
    if (body.notes !== undefined) updates.notes = body.notes

    await db.update(gymExercises).set(updates).where(eq(gymExercises.id, id))
    const [updated] = await db.select().from(gymExercises).where(eq(gymExercises.id, id))
    return NextResponse.json(serializeRow(updated as any))
  } catch (e) {
    return handleApiError(e, 'gym/exercises PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(gymExercises).where(eq(gymExercises.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'gym/exercises DELETE')
  }
}
