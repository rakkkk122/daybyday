import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { foodLogs, gymWorkouts } from '@/db/schema'
import { gte, desc } from 'drizzle-orm'
import { askAISmartJSON } from '@/lib/ai'
import { handleApiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const mealType: string = body.mealType || 'lunch'
    const note: string = body.note || ''

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)

    const [recentFood, todayWorkouts, todayFood] = await Promise.all([
      db.select().from(foodLogs).where(gte(foodLogs.date, sevenDaysAgo.getTime())).orderBy(desc(foodLogs.date)).limit(50),
      db.select().from(gymWorkouts).where(gte(gymWorkouts.date, startOfToday.getTime())),
      db.select().from(foodLogs).where(gte(foodLogs.date, startOfToday.getTime())),
    ])

    const totalCal7d = recentFood.reduce((s, l) => s + l.calories, 0)
    const avgCalPerDay = Math.round(totalCal7d / 7)
    const avgProtein = Math.round(recentFood.reduce((s, l) => s + l.protein, 0) / 7)
    const todayCalories = todayFood.reduce((s, l) => s + l.calories, 0)
    const todayProtein = todayFood.reduce((s, l) => s + l.protein, 0)
    const gymToday = todayWorkouts.reduce((s, w) => s + w.duration, 0)

    const target = { calories: 2000, protein: 120, carbs: 250, fats: 65 }
    const remainingCalories = Math.max(0, target.calories - todayCalories)
    const remainingProtein = Math.max(0, target.protein - todayProtein)

    const context = {
      userGoal: 'maintenance / healthy eating (Indonesia context)',
      targets: target,
      todayConsumed: { calories: todayCalories, protein: Math.round(todayProtein) },
      remaining: { calories: remainingCalories, protein: remainingProtein },
      last7DaysAvg: { caloriesPerDay: avgCalPerDay, proteinGrams: avgProtein },
      gymDoneTodayMinutes: gymToday,
      requestedMeal: mealType,
      userNote: note || null,
      recentFoods: recentFood.slice(0, 10).map((f) => ({ name: f.foodName, meal: f.mealType, cal: f.calories, protein: f.protein })),
    }

    const systemPrompt = `Kamu adalah asisten nutrisi personal untuk user di Indonesia.
Berikan SARAN MAKANAN konkret yang sesuai konteks Indonesia, realistis, dan membantu mencapai sisa target kalori/protein.
WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{"suggestions":[{"name":"...","calories":0,"protein":0,"carbs":0,"fats":0,"reason":"..."}]}
Berikan 3-4 suggestion. "reason" jelaskan singkat kenapa cocak (1 kalimat).`

    const userMessage = `Konteks data user:\n${JSON.stringify(context, null, 2)}\n\nBerikan 3 saran makanan untuk ${mealType}.`

    const { data: result, engine, model } = await askAISmartJSON<{
      suggestions: Array<{ name: string; calories: number; protein: number; carbs: number; fats: number; reason: string }>
    }>(systemPrompt, userMessage, {
      temperature: 0.6,
      timeoutMs: 180000, // Ollama 1.5b bisa lambat untuk JSON
    })

    return NextResponse.json({
      ok: true,
      engine,
      model,
      context: { todayConsumed: context.todayConsumed, remaining: context.remaining, gymTodayMinutes: gymToday, avgCalPerDay },
      suggestions: result.suggestions || [],
    })
  } catch (e: any) {
    return handleApiError(e, 'ai/food-suggest')
  }
}
