import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reminders } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { serializeRows, serializeRow, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const rows = await db.select().from(reminders).orderBy(asc(reminders.done), asc(reminders.datetime))
    return NextResponse.json(serializeRows(rows as any[]))
  } catch (e) {
    return handleApiError(e, 'reminders GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(reminders).values({
      id, title: body.title, notes: body.notes ?? null,
      datetime: parseDate(body.datetime)!, repeat: body.repeat ?? null,
      done: false, createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(reminders).where(eq(reminders.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'reminders POST')
  }
}
