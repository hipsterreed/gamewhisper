export function log(level: 'info' | 'warn' | 'error', msg: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...data }))
}
