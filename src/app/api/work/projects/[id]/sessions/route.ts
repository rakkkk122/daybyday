import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const projectId = (await params).id
    const body = await req.json()
    const start = parseDate(body.start) ?? now()
    const end = body.end ? parseDate(body.end) : null
    const duration = end ? Math.round((end - start) / 60000) : 0
    const id = genId()
    await db.insert(workSessions).values({
      id, projectId, start, end, duration,
      notes: body.notes ?? null, createdAt: now(),
    })
    const [created] = await db.select().from(workSessions).where(eq(workSessions.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'work/sessions POST')
  }
}
