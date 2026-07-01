'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Anchor, ShieldCheck, Landmark, Wallet, LogOut } from 'lucide-react'
import { connectWallet, shortenAddress, CONTRACT_ADDRESS } from '@/lib/genlayer/client'

const NAV = [
  { href: '/map', icon: Map, label: 'Harbor Map' },
  { href: '/cabin', icon: Anchor, label: 'My Cabin' },
  { href: '/underwriter', icon: ShieldCheck, label: 'Underwriter' },
  { href: '/admin', icon: Landmark, label: 'Admin' },
]

function HarborRail({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed left-0 top-0 h-screen w-14 flex flex-col items-center py-4 gap-1 z-40 border-r"
      style={{
        background: 'linear-gradient(180deg, #07111f 0%, #050d1a 100%)',
        borderColor: 'rgba(34,211,238,0.07)',
        boxShadow: '2px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      <Link href="/" className="mb-5 flex items-center justify-center w-8 h-8">
        <span
          className="text-base font-black tracking-tight"
          style={{
            color: 'var(--beacon-cyan)',
            fontFamily: 'var(--font-space-grotesk)',
            textShadow: '0 0 14px rgba(34,211,238,0.55)',
          }}
        >
          CH
        </span>
      </Link>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              background: active ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
              color: active ? 'var(--beacon-cyan)' : 'var(--salt-grey)',
              border: active ? '1px solid rgba(34, 211, 238, 0.22)' : '1px solid transparent',
              boxShadow: active ? '0 0 14px rgba(34,211,238,0.14)' : 'none',
            }}
          >
            <Icon className="w-4 h-4" />
          </Link>
        )
      })}
    </nav>
  )
}

function SignalBar({
  address,
  onConnect,
  onDisconnect,
}: {
  address: string | null
  onConnect: () => void
  onDisconnect: () => void
}) {
  return (
    <header
      className="fixed top-0 left-14 right-0 h-10 flex items-center px-4 gap-3 z-30 border-b"
      style={{
        background: 'rgba(5, 13, 26, 0.88)',
        borderColor: 'rgba(34,211,238,0.07)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 0 rgba(34,211,238,0.05)',
      }}
    >
      <span className="text-[10px] font-mono flex items-center gap-1.5" style={{ color: 'var(--salt-grey)' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--payout-mint)', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
        StudioNet
      </span>
      <span className="text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.5)' }}>·</span>
      <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Chain 61999</span>
      <div className="ml-auto flex items-center gap-2">
        {!CONTRACT_ADDRESS && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--signal-amber)', border: '1px solid rgba(245,158,11,0.18)' }}>
            Contract not configured
          </span>
        )}
        {address ? (
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              style={{
                background: 'rgba(34, 211, 238, 0.06)',
                color: 'var(--beacon-cyan)',
                border: '1px solid rgba(34, 211, 238, 0.15)',
                boxShadow: '0 0 10px rgba(34,211,238,0.06)',
              }}
            >
              <Wallet className="w-3 h-3" />
              {shortenAddress(address)}
            </span>
            <button
              onClick={onDisconnect}
              title="Disconnect wallet"
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
              style={{ color: 'var(--salt-grey)', border: '1px solid rgba(148,163,184,0.12)' }}
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--tide-blue), #1d4ed8)',
              color: 'var(--fog-white)',
              boxShadow: '0 2px 10px rgba(37,99,235,0.25)',
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}

export function HarborShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return
    const provider = (window as any).ethereum

    provider.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => { if (accounts[0]) setAddress(accounts[0]) })
      .catch(() => {})

    const handler = (accounts: string[]) => setAddress(accounts[0] ?? null)
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  }, [])

  const handleConnect = async () => {
    try {
      const addr = await connectWallet()
      if (addr) setAddress(addr)
    } catch (err: any) {
      console.error('Wallet connect error:', err)
      alert(err?.message ?? 'Failed to connect wallet')
    }
  }

  const handleDisconnect = () => setAddress(null)

  return (
    <div className="min-h-screen" style={{ background: 'var(--deep-harbor)' }}>
      <HarborRail pathname={pathname} />
      <SignalBar address={address} onConnect={handleConnect} onDisconnect={handleDisconnect} />
      <main className="pl-14 pt-10 min-h-screen">{children}</main>
    </div>
  )
}
