/**
 * Database initialization — CREATE TABLE IF NOT EXISTS statements.
 */

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Task" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "priority" text DEFAULT 'medium' NOT NULL,
  "category" text DEFAULT 'personal' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "dueDate" integer,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL,
  "completedAt" integer
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "datetime" integer NOT NULL,
  "repeat" text,
  "done" integer DEFAULT 0 NOT NULL,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "Plan" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "color" text DEFAULT 'emerald' NOT NULL,
  "targetDate" integer,
  "status" text DEFAULT 'active' NOT NULL,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "PlanMilestone" (
  "id" text PRIMARY KEY NOT NULL,
  "planId" text NOT NULL,
  "title" text NOT NULL,
  "done" integer DEFAULT 0 NOT NULL,
  "dueDate" integer,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "GymWorkout" (
  "id" text PRIMARY KEY NOT NULL,
  "date" integer NOT NULL,
  "type" text DEFAULT 'strength' NOT NULL,
  "duration" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "GymExercise" (
  "id" text PRIMARY KEY NOT NULL,
  "workoutId" text NOT NULL,
  "name" text NOT NULL,
  "sets" integer DEFAULT 3 NOT NULL,
  "reps" integer DEFAULT 10 NOT NULL,
  "weight" real DEFAULT 0 NOT NULL,
  "notes" text,
  "createdAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "FoodLog" (
  "id" text PRIMARY KEY NOT NULL,
  "date" integer NOT NULL,
  "mealType" text DEFAULT 'snack' NOT NULL,
  "foodName" text NOT NULL,
  "calories" integer DEFAULT 0 NOT NULL,
  "protein" real DEFAULT 0 NOT NULL,
  "carbs" real DEFAULT 0 NOT NULL,
  "fats" real DEFAULT 0 NOT NULL,
  "notes" text,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "WorkProject" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "color" text DEFAULT 'amber' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "deadline" integer,
  "createdAt" integer NOT NULL,
  "updatedAt" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "WorkSession" (
  "id" text PRIMARY KEY NOT NULL,
  "projectId" text NOT NULL,
  "start" integer NOT NULL,
  "end" integer,
  "duration" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "createdAt" integer NOT NULL
);
`

export function initDb(db: any) {
  const statements = CREATE_TABLES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of statements) {
    db.exec(stmt + ';')
  }
  console.log('[db] Initialized: 9 tables ready')
}
