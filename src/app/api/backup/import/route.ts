import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reminders, plans, planMilestones, gymWorkouts, gymExercises, foodLogs, workProjects, workSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { parseDate, now } from '@/lib/serialize'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    let body: any
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const data = body?.data
    if (!data || typeof data !== 'object') return NextResponse.json({ error: 'Missing `data` field' }, { status: 400 })

    const mode: 'merge' | 'replace' = body.mode === 'replace' ? 'replace' : 'merge'
    const result = {
      inserted: { tasks: 0, reminders: 0, plans: 0, milestones: 0, workouts: 0, exercises: 0, foodLogs: 0, workProjects: 0, workSessions: 0 },
      skipped: 0, errors: [] as string[],
    }
    const ts = now()

    if (mode === 'replace') {
      await Promise.all([
        db.delete(tasks), db.delete(reminders), db.delete(planMilestones),
        db.delete(gymExercises), db.delete(gymWorkouts), db.delete(foodLogs),
        db.delete(workSessions), db.delete(workProjects),
      ])
      await db.delete(plans)
    }

    const exists = async (table: any, id: string) => {
      const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1)
      return !!row
    }
    const insertIfNew = async (table: any, row: any, counterKey: keyof typeof result.inserted, transform: (r: any) => any) => {
      if (!row?.id) return
      try {
        if (mode === 'merge') {
          const found = await exists(table, row.id)
          if (found) { result.skipped++; return }
        }
        await db.insert(table).values(transform(row))
        result.inserted[counterKey]++
      } catch (e: any) { result.errors.push(`${String(counterKey)} ${row.id}: ${e.message}`) }
    }

    if (Array.isArray(data.plans)) for (const p of data.plans) await insertIfNew(plans, p, 'plans', (r) => ({
      id: r.id, title: r.title, description: r.description ?? null, color: r.color ?? 'emerald',
      targetDate: parseDate(r.targetDate), status: r.status ?? 'active',
      createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.milestones)) for (const m of data.milestones) await insertIfNew(planMilestones, m, 'milestones', (r) => ({
      id: r.id, planId: r.planId, title: r.title, done: !!r.done, dueDate: parseDate(r.dueDate),
      createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.tasks)) for (const t of data.tasks) await insertIfNew(tasks, t, 'tasks', (r) => ({
      id: r.id, title: r.title, notes: r.notes ?? null, priority: r.priority ?? 'medium',
      category: r.category ?? 'personal', status: r.status ?? 'pending',
      dueDate: parseDate(r.dueDate), completedAt: parseDate(r.completedAt),
      createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.reminders)) for (const r of data.reminders) await insertIfNew(reminders, r, 'reminders', (row) => ({
      id: row.id, title: row.title, notes: row.notes ?? null, datetime: parseDate(row.datetime)!,
      repeat: row.repeat ?? null, done: !!row.done,
      createdAt: parseDate(row.createdAt) ?? ts, updatedAt: parseDate(row.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.workouts)) for (const w of data.workouts) await insertIfNew(gymWorkouts, w, 'workouts', (r) => ({
      id: r.id, date: parseDate(r.date) ?? ts, type: r.type ?? 'strength',
      duration: r.duration ?? 0, notes: r.notes ?? null,
      createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.exercises)) for (const e of data.exercises) await insertIfNew(gymExercises, e, 'exercises', (r) => ({
      id: r.id, workoutId: r.workoutId, name: r.name, sets: r.sets ?? 3, reps: r.reps ?? 10,
      weight: r.weight ?? 0, notes: r.notes ?? null, createdAt: parseDate(r.createdAt) ?? ts,
    }))
    if (Array.isArray(data.foodLogs)) for (const f of data.foodLogs) await insertIfNew(foodLogs, f, 'foodLogs', (r) => ({
      id: r.id, date: parseDate(r.date) ?? ts, mealType: r.mealType ?? 'snack', foodName: r.foodName,
      calories: r.calories ?? 0, protein: r.protein ?? 0, carbs: r.carbs ?? 0, fats: r.fats ?? 0,
      notes: r.notes ?? null, createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.workProjects)) for (const p of data.workProjects) await insertIfNew(workProjects, p, 'workProjects', (r) => ({
      id: r.id, title: r.title, description: r.description ?? null, color: r.color ?? 'amber',
      status: r.status ?? 'active', deadline: parseDate(r.deadline),
      createdAt: parseDate(r.createdAt) ?? ts, updatedAt: parseDate(r.updatedAt) ?? ts,
    }))
    if (Array.isArray(data.workSessions)) for (const s of data.workSessions) await insertIfNew(workSessions, s, 'workSessions', (r) => ({
      id: r.id, projectId: r.projectId, start: parseDate(r.start) ?? ts, end: parseDate(r.end),
      duration: r.duration ?? 0, notes: r.notes ?? null, createdAt: parseDate(r.createdAt) ?? ts,
    }))

    return NextResponse.json({ ok: true, mode, ...result })
  } catch (e) {
    return handleApiError(e, 'backup/import')
  }
}
