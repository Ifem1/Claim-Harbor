'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Pool, Claim } from '@/lib/genlayer/types'
import { STATUS_LABELS } from '@/lib/genlayer/types'
import { UnderwriterBasin } from '@/components/harbor/UnderwriterBasin'
import { formatGEN, formatDate } from '@/lib/format-gen'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { claimStatusColor } from '@/lib/visibility'
import { ChevronLeft, Pause, Play, Plus, Minus, Loader } from 'lucide-react'


export default function PoolManagementPage() {
  const { poolId } = useParams<{ poolId: string }>()
  const [pool, setPool] = useState<Pool | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [addLiquidity, setAddLiquidity] = useState('')
  const [withdraw, setWithdraw] = useState('')
  const [addState, setAddState] = useState<'idle' | 'busy'>('idle')
  const [withdrawState, setWithdrawState] = useState<'idle' | 'busy'>('idle')
  const [pauseState, setPauseState] = useState<'idle' | 'busy'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txMsg, setTxMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    Promise.all([
      import('@/lib/genlayer/contracts').then(m => m.getPool(poolId)),
      import('@/lib/genlayer/contracts').then(m => m.getPoolClaims(poolId)),
    ]).then(([p, c]) => { setPool(p); setClaims(c) }).catch(() => setError('Pool not found.'))
  }, [poolId])

  const reloadPool = async () => {
    const { getPool } = await import('@/lib/genlayer/contracts')
    setPool(await getPool(poolId))
  }

  const handleAddLiquidity = async () => {
    const amount = parseFloat(addLiquidity)
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount'); return }
    setError(null); setTxMsg(null); setAddState('busy')
    try {
      const { addPoolLiquidity, waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await addPoolLiquidity(poolId, BigInt(Math.floor(amount * 1e18)))
      setTxMsg('Confirming…')
      await waitForTx(hash)
      setTxMsg('Liquidity added!')
      setAddLiquidity('')
      await reloadPool()
    } catch (e: any) {
      setError(e?.message ?? 'Transaction failed')
    } finally {
      setAddState('idle')
      setTimeout(() => setTxMsg(null), 4000)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdraw)
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount'); return }
    setError(null); setTxMsg(null); setWithdrawState('busy')
    try {
      const { withdrawUnlockedLiquidity, waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await withdrawUnlockedLiquidity(poolId, BigInt(Math.floor(amount * 1e18)))
      setTxMsg('Confirming…')
      await waitForTx(hash)
      setTxMsg('Withdrawal successful!')
      setWithdraw('')
      await reloadPool()
    } catch (e: any) {
      setError(e?.message ?? 'Transaction failed')
    } finally {
      setWithdrawState('idle')
      setTimeout(() => setTxMsg(null), 4000)
    }
  }

  const handleTogglePause = async () => {
    if (!pool) return
    setError(null); setPauseState('busy')
    try {
      const { setPoolActive, waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await setPoolActive(poolId, !pool.active)
      await waitForTx(hash)
      await reloadPool()
    } catch (e: any) {
      setError(e?.message ?? 'Transaction failed')
    } finally {
      setPauseState('idle')
    }
  }

  const inputStyle = {
    background: 'var(--ledger-ink)',
    border: '1px solid var(--line)',
    color: 'var(--fog-white)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  } as React.CSSProperties

  if (!pool) {
    return <div className="p-10 text-center text-sm font-mono" style={{ color: error ? 'var(--reef-red)' : 'var(--salt-grey)' }}>{error ?? 'Loading…'}</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <Link href="/underwriter" className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Underwriter Basin
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>{pool.name}</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Pool management</p>
        </div>
        <button
          onClick={handleTogglePause}
          disabled={pauseState === 'busy'}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border transition-all"
          style={{
            background: 'transparent',
            borderColor: pool.active ? 'var(--reef-red)' : 'var(--payout-mint)',
            color: pool.active ? 'var(--reef-red)' : 'var(--payout-mint)',
            opacity: pauseState === 'busy' ? 0.6 : 1,
          }}
        >
          {pauseState === 'busy' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : pool.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {pool.active ? 'Pause Pool' : 'Unpause Pool'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basin overview */}
        <div className="lg:col-span-2 space-y-5">
          <UnderwriterBasin pool={pool} />

          {error && <p className="text-xs font-mono px-1" style={{ color: 'var(--reef-red)' }}>{error}</p>}
          {txMsg && <p className="text-xs font-mono px-1" style={{ color: 'var(--payout-mint)' }}>{txMsg}</p>}

          {/* Add liquidity */}
          <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>Add Liquidity</p>
            <div className="flex gap-3">
              <input
                type="number"
                value={addLiquidity}
                onChange={e => setAddLiquidity(e.target.value)}
                placeholder="Amount (GEN)"
                style={inputStyle}
              />
              <button
                disabled={addState === 'busy'}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0"
                style={{ background: 'var(--payout-mint)', color: 'var(--ledger-ink)', opacity: addState === 'busy' ? 0.6 : 1 }}
                onClick={handleAddLiquidity}
              >
                {addState === 'busy' ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>Withdraw Unlocked</p>
            <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Available: {formatGEN(pool.liquidity_available)}</p>
            <div className="flex gap-3">
              <input
                type="number"
                value={withdraw}
                onChange={e => setWithdraw(e.target.value)}
                placeholder="Amount (GEN)"
                style={inputStyle}
              />
              <button
                disabled={withdrawState === 'busy'}
                className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 border"
                style={{ borderColor: 'var(--line)', color: 'var(--fog-white)', background: 'transparent', opacity: withdrawState === 'busy' ? 0.6 : 1 }}
                onClick={handleWithdraw}
              >
                {withdrawState === 'busy' ? <Loader className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />} Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Claim queue */}
        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Claim Queue</p>
          {claims.length === 0 ? (
            <div className="rounded-xl border py-8 text-center" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)' }}>
              <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>No claims.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => {
                const sc = claimStatusColor(claim.status)
                return (
                  <Link key={claim.id} href={`/claim/${claim.id}`}>
                    <div className="rounded-xl border p-4 space-y-2 cursor-pointer transition-all hover:opacity-90" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>#{claim.id.slice(0, 10)}</span>
                        <span className="text-[10px] font-mono" style={{ color: sc }}>{STATUS_LABELS[claim.status]}</span>
                      </div>
                      <p className="text-xs leading-snug" style={{ color: 'var(--fog-white)' }}>{claim.incident_summary.slice(0, 60)}…</p>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span style={{ color: 'var(--salt-grey)' }}>Requested</span>
                        <span style={{ color: 'var(--fog-white)' }}>{formatGEN(claim.requested_payout)}</span>
                      </div>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>{formatDate(claim.submitted_at)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
