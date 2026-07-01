'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PolicyHullCard } from '@/components/harbor/PolicyHullCard'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import type { Pool } from '@/lib/genlayer/types'
import { Map, Loader } from 'lucide-react'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'

const ALL_CATEGORIES = [
  { key: '', label: 'All Pools' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
]

function HarborMapContent() {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? '')
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return }
    import('@/lib/genlayer/contracts')
      .then(m => m.getAllPools())
      .then(all => { setPools(all); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory ? pools.filter(p => p.category === activeCategory) : pools
  const totalLiquidity = pools.reduce((acc, p) => acc + Number(p.liquidity_available ?? 0) / 1e18, 0)
  const totalPools = pools.filter(p => p.active).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.09)', border: '1px solid rgba(34,211,238,0.19)' }}
        >
          <Map className="w-5 h-5" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
            Harbor Map
          </h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>
            All available cover pools — no wallet required
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Pools', value: totalPools },
          {
            label: 'Total Available',
            value: `${totalLiquidity.toLocaleString('en-US', { maximumFractionDigits: 0 })} GEN`,
          },
          { label: 'Categories', value: Object.keys(CATEGORY_LABELS).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border p-4 text-center space-y-1"
            style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}
          >
            <p className="text-xl font-mono font-bold" style={{ color: 'var(--beacon-cyan)' }}>{value}</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className="text-xs font-mono px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeCategory === key ? 'var(--beacon-cyan)' : 'var(--dock-steel)',
              borderColor: activeCategory === key ? 'var(--beacon-cyan)' : 'var(--line)',
              color: activeCategory === key ? 'var(--ledger-ink)' : 'var(--salt-grey)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3" style={{ color: 'var(--salt-grey)' }}>
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm font-mono">Loading pools from chain…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--salt-grey)' }}>
          <p className="text-sm font-mono">No pools in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pool => (
            <PolicyHullCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HarborMapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm font-mono animate-pulse" style={{ color: 'var(--salt-grey)' }}>Loading harbor…</p>
      </div>
    }>
      <HarborMapContent />
    </Suspense>
  )
}
