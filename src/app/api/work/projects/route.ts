import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workProjects, workSessions } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { serializeRow, serializeRows, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const projects = await db.select().from(workProjects).orderBy(asc(workProjects.status), desc(workProjects.createdAt))
    const sessions = await db.select().from(workSessions)
    const sessionsByProject = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
      if (!acc[s.projectId]) acc[s.projectId] = []
      acc[s.projectId].push(s)
      return acc
    }, {})
    const result = projects.map((p) => ({
      ...serializeRow(p as any),
      sessions: serializeRows(sessionsByProject[p.id] || []),
    }))
    return NextResponse.json(result)
  } catch (e) {
    return handleApiError(e, 'work/projects GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(workProjects).values({
      id, title: body.title, description: body.description ?? null,
      color: body.color ?? 'amber', status: body.status ?? 'active',
      deadline: parseDate(body.deadline), createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(workProjects).where(eq(workProjects.id, id))
    return NextResponse.json({ ...serializeRow(created as any), sessions: [] }, { status: 201 })
  } catch (e) {
    return handleApiError(e, 'work/projects POST')
  }
}
