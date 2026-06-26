import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  tasks,
  reminders,
  plans,
  planMilestones,
  gymWorkouts,
  foodLogs,
  workProjects,
  workSessions,
} from '@/db/schema'
import { gte, lte, and, eq } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-error'

/**
 * GET /api/stats/monthly?year=2026&month=6
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)
    const startMs = startDate.getTime()
    const endMs = endDate.getTime()
    const daysInMonth = new Date(year, month, 0).getDate()

    const [
      monthTasks,
      activePlans,
      allMilestones,
      monthWorkouts,
      monthFoodLogs,
      activeWorkProjects,
      monthWorkSessions,
    ] = await Promise.all([
      db.select().from(tasks).where(
        and(gte(tasks.createdAt, startMs), lte(tasks.createdAt, endMs))
      ),
      db.select().from(plans).where(eq(plans.status, 'active')),
      db.select().from(planMilestones),
      db.select().from(gymWorkouts).where(
        and(gte(gymWorkouts.date, startMs), lte(gymWorkouts.date, endMs))
      ),
      db.select().from(foodLogs).where(
        and(gte(foodLogs.date, startMs), lte(foodLogs.date, endMs))
      ),
      db.select().from(workProjects),
      db.select().from(workSessions).where(
        and(gte(workSessions.start, startMs), lte(workSessions.start, endMs))
      ),
    ])

    const dayOf = (ts: number) => new Date(ts).getDate()

    // ===== TASKS =====
    const tasksPerDay: Array<{ day: number; done: number; pending: number }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTasks = monthTasks.filter(t => dayOf(t.createdAt) === d)
      tasksPerDay.push({
        day: d,
        done: dayTasks.filter(t => t.status === 'done').length,
        pending: dayTasks.filter(t => t.status === 'pending').length,
      })
    }

    const tasksByCategory: Record<string, number> = {}
    monthTasks.forEach(t => {
      tasksByCategory[t.category] = (tasksByCategory[t.category] || 0) + 1
    })

    const tasksByPriority: Record<string, number> = { high: 0, medium: 0, low: 0 }
    monthTasks.forEach(t => {
      tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1
    })

    // ===== GYM =====
    const gymPerDay: Array<{ day: number; minutes: number }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayWorkouts = monthWorkouts.filter(w => dayOf(w.date) === d)
      gymPerDay.push({
        day: d,
        minutes: dayWorkouts.reduce((s, w) => s + w.duration, 0),
      })
    }

    const gymByType: Record<string, number> = {}
    monthWorkouts.forEach(w => {
      gymByType[w.type] = (gymByType[w.type] || 0) + w.duration
    })

    // ===== FOOD =====
    const foodPerDay: Array<{ day: number; calories: number; protein: number }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayFood = monthFoodLogs.filter(f => dayOf(f.date) === d)
      foodPerDay.push({
        day: d,
        calories: dayFood.reduce((s, f) => s + f.calories, 0),
        protein: Math.round(dayFood.reduce((s, f) => s + f.protein, 0)),
      })
    }

    const foodByMeal: Record<string, { count: number; calories: number }> = {}
    monthFoodLogs.forEach(f => {
      if (!foodByMeal[f.mealType]) foodByMeal[f.mealType] = { count: 0, calories: 0 }
      foodByMeal[f.mealType].count++
      foodByMeal[f.mealType].calories += f.calories
    })

    // ===== WORK =====
    const workPerDay: Array<{ day: number; minutes: number }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const daySessions = monthWorkSessions.filter(s => dayOf(s.start) === d)
      workPerDay.push({
        day: d,
        minutes: daySessions.reduce((s, sess) => s + sess.duration, 0),
      })
    }

    const workByProject: Array<{ title: string; minutes: number; color: string }> = []
    const sessionsByProject = monthWorkSessions.reduce<Record<string, number>>((acc, s) => {
      acc[s.projectId] = (acc[s.projectId] || 0) + s.duration
      return acc
    }, {})
    Object.entries(sessionsByProject).forEach(([pid, mins]) => {
      const project = activeWorkProjects.find(p => p.id === pid)
      if (project) {
        workByProject.push({
          title: project.title,
          minutes: mins,
          color: project.color,
        })
      }
    })

    // ===== SUMMARY =====
    const totalTasksDone = monthTasks.filter(t => t.status === 'done').length
    const totalTasksPending = monthTasks.filter(t => t.status === 'pending').length
    const totalGymMinutes = monthWorkouts.reduce((s, w) => s + w.duration, 0)
    const totalGymSessions = monthWorkouts.length
    const totalCalories = monthFoodLogs.reduce((s, f) => s + f.calories, 0)
    const avgCalPerDay = Math.round(totalCalories / daysInMonth)
    const totalProtein = monthFoodLogs.reduce((s, f) => s + f.protein, 0)
    const avgProteinPerDay = Math.round(totalProtein / daysInMonth)
    const totalWorkMinutes = monthWorkSessions.reduce((s, sess) => s + sess.duration, 0)
    const totalWorkHours = Math.round((totalWorkMinutes / 60) * 10) / 10
    const activePlansCount = activePlans.length
    const completedMilestones = allMilestones.filter(m => m.done).length
    const totalMilestones = allMilestones.length

    return NextResponse.json({
      ok: true,
      period: {
        year,
        month,
        monthName: startDate.toLocaleDateString('id-ID', { month: 'long' }),
        daysInMonth,
      },
      summary: {
        totalTasksDone,
        totalTasksPending,
        totalGymMinutes,
        totalGymSessions,
        totalCalories,
        avgCalPerDay,
        avgProteinPerDay,
        totalWorkMinutes,
        totalWorkHours,
        activePlansCount,
        completedMilestones,
        totalMilestones,
      },
      charts: {
        tasksPerDay,
        tasksByCategory: Object.entries(tasksByCategory).map(([name, value]) => ({ name, value })),
        tasksByPriority: Object.entries(tasksByPriority).map(([name, value]) => ({ name, value })),
        gymPerDay,
        gymByType: Object.entries(gymByType).map(([name, value]) => ({ name, value })),
        foodPerDay,
        foodByMeal: Object.entries(foodByMeal).map(([name, v]) => ({
          name,
          count: v.count,
          calories: v.calories,
        })),
        workPerDay,
        workByProject,
      },
    })
  } catch (e) {
    return handleApiError(e, 'stats/monthly')
  }
}
