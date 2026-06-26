import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { foodLogs } from '@/db/schema'
import { eq, gte, lte, asc, and } from 'drizzle-orm'
import { serializeRows, serializeRow, parseDate, now } from '@/lib/serialize'
import { genId } from '@/lib/id'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    let rows
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      rows = await db.select().from(foodLogs)
        .where(and(gte(foodLogs.date, start.getTime()), lte(foodLogs.date, end.getTime())))
        .orderBy(asc(foodLogs.date))
    } else {
      rows = await db.select().from(foodLogs).orderBy(asc(foodLogs.date))
    }
    return NextResponse.json(serializeRows(rows as any[]))
  } catch (e) {
    return handleApiError(e, 'food/logs GET')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ts = now()
    const id = genId()
    await db.insert(foodLogs).values({
      id, date: parseDate(body.date) ?? ts,
      mealType: body.mealType ?? 'snack', foodName: body.foodName,
      calories: body.calories ?? 0, protein: body.protein ?? 0,
      carbs: body.carbs ?? 0, fats: body.fats ?? 0,
      notes: body.notes ?? null, createdAt: ts, updatedAt: ts,
    })
    const [created] = await db.select().from(foodLogs).where(eq(foodLogs.id, id))
    return NextResponse.json(serializeRow(created as any), { status: 201 })
  } catch (e) {
    return handleApiError(e, 'food/logs POST')
  }
}
