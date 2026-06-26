import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reminders, plans, planMilestones, gymWorkouts, foodLogs as foodLogsTable, workProjects, workSessions } from '@/db/schema'
import { gte } from 'drizzle-orm'
import { askAIJSON } from '@/lib/ai'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const thirtyDaysAgoMs = thirtyDaysAgo.getTime()

    const [allTasks, allPlans, allMilestones, allWorkouts, allFoodLogs, allWorkProjects, allWorkSessions] = await Promise.all([
      db.select().from(tasks).where(gte(tasks.createdAt, thirtyDaysAgoMs)),
      db.select().from(plans),
      db.select().from(planMilestones),
      db.select().from(gymWorkouts).where(gte(gymWorkouts.date, thirtyDaysAgoMs)),
      db.select().from(foodLogsTable).where(gte(foodLogsTable.date, thirtyDaysAgoMs)),
      db.select().from(workProjects),
      db.select().from(workSessions).where(gte(workSessions.start, thirtyDaysAgoMs)),
    ])

    const tasksDone = allTasks.filter((t) => t.status === 'done').length
    const tasksPending = allTasks.filter((t) => t.status === 'pending').length
    const overdueTasks = allTasks.filter((t) => t.status === 'pending' && t.dueDate && t.dueDate < now.getTime()).length

    const workoutMinutes = allWorkouts.reduce((s, w) => s + w.duration, 0)
    const workoutCount = allWorkouts.length
    const workoutTypes = allWorkouts.reduce<Record<string, number>>((acc, w) => { acc[w.type] = (acc[w.type] || 0) + 1; return acc }, {})

    const totalCal = allFoodLogs.reduce((s, l) => s + l.calories, 0)
    const avgCalPerDay = Math.round(totalCal / 30)
    const avgProtein = Math.round(allFoodLogs.reduce((s, l) => s + l.protein, 0) / 30)

    const workMinutes = allWorkSessions.reduce((s, sess) => s + sess.duration, 0)

    const activePlans = allPlans.filter((p) => p.status === 'active')
    const milestonesByPlan = allMilestones.reduce<Record<string, typeof allMilestones>>((acc, m) => {
      if (!acc[m.planId]) acc[m.planId] = []
      acc[m.planId].push(m)
      return acc
    }, {})
    const planProgress = activePlans.map((p) => {
      const ms = milestonesByPlan[p.id] || []
      const progress = ms.length === 0 ? 0 : Math.round((ms.filter((m) => m.done).length / ms.length) * 100)
      return { title: p.title, progress }
    })

    const dataSummary = {
      range: '30 hari terakhir',
      tasks: { done: tasksDone, pending: tasksPending, overdue: overdueTasks },
      gym: { totalSessions: workoutCount, totalMinutes: workoutMinutes, types: workoutTypes },
      food: { avgCaloriesPerDay: avgCalPerDay, avgProteinPerDay: avgProtein },
      work: { totalFocusMinutes: workMinutes, activeProjects: allWorkProjects.filter((p) => p.status === 'active').length },
      plans: { activeCount: activePlans.length, progressList: planProgress },
    }

    const systemPrompt = `Kamu adalah life coach personal yang menganalisis pola hidup user 30 hari terakhir.
Temukan POLA dan INSIGHT yang bermanfaat, lalu berikan REKOMENDASI konkret.
WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{"summary":"1-2 kalimat","insights":[{"type":"productivity|food|gym|work|plans","severity":"positive|neutral|warning","title":"...","body":"3-4 kalimat dengan angka","recommendation":"1-2 kalimat apa yang harus dilakukan"}]}
Berikan 3-5 insight terpenting.`

    const userMessage = `Berikut ringkasan data 30 hari user:\n${JSON.stringify(dataSummary, null, 2)}\n\nAnalisis dan berikan insight.`

    const result = await askAIJSON<{ summary: string; insights: Array<{ type: string; severity: 'positive' | 'neutral' | 'warning'; title: string; body: string; recommendation: string }> }>(
      systemPrompt, userMessage, { temperature: 0.6 }
    )

    return NextResponse.json({
      ok: true,
      generatedAt: now.toISOString(),
      dataRange: dataSummary.range,
      summary: result.summary || '',
      insights: result.insights || [],
      rawStats: dataSummary,
    })
  } catch (e: any) {
    return handleApiError(e, 'ai/insights')
  }
}
