/** Helpers untuk convert timestamp antara Drizzle (integer ms) dan client (ISO string). */

export function serializeRow<T extends Record<string, any>>(row: T): T {
  if (!row) return row
  const out: Record<string, any> = { ...row }
  for (const key of Object.keys(out)) {
    const v = out[key]
    if (typeof v === 'number' && isTimestampField(key)) {
      out[key] = v ? new Date(v).toISOString() : null
    }
  }
  return out as T
}

export function serializeRows<T extends Record<string, any>>(rows: T[]): T[] {
  return rows.map(serializeRow)
}

export function parseDate(value: any): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  return new Date(value).getTime()
}

export function now(): number {
  return Date.now()
}

const TIMESTAMP_FIELDS = new Set([
  'dueDate', 'createdAt', 'updatedAt', 'completedAt',
  'datetime', 'targetDate', 'date', 'deadline', 'start', 'end',
])

function isTimestampField(key: string): boolean {
  return TIMESTAMP_FIELDS.has(key)
}
