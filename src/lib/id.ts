/** Generate CUID-like unique ID. */
export function genId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `c${ts}${rand}`
}
