'use client'

import { useState, useEffect } from 'react'
import { getConnectedAddress, connectWallet, shortenAddress, CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import { formatGEN } from '@/lib/format-gen'
import { Landmark, Wallet, XCircle } from 'lucide-react'

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()

export default function AdminPage() {
  const [address, setAddress] = useState<string | null>(null)
  const [featured, setFeatured] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handler = (accounts: string[]) => setAddress(accounts[0] ?? null)
      ;(window as any).ethereum.on('accountsChanged', handler)
      return () => (window as any).ethereum?.removeListener('accountsChanged', handler)
    }
  }, [])

  const handleConnect = async () => {
    const addr = await connectWallet()
    setAddress(addr)
  }

  const isAdmin = !ADMIN_ADDRESS || (address && address.toLowerCase() === ADMIN_ADDRESS)

  if (!address) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Landmark className="w-6 h-6" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Admin Lighthouse</h1>
        <p className="text-sm" style={{ color: 'var(--salt-grey)' }}>Connect your wallet to access admin functions.</p>
        <button onClick={handleConnect} className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: 'var(--beacon-cyan)', color: 'var(--ledger-ink)' }}>
          <Wallet className="w-4 h-4 inline mr-2" />
          Connect Wallet
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.09)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <XCircle className="w-6 h-6" style={{ color: 'var(--reef-red)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Access Denied</h1>
        <p className="text-sm font-mono" style={{ color: 'var(--salt-grey)' }}>
          Connected as {shortenAddress(address)} — not the admin wallet.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Landmark className="w-5 h-5" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Admin Lighthouse</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>{shortenAddress(address)} · Admin</p>
        </div>
      </div>

      {!CONTRACT_ADDRESS && (
        <div className="rounded-xl border px-4 py-3 text-xs font-mono" style={{ background: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--signal-amber)' }}>
          Demo mode — no real on-chain admin actions available. Claims are settled entirely by GenLayer validators; no settlement override is possible here.
        </div>
      )}

      <div className="rounded-xl border p-6 text-center space-y-2" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
        <p className="text-sm font-mono" style={{ color: 'var(--salt-grey)' }}>
          No pools on-chain yet. Create one via the Underwriter Basin to see protocol stats here.
        </p>
      </div>

      <p className="text-[10px] font-mono text-center" style={{ color: 'var(--salt-grey)' }}>
        On-chain claim settlement is handled exclusively by GenLayer validators. No manual override is possible.
      </p>
    </div>
  )
}
