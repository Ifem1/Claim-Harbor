import { GENLAYER_STUDIONET } from '@/lib/genlayer/chains'

export function explorerTxUrl(hash: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/tx/${hash}`
}

export function explorerAddressUrl(address: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/address/${address}`
}

export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function shortenHash(hash: string): string {
  if (!hash) return ''
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function formatTimestamp(ts: bigint | number | string | undefined | null): string {
  if (!ts && ts !== 0) return ''
  // ISO string (from new contract)
  if (typeof ts === 'string') {
    const d = new Date(ts)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    // Numeric string (unix timestamp)
    const n = Number(ts)
    if (!isNaN(n)) return new Date(n * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return ts
  }
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
