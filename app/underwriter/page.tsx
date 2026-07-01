'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { connectWallet, shortenAddress, CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { UnderwriterBasin } from '@/components/harbor/UnderwriterBasin'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import type { Pool } from '@/lib/genlayer/types'
import { ShieldCheck, Plus, ChevronRight, Loader } from 'lucide-react'

const DEFAULT_FORM = { name: '', category: '', terms: '', exclusions: '', liquidity: '10000' }

export default function UnderwriterPage() {
  const [address, setAddress] = useState<string | null>(null)
  const [myPools, setMyPools] = useState<Pool[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM)
  const [createState, setCreateState] = useState<'idle' | 'submitting' | 'confirming' | 'success' | 'failed'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return
    const provider = (window as any).ethereum

    // Silently restore already-connected wallet
    provider.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => { if (accounts[0]) { setAddress(accounts[0]); loadMyPools(accounts[0]) } })
      .catch(() => {})

    const handler = (accounts: string[]) => {
      setAddress(accounts[0] ?? null)
      if (!accounts[0]) setMyPools([])
    }
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    try {
      const addr = await connectWallet()
      if (addr) {
        setAddress(addr)
        loadMyPools(addr)
      }
    } catch (err: any) {
      console.error('Wallet connect error:', err)
      setError(err?.message ?? 'Failed to connect wallet')
    }
  }

  const loadMyPools = async (forAddress?: string) => {
    if (!CONTRACT_ADDRESS) return
    const owner = forAddress ?? address
    if (!owner) return
    try {
      const { getAllPools } = await import('@/lib/genlayer/contracts')
      const all = await getAllPools()
      setMyPools(all.filter(p => p.owner?.toLowerCase() === owner.toLowerCase()))
    } catch (e) {
      console.error('Failed to load pools', e)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    setError(null)
    setCreateState('submitting')
    try {
      const liquidityGEN = parseFloat(formState.liquidity)
      if (isNaN(liquidityGEN) || liquidityGEN <= 0) throw new Error('Invalid liquidity amount')
      const liquidityWei = BigInt(Math.floor(liquidityGEN * 1e18))

      const { createPool, waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await createPool({
        name: formState.name,
        category: formState.category,
        terms_summary: formState.terms,
        exclusions_summary: formState.exclusions,
        terms_hash: '0x0',
        max_cover_per_policy: liquidityWei / 10n,   // 10% of pool per policy
        min_premium_bps: 200n,                        // 2% minimum premium
        claim_window_days: 30n,
        liquidity_wei: liquidityWei,
      })
      setTxHash(hash)
      setCreateState('confirming')
      await waitForTx(hash)
      setCreateState('success')
      setShowCreateForm(false)
      setFormState(DEFAULT_FORM)
      setTimeout(() => { setCreateState('idle'); setTxHash(null) }, 5000)
      loadMyPools(address ?? undefined)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Transaction failed')
      setCreateState('failed')
    }
  }

  const inputStyle = {
    background: 'var(--ledger-ink)',
    border: '1px solid var(--line)',
    color: 'var(--fog-white)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  } as React.CSSProperties

  if (!address) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.09)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
          <ShieldCheck className="w-6 h-6" style={{ color: 'var(--tide-blue)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Underwriter Basin</h1>
        <p className="text-sm" style={{ color: 'var(--salt-grey)' }}>Connect your wallet to manage liquidity pools and review claims.</p>
        <button onClick={handleConnect} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: 'var(--tide-blue)', color: 'var(--fog-white)' }}>
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.09)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--tide-blue)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Underwriter Basin</h1>
            <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>{shortenAddress(address)}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreateForm(v => !v); setError(null); setCreateState('idle') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--tide-blue)', color: 'var(--fog-white)' }}
        >
          <Plus className="w-4 h-4" />
          New Pool
        </button>
      </div>

      {/* Status banners */}
      {createState === 'confirming' && txHash && (
        <div className="rounded-xl border px-4 py-3 flex items-center gap-3 text-xs font-mono" style={{ background: 'rgba(34, 211, 238, 0.06)', borderColor: 'rgba(34, 211, 238, 0.2)', color: 'var(--beacon-cyan)' }}>
          <Loader className="w-3.5 h-3.5 animate-spin" />
          Waiting for consensus… tx {txHash.slice(0, 10)}…
        </div>
      )}
      {createState === 'success' && (
        <div className="rounded-xl border px-4 py-3 text-xs font-mono" style={{ background: 'rgba(52, 211, 153, 0.06)', borderColor: 'rgba(52, 211, 153, 0.2)', color: 'var(--payout-mint)' }}>
          Pool created successfully on-chain.
        </div>
      )}
      {createState === 'failed' && error && (
        <div className="rounded-xl border px-4 py-3 text-xs font-mono" style={{ background: 'rgba(239, 68, 68, 0.06)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--reef-red)' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-xl border p-6 space-y-5" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>Create Cover Pool</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Pool Name</label>
                <input value={formState.name} onChange={e => setFormState(s => ({ ...s, name: e.target.value }))} style={inputStyle} required placeholder="SaaS Outage Cover" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Category</label>
                <select value={formState.category} onChange={e => setFormState(s => ({ ...s, category: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }} required>
                  <option value="">Select…</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Terms Summary</label>
              <textarea value={formState.terms} onChange={e => setFormState(s => ({ ...s, terms: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} required placeholder="Describe what this pool covers…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Exclusions</label>
              <textarea value={formState.exclusions} onChange={e => setFormState(s => ({ ...s, exclusions: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} required placeholder="What is NOT covered…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Initial Liquidity (GEN)</label>
              <input type="number" value={formState.liquidity} onChange={e => setFormState(s => ({ ...s, liquidity: e.target.value }))} style={inputStyle} required min="1" step="any" placeholder="10000" />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createState === 'submitting' || createState === 'confirming'}
                className="flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--tide-blue)', color: 'var(--fog-white)', opacity: (createState === 'submitting' || createState === 'confirming') ? 0.6 : 1 }}
              >
                {(createState === 'submitting' || createState === 'confirming') && <Loader className="w-4 h-4 animate-spin" />}
                {createState === 'submitting' ? 'Check wallet…' : createState === 'confirming' ? 'Confirming…' : 'Create Pool'}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-3 rounded-lg text-sm font-mono border" style={{ borderColor: 'var(--line)', color: 'var(--salt-grey)', background: 'transparent' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pool list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Your Pools</p>
          <button onClick={() => loadMyPools()} className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Refresh</button>
        </div>
        {myPools.length === 0 ? (
          <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)', color: 'var(--salt-grey)' }}>
            <p className="text-sm font-mono">No pools yet. Create your first pool above.</p>
            {CONTRACT_ADDRESS && (
              <button onClick={() => loadMyPools()} className="mt-3 text-xs font-mono underline" style={{ color: 'var(--beacon-cyan)' }}>Load from chain</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myPools.map(pool => (
              <Link key={pool.id} href={`/underwriter/pool/${pool.id}`}>
                <div className="rounded-xl border p-5 space-y-4 cursor-pointer transition-all hover:opacity-90" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>{pool.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>{CATEGORY_LABELS[pool.category] ?? pool.category}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--salt-grey)' }} />
                  </div>
                  <UnderwriterBasin pool={pool} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
