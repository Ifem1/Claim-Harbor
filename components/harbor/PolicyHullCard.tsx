import Link from 'next/link'
import type { Pool } from '@/lib/genlayer/types'
import { formatGEN } from '@/lib/format-gen'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import { Shield } from 'lucide-react'

function LiquidityBar({ pool }: { pool: Pool }) {
  const total = Number(pool.liquidity_total)
  const available = Number(pool.liquidity_available)
  const pct = total > 0 ? (available / total) * 100 : 0
  const barColor = pct > 50 ? 'var(--payout-mint)' : pct > 20 ? 'var(--signal-amber)' : 'var(--reef-red)'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>
        <span>Basin Level</span>
        <span style={{ color: barColor, fontWeight: 600 }}>{pct.toFixed(0)}% available</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }}
        />
      </div>
    </div>
  )
}

export function PolicyHullCard({ pool }: { pool: Pool }) {
  const total = Number(pool.liquidity_total)
  const reserved = Number(pool.liquidity_reserved)
  const utilizationPct = total > 0 ? Math.round((reserved / total) * 100) : 0

  return (
    <Link href={`/pool/${pool.id}`}>
      <div
        className="rounded-2xl border p-5 space-y-4 cursor-pointer transition-all duration-200 group"
        style={{
          background: 'linear-gradient(145deg, #0E1E30 0%, #0A1628 100%)',
          borderColor: pool.active ? 'rgba(34, 211, 238, 0.12)' : 'rgba(148,163,184,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-6 right-6 h-px rounded-full"
          style={{ background: pool.active ? 'linear-gradient(90deg, transparent, rgba(34,211,238,0.35), transparent)' : 'transparent' }}
        />

        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}
              >
                <Shield className="w-3 h-3" style={{ color: 'var(--beacon-cyan)' }} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>
                {CATEGORY_LABELS[pool.category] ?? pool.category}
              </span>
            </div>
            <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>
              {pool.name}
            </h3>
          </div>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: pool.active ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.08)',
              color: pool.active ? 'var(--payout-mint)' : 'var(--salt-grey)',
              border: `1px solid ${pool.active ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.15)'}`,
              letterSpacing: '0.05em',
            }}
          >
            {pool.active ? '● ACTIVE' : '○ PAUSED'}
          </span>
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--salt-grey)' }}>
          {pool.terms_summary.slice(0, 90)}{pool.terms_summary.length > 90 ? '…' : ''}
        </p>

        <LiquidityBar pool={pool} />

        <div
          className="grid grid-cols-2 gap-3 pt-1 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div>
            <p className="text-[9px] font-mono mb-1 uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>Available</p>
            <p className="text-sm font-mono font-bold" style={{ color: 'var(--beacon-cyan)' }}>
              {formatGEN(pool.liquidity_available)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-mono mb-1 uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>Utilization</p>
            <p className="text-sm font-mono font-bold" style={{ color: utilizationPct > 70 ? 'var(--reef-red)' : utilizationPct > 40 ? 'var(--signal-amber)' : 'var(--payout-mint)' }}>
              {utilizationPct}%
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
