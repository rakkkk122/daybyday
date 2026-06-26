import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { plans, planMilestones } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { serializeRow, serializeRows, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const planRows = await db.select().from(plans).orderBy(asc(plans.status), desc(plans.createdAt))
    const allMilestones = await db.select().from(planMilestones)
    const milestonesByPlan = allMilestones.reduce<Record<string, typeof allMilestones>>((acc, m) => {
      if (!acc[m.planId]) acc[m.planId] = []
      acc[m.planId].push(m)
      return acc
    }, {})
    const result = planRows.map((p) => ({
      ...serializeRow(p as any),
      milestones: serializeRows(milestonesByPlan[p.id] || []),
    }))
    return NextResponse.json(result)
  } catch (e) {
    return handleApiError(e, 'plans GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(plans).values({
      id, title: body.title, description: body.description ?? null,
      color: body.color ?? 'emerald', targetDate: parseDate(body.targetDate),
      status: body.status ?? 'active', createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(plans).where(eq(plans.id, id))
    return NextResponse.json({ ...serializeRow(created as any), milestones: [] }, { status: 201 })
  } catch (e) {
    return handleApiError(e, 'plans POST')
  }
}
