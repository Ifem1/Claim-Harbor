'use client'

import { useState, useEffect } from 'react'
import { connectWallet, shortenAddress, CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { PrivateCabinCard } from '@/components/harbor/PrivateCabinCard'
import type { Policy } from '@/lib/genlayer/types'
import { Anchor, Wallet, Loader } from 'lucide-react'


export default function CabinPage() {
  const [address, setAddress] = useState<string | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return
    const provider = (window as any).ethereum

    // Silently restore already-connected wallet
    provider.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => { if (accounts[0]) { setAddress(accounts[0]); loadPolicies(accounts[0]) } })
      .catch(() => {})

    const handler = (accounts: string[]) => {
      setAddress(accounts[0] ?? null)
      if (!accounts[0]) setPolicies([])
    }
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPolicies = async (forAddress?: string) => {
    const addr = forAddress ?? address
    if (!CONTRACT_ADDRESS || !addr) return
    setLoading(true)
    setError(null)
    try {
      const { getMyPolicies } = await import('@/lib/genlayer/contracts')
      setPolicies(await getMyPolicies(addr))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load policies')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const addr = await connectWallet()
      if (addr) {
        setAddress(addr)
        loadPolicies(addr)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect wallet')
    }
  }

  const genSpent = policies.reduce((acc, p) => acc + Number(p.premium_paid ?? 0) / 1e18, 0)
  const activePolicies = policies.filter(p => p.status === 'active').length
  const openClaims = policies.filter(p => (p as any).claim_ids?.length > 0).length

  if (!address) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Wallet className="w-6 h-6" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>My Cabin</h1>
        <p className="text-sm" style={{ color: 'var(--salt-grey)' }}>Connect your wallet to view your active policies and claims.</p>
        <button
          onClick={handleConnect}
          className="px-6 py-3 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--beacon-cyan)', color: 'var(--ledger-ink)' }}
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Anchor className="w-5 h-5" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>My Cabin</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>{shortenAddress(address)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'GEN Spent', value: `${genSpent.toFixed(2)} GEN`, color: 'var(--beacon-cyan)' },
          { label: 'Active Covers', value: activePolicies, color: 'var(--payout-mint)' },
          { label: 'Open Claims', value: openClaims, color: 'var(--signal-amber)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4 text-center space-y-1" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-xl font-mono font-bold" style={{ color }}>{value}</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Policies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Your Policies</p>
          <button onClick={() => loadPolicies()} className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Refresh</button>
        </div>
        {error && <p className="text-xs font-mono" style={{ color: 'var(--reef-red)' }}>{error}</p>}
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--salt-grey)' }}>
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm font-mono">Loading from chain…</span>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 rounded-xl border space-y-3" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)' }}>
            <p className="text-sm font-mono" style={{ color: 'var(--salt-grey)' }}>No active policies.</p>
            <a href="/map" className="text-xs font-mono" style={{ color: 'var(--beacon-cyan)' }}>Browse pools →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map(policy => (
              <PrivateCabinCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
