import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workProjects, workSessions } from '@/db/schema'
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
    if (body.deadline !== undefined) updates.deadline = parseDate(body.deadline)

    await db.update(workProjects).set(updates).where(eq(workProjects.id, id))
    const [updated] = await db.select().from(workProjects).where(eq(workProjects.id, id))
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const sessions = await db.select().from(workSessions).where(eq(workSessions.projectId, id))
    return NextResponse.json({ ...serializeRow(updated as any), sessions: serializeRows(sessions as any[]) })
  } catch (e) {
    return handleApiError(e, 'work/projects PATCH')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(workSessions).where(eq(workSessions.projectId, id))
    await db.delete(workProjects).where(eq(workProjects.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e, 'work/projects DELETE')
  }
}
