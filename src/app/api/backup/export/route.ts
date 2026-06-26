import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reminders, plans, planMilestones, gymWorkouts, gymExercises, foodLogs, workProjects, workSessions } from '@/db/schema'
import { serializeRows } from '@/lib/serialize'

export async function GET() {
  const [tasksRows, remindersRows, plansRows, milestonesRows, workoutsRows, exercisesRows, foodLogsRows, workProjectsRows, workSessionsRows] = await Promise.all([
    db.select().from(tasks), db.select().from(reminders), db.select().from(plans),
    db.select().from(planMilestones), db.select().from(gymWorkouts), db.select().from(gymExercises),
    db.select().from(foodLogs), db.select().from(workProjects), db.select().from(workSessions),
  ])

  const payload = {
    version: 2, app: 'dailylife', exportedAt: new Date().toISOString(),
    data: {
      tasks: serializeRows(tasksRows as any[]),
      reminders: serializeRows(remindersRows as any[]),
      plans: serializeRows(plansRows as any[]),
      milestones: serializeRows(milestonesRows as any[]),
      workouts: serializeRows(workoutsRows as any[]),
      exercises: serializeRows(exercisesRows as any[]),
      foodLogs: serializeRows(foodLogsRows as any[]),
      workProjects: serializeRows(workProjectsRows as any[]),
      workSessions: serializeRows(workSessionsRows as any[]),
    },
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="dailylife-backup-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
