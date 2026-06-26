import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { planMilestones } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { serializeRow, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })
    const ts = now()
    const id = genId()
    await db.insert(planMilestones).values({
      id, planId: body.planId, title: body.title,
      dueDate: parseDate(body.dueDate), done: false,
      createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(planMilestones).where(eq(planMilestones.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'milestones POST')
  }
}
