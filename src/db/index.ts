/**
 * Drizzle ORM instance using node:sqlite (Node.js 22+ built-in) + sqlite-proxy adapter.
 *
 * TIDAK ada native binary dependency. Jalan di semua platform termasuk Termux Android ARM64.
 * Requirement: Node.js 22+ dengan flag --experimental-sqlite
 */

import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { DatabaseSync } from 'node:sqlite'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as schema from './schema'
import { initDb } from './init'

const envDbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

let envPath = envDbUrl
if (envPath.startsWith('file:')) {
  envPath = envPath.slice(5)
}

let dbPath: string
if (path.isAbsolute(envPath)) {
  dbPath = envPath
} else {
  dbPath = path.resolve(process.cwd(), envPath)
}

const projectRoot = process.cwd()
const fallbackPath = path.resolve(projectRoot, 'db/custom.db')

try {
  const dir = path.dirname(dbPath)
  fs.accessSync(path.dirname(dir) || dir, fs.constants.W_OK)
} catch {
  console.warn(`[db] DATABASE_URL path "${dbPath}" not accessible, falling back to "${fallbackPath}"`)
  dbPath = fallbackPath
}

const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`[db] Created directory: ${dir}`)
  } catch (e: any) {
    console.error(`[db] Failed to create directory "${dir}":`, e.message)
    dbPath = fallbackPath
    const fallbackDir = path.dirname(fallbackPath)
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true })
    }
  }
}

console.log(`[db] Database path: ${dbPath}`)

const globalForDb = globalThis as unknown as {
  _sqliteDb?: DatabaseSync
  _drizzle?: ReturnType<typeof drizzle>
}

if (!globalForDb._sqliteDb) {
  try {
    globalForDb._sqliteDb = new DatabaseSync(dbPath)
    globalForDb._sqliteDb.exec('PRAGMA journal_mode = WAL;')
    initDb(globalForDb._sqliteDb)
  } catch (e) {
    console.error('[db] Failed to initialize SQLite database:', e)
    throw e
  }
}

const sqliteDb = globalForDb._sqliteDb

const queryCallback = async (
  sql: string,
  params: any[],
  method: 'all' | 'get' | 'values' | 'run'
): Promise<{ rows: any[] }> => {
  try {
    const stmt = sqliteDb.prepare(sql)
    stmt.setReturnArrays(true)
    let rows: any[] = []
    switch (method) {
      case 'all':
        rows = stmt.all(...params) as any[]
        break
      case 'get': {
        const row = stmt.get(...params)
        rows = row ? [row] : []
        break
      }
      case 'values':
        rows = stmt.all(...params) as any[]
        break
      case 'run':
        stmt.run(...params)
        rows = []
        break
      default:
        rows = stmt.all(...params) as any[]
    }
    return { rows }
  } catch (e: any) {
    console.error('[db] Query error:', e.message)
    console.error('[db] SQL:', sql)
    console.error('[db] Params:', params)
    throw e
  }
}

const batchCallback = async (
  queries: Array<{ sql: string; params: any[]; method: 'all' | 'get' | 'values' | 'run' }>
): Promise<{ rows: any[] }[]> => {
  const results: { rows: any[] }[] = []
  for (const q of queries) {
    results.push(await queryCallback(q.sql, q.params, q.method))
  }
  return results
}

if (!globalForDb._drizzle) {
  globalForDb._drizzle = drizzle(queryCallback as any, batchCallback as any, { schema } as any)
}

export const db = globalForDb._drizzle
export { schema, sqliteDb }
