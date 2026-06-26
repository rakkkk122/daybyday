import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gymWorkouts, gymExercises } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { serializeRow, serializeRows, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const workouts = await db.select().from(gymWorkouts).orderBy(desc(gymWorkouts.date))
    const exercises = await db.select().from(gymExercises)
    const exercisesByWorkout = exercises.reduce<Record<string, typeof exercises>>((acc, e) => {
      if (!acc[e.workoutId]) acc[e.workoutId] = []
      acc[e.workoutId].push(e)
      return acc
    }, {})
    const result = workouts.map((w) => ({
      ...serializeRow(w as any),
      exercises: serializeRows(exercisesByWorkout[w.id] || []),
    }))
    return NextResponse.json(result)
  } catch (e) {
    return handleApiError(e, 'gym/workouts GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(gymWorkouts).values({
      id, date: parseDate(body.date) ?? ts,
      type: body.type ?? 'strength', duration: body.duration ?? 0,
      notes: body.notes ?? null, createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(gymWorkouts).where(eq(gymWorkouts.id, id))
    return NextResponse.json({ ...serializeRow(created as any), exercises: [] }, { status: 201 })
  } catch (e) {
    return handleApiError(e, 'gym/workouts POST')
  }
}
