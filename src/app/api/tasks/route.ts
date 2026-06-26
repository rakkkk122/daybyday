import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { serializeRows, serializeRow, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const rows = await db.select().from(tasks).orderBy(asc(tasks.status), desc(tasks.createdAt))
    return NextResponse.json(serializeRows(rows as any[]))
  } catch (e) {
    return handleApiError(e, 'tasks GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(tasks).values({
      id, title: body.title, notes: body.notes ?? null,
      priority: body.priority ?? 'medium', category: body.category ?? 'personal',
      status: body.status ?? 'pending', dueDate: parseDate(body.dueDate),
      createdAt: ts, updatedAt: ts, completedAt: null,
    })
    const [created] = await db.select().from(tasks).where(eq(tasks.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'tasks POST')
  }
}
