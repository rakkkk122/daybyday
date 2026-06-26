/**
 * Drizzle ORM Schema — Daily Life Manager
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ============ TASKS ============
export const tasks = sqliteTable('Task', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  priority: text('priority').default('medium').notNull(),
  category: text('category').default('personal').notNull(),
  status: text('status').default('pending').notNull(),
  dueDate: integer('dueDate'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
  completedAt: integer('completedAt'),
})

// ============ REMINDERS ============
export const reminders = sqliteTable('Reminder', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  datetime: integer('datetime').notNull(),
  repeat: text('repeat'),
  done: integer('done', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

// ============ PLANS ============
export const plans = sqliteTable('Plan', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  color: text('color').default('emerald').notNull(),
  targetDate: integer('targetDate'),
  status: text('status').default('active').notNull(),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

export const planMilestones = sqliteTable('PlanMilestone', {
  id: text('id').primaryKey(),
  planId: text('planId').notNull(),
  title: text('title').notNull(),
  done: integer('done', { mode: 'boolean' }).default(false).notNull(),
  dueDate: integer('dueDate'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

// ============ GYM ============
export const gymWorkouts = sqliteTable('GymWorkout', {
  id: text('id').primaryKey(),
  date: integer('date').notNull(),
  type: text('type').default('strength').notNull(),
  duration: integer('duration').default(0).notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

export const gymExercises = sqliteTable('GymExercise', {
  id: text('id').primaryKey(),
  workoutId: text('workoutId').notNull(),
  name: text('name').notNull(),
  sets: integer('sets').default(3).notNull(),
  reps: integer('reps').default(10).notNull(),
  weight: real('weight').default(0).notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt').notNull(),
})

// ============ FOOD LOGS ============
export const foodLogs = sqliteTable('FoodLog', {
  id: text('id').primaryKey(),
  date: integer('date').notNull(),
  mealType: text('mealType').default('snack').notNull(),
  foodName: text('foodName').notNull(),
  calories: integer('calories').default(0).notNull(),
  protein: real('protein').default(0).notNull(),
  carbs: real('carbs').default(0).notNull(),
  fats: real('fats').default(0).notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

// ============ WORK PROJECTS ============
export const workProjects = sqliteTable('WorkProject', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  color: text('color').default('amber').notNull(),
  status: text('status').default('active').notNull(),
  deadline: integer('deadline'),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

export const workSessions = sqliteTable('WorkSession', {
  id: text('id').primaryKey(),
  projectId: text('projectId').notNull(),
  start: integer('start').notNull(),
  end: integer('end'),
  duration: integer('duration').default(0).notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt').notNull(),
})

// ============ RELATIONS ============
export const plansRelations = relations(plans, ({ many }) => ({
  milestones: many(planMilestones),
}))

export const planMilestonesRelations = relations(planMilestones, ({ one }) => ({
  plan: one(plans, { fields: [planMilestones.planId], references: [plans.id] }),
}))

export const gymWorkoutsRelations = relations(gymWorkouts, ({ many }) => ({
  exercises: many(gymExercises),
}))

export const gymExercisesRelations = relations(gymExercises, ({ one }) => ({
  workout: one(gymWorkouts, { fields: [gymExercises.workoutId], references: [gymWorkouts.id] }),
}))

export const workProjectsRelations = relations(workProjects, ({ many }) => ({
  sessions: many(workSessions),
}))

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  project: one(workProjects, { fields: [workSessions.projectId], references: [workProjects.id] }),
}))

// ============ TYPES ============
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert
export type PlanMilestone = typeof planMilestones.$inferSelect
export type NewPlanMilestone = typeof planMilestones.$inferInsert
export type GymWorkout = typeof gymWorkouts.$inferSelect
export type NewGymWorkout = typeof gymWorkouts.$inferInsert
export type GymExercise = typeof gymExercises.$inferSelect
export type NewGymExercise = typeof gymExercises.$inferInsert
export type FoodLog = typeof foodLogs.$inferSelect
export type NewFoodLog = typeof foodLogs.$inferInsert
export type WorkProject = typeof workProjects.$inferSelect
export type NewWorkProject = typeof workProjects.$inferInsert
export type WorkSession = typeof workSessions.$inferSelect
export type NewWorkSession = typeof workSessions.$inferInsert
