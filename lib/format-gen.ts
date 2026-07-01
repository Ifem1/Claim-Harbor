export function formatGEN(wei: bigint | number | string, decimals = 2): string {
  const val = BigInt(typeof wei === 'string' ? Math.floor(Number(wei)) : wei)
  const gen = Number(val) / 1e18
  if (gen === 0) return '0 GEN'
  if (gen < 0.01) return '< 0.01 GEN'
  return `${gen.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })} GEN`
}

export function formatPct(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`
}

export function formatDate(ts: number): string {
  return new Date(ts < 1e12 ? ts * 1000 : ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function daysFromNow(ts: number): number {
  const ms = ts < 1e12 ? ts * 1000 : ts
  return Math.ceil((ms - Date.now()) / 86400000)
}
