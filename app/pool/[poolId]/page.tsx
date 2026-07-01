'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Pool } from '@/lib/genlayer/types'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import { ExclusionReef } from '@/components/harbor/ExclusionReef'
import { UnderwriterBasin } from '@/components/harbor/UnderwriterBasin'
import { formatGEN } from '@/lib/format-gen'
import { CONTRACT_ADDRESS, buildExplorerTxUrl } from '@/lib/genlayer/client'
import { Anchor, ChevronLeft, Shield, CheckCircle, Loader } from 'lucide-react'

type BuyState = 'idle' | 'set_amount' | 'reviewing' | 'awaiting_signature' | 'submitted' | 'success' | 'failed'

const DURATIONS = [
  { label: '7 days', days: 7, premiumBps: 150 },
  { label: '14 days', days: 14, premiumBps: 250 },
  { label: '30 days', days: 30, premiumBps: 450 },
  { label: '90 days', days: 90, premiumBps: 1100 },
]

export default function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>()
  const router = useRouter()
  const [pool, setPool] = useState<Pool | null>(null)
  const [coverAmount, setCoverAmount] = useState('')
  const [durationIdx, setDurationIdx] = useState(2)
  const [agreed, setAgreed] = useState(false)
  const [buyState, setBuyState] = useState<BuyState>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    import('@/lib/genlayer/contracts').then(m => m.getPool(poolId)).then(setPool).catch(() => setError('Pool not found.'))
  }, [poolId])

  const duration = DURATIONS[durationIdx]
  const coverWei = coverAmount ? BigInt(Math.floor(Number(coverAmount) * 1e18)) : 0n
  // Use pool's min_premium_bps as the floor so the contract never rejects for low premium
  const effectiveBps = Math.max(duration.premiumBps, Number(pool?.min_premium_bps ?? 200))
  const premiumWei = coverWei > 0n ? (coverWei * BigInt(effectiveBps)) / 10000n : 0n

  const handleBuy = async () => {
    if (!agreed || !coverAmount || Number(coverAmount) <= 0) return
    setError(null)
    setBuyState('awaiting_signature')
    try {
      const { buyCover, waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await buyCover({
        pool_id: poolId,
        cover_limit: coverWei,
        duration_days: BigInt(duration.days),
        premium_wei: premiumWei,
      })
      setTxHash(hash)
      setBuyState('submitted')
      await waitForTx(hash)
      setBuyState('success')
    } catch (err: any) {
      setError(err?.message ?? 'Transaction failed')
      setBuyState('failed')
    }
  }

  if (!pool) {
    if (error) return <div className="p-10 text-center text-sm font-mono" style={{ color: 'var(--reef-red)' }}>{error}</div>
    return <div className="p-10 text-center text-sm font-mono" style={{ color: 'var(--salt-grey)' }}>Loading…</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Back */}
      <Link href="/map" className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Harbor Map
      </Link>

      {/* Pool header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4" style={{ color: 'var(--beacon-cyan)' }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>
              {CATEGORY_LABELS[pool.category] ?? pool.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
            {pool.name}
          </h1>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--salt-grey)' }}>
            {pool.terms_summary}
          </p>
        </div>
        <span
          className="text-xs font-mono px-3 py-1 rounded-full"
          style={{
            background: pool.active ? 'rgba(52, 211, 153, 0.09)' : 'rgba(148, 163, 184, 0.09)',
            color: pool.active ? 'var(--payout-mint)' : 'var(--salt-grey)',
          }}
        >
          {pool.active ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-3 space-y-6">
          <UnderwriterBasin pool={pool} />
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--tide-blue)' }} />
              <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Terms</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fog-white)' }}>{pool.terms_summary}</p>
          </div>
          <ExclusionReef exclusions={pool.exclusions_summary} />
        </div>

        {/* Right: buy cover form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border p-6 space-y-5 sticky top-16" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>
              Get Cover
            </p>

            {buyState === 'success' ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--payout-mint)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--payout-mint)' }}>Policy issued!</p>
                <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Your cover is active. View it in My Cabin.</p>
                <Link href="/cabin">
                  <button className="mt-2 w-full py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--beacon-cyan)', color: 'var(--ledger-ink)' }}>
                    Go to My Cabin
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Cover amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Cover Amount (GEN)</label>
                  <input
                    type="number"
                    value={coverAmount}
                    onChange={e => setCoverAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none"
                    style={{ background: 'var(--ledger-ink)', border: '1px solid var(--line)', color: 'var(--fog-white)' }}
                  />
                  <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>
                    Max: {formatGEN(pool.liquidity_available)}
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATIONS.map((d, i) => (
                      <button
                        key={d.days}
                        onClick={() => setDurationIdx(i)}
                        className="py-2 rounded-lg text-xs font-mono border transition-all"
                        style={{
                          background: durationIdx === i ? 'var(--tide-blue)' : 'var(--glass)',
                          borderColor: durationIdx === i ? 'var(--tide-blue)' : 'var(--line)',
                          color: durationIdx === i ? 'var(--fog-white)' : 'var(--salt-grey)',
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Premium preview */}
                <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--glass)', border: '1px solid var(--line)' }}>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span style={{ color: 'var(--salt-grey)' }}>Cover Amount</span>
                    <span style={{ color: 'var(--fog-white)' }}>{coverAmount ? `${coverAmount} GEN` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span style={{ color: 'var(--salt-grey)' }}>Premium Rate</span>
                    <span style={{ color: 'var(--salt-grey)' }}>{(effectiveBps / 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono font-semibold border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                    <span style={{ color: 'var(--salt-grey)' }}>You Pay</span>
                    <span style={{ color: 'var(--beacon-cyan)' }}>{premiumWei > 0n ? formatGEN(premiumWei) : '—'}</span>
                  </div>
                </div>

                {/* Terms agreement */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--beacon-cyan)' }}
                  />
                  <span className="text-[10px] font-mono leading-relaxed" style={{ color: 'var(--salt-grey)' }}>
                    I have read and agree to the pool terms and exclusions. I understand that claims are settled by GenLayer validators.
                  </span>
                </label>

                {/* Action button */}
                {buyState === 'idle' && (
                  <button
                    onClick={handleBuy}
                    disabled={!agreed || !coverAmount || Number(coverAmount) <= 0 || !pool.active}
                    className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: agreed && coverAmount && Number(coverAmount) > 0 && pool.active ? 'var(--beacon-cyan)' : 'rgba(148, 163, 184, 0.13)',
                      color: agreed && coverAmount && Number(coverAmount) > 0 && pool.active ? 'var(--ledger-ink)' : 'var(--salt-grey)',
                      cursor: !agreed || !coverAmount || !pool.active ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {!pool.active ? 'Pool Paused' : 'Buy Cover'}
                  </button>
                )}
                {buyState === 'awaiting_signature' && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--beacon-cyan)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--signal-amber)' }}>Waiting for signature…</span>
                  </div>
                )}
                {buyState === 'submitted' && (
                  <div className="space-y-1 text-center">
                    <p className="text-xs font-mono animate-pulse" style={{ color: 'var(--beacon-cyan)' }}>Waiting for consensus…</p>
                    {txHash && <a href={buildExplorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="text-[10px] font-mono underline" style={{ color: 'var(--salt-grey)' }}>View tx ↗</a>}
                  </div>
                )}
                {buyState === 'failed' && (
                  <div className="space-y-2">
                    {error && <p className="text-[10px] font-mono text-center" style={{ color: 'var(--reef-red)' }}>{error}</p>}
                    <button onClick={() => setBuyState('idle')} className="w-full py-2 rounded text-xs font-mono" style={{ background: 'rgba(239, 68, 68, 0.09)', color: 'var(--reef-red)' }}>
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
