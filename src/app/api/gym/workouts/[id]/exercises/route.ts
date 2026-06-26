import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gymExercises } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workoutId = (await params).id
    const body = await req.json()
    const id = genId()
    await db.insert(gymExercises).values({
      id, workoutId, name: body.name,
      sets: body.sets ?? 3, reps: body.reps ?? 10,
      weight: body.weight ?? 0, notes: body.notes ?? null,
      createdAt: now(),
    })
    const [created] = await db.select().from(gymExercises).where(eq(gymExercises.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'gym/exercises POST')
  }
}
