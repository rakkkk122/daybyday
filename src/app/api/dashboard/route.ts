import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reminders, plans, planMilestones, gymWorkouts, foodLogs, workProjects, workSessions } from '@/db/schema'
import { eq, gte, lte, and, asc, desc } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-error'
import { serializeRows } from '@/lib/serialize'

export async function GET() {
  try {
    const nowMs = Date.now()
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [allTasks, allReminders, activePlans, allMilestones, weekWorkouts, todayFoodLogs, activeWorkProjects, allWorkSessions] = await Promise.all([
      db.select().from(tasks).orderBy(asc(tasks.status), desc(tasks.createdAt)),
      db.select().from(reminders).where(eq(reminders.done, false)).orderBy(asc(reminders.datetime)),
      db.select().from(plans).where(eq(plans.status, 'active')),
      db.select().from(planMilestones),
      db.select().from(gymWorkouts).where(gte(gymWorkouts.date, startOfWeek.getTime())),
      db.select().from(foodLogs).where(and(gte(foodLogs.date, startOfDay.getTime()), lte(foodLogs.date, endOfDay.getTime()))),
      db.select().from(workProjects).where(eq(workProjects.status, 'active')),
      db.select().from(workSessions),
    ])

    const todayTasks = allTasks.filter((t) =>
      t.status === 'pending' && (!t.dueDate || (t.dueDate >= startOfDay.getTime() && t.dueDate <= endOfDay.getTime()))
    )
    const upcomingReminders = allReminders.filter((r) => r.datetime >= nowMs).slice(0, 5)
    const todayCalories = todayFoodLogs.reduce((s, l) => s + l.calories, 0)
    const todayProtein = todayFoodLogs.reduce((s, l) => s + l.protein, 0)
    const weekWorkoutMinutes = weekWorkouts.reduce((s, w) => s + w.duration, 0)
    const activePlansCount = activePlans.length
    const milestonesByPlan = allMilestones.reduce<Record<string, typeof allMilestones>>((acc, m) => {
      if (!acc[m.planId]) acc[m.planId] = []
      acc[m.planId].push(m)
      return acc
    }, {})
    const planProgress = activePlans.map((p) => {
      const ms = milestonesByPlan[p.id] || []
      const progress = ms.length === 0 ? 0 : Math.round((ms.filter((m) => m.done).length / ms.length) * 100)
      return { id: p.id, title: p.title, color: p.color, progress }
    })
    const weekWorkMinutes = activeWorkProjects.reduce((s, p) => {
      return s + allWorkSessions.filter((sess) => sess.projectId === p.id && sess.start >= startOfWeek.getTime()).reduce((a, b) => a + b.duration, 0)
    }, 0)

    return NextResponse.json({
      date: new Date().toISOString(),
      stats: {
        tasksPending: allTasks.filter((t) => t.status === 'pending').length,
        tasksToday: todayTasks.length,
        tasksDone: allTasks.filter((t) => t.status === 'done').length,
        remindersUpcoming: allReminders.length,
        todayCalories,
        todayProtein: Math.round(todayProtein),
        weekWorkoutMinutes,
        weekWorkMinutes,
        activePlansCount,
      },
      todayTasks: serializeRows(todayTasks as any[]),
      upcomingReminders: serializeRows(upcomingReminders as any[]),
      planProgress,
    })
  } catch (e) {
    return handleApiError(e, 'dashboard')
  }
}
