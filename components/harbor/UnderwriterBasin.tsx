import type { Pool } from '@/lib/genlayer/types'
import { formatGEN } from '@/lib/format-gen'

export function UnderwriterBasin({ pool }: { pool: Pool }) {
  const total = Number(pool.liquidity_total)
  const available = Number(pool.liquidity_available)
  const pct = total > 0 ? (available / total) * 100 : 0

  return (
    <div className="rounded-xl border p-5 space-y-5" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>
          Liquidity Basin
        </p>
        <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>
          {pool.active ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Water tank visual */}
      <div className="relative h-24 rounded-lg overflow-hidden border" style={{ background: 'var(--ledger-ink)', borderColor: 'var(--line)' }}>
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
          style={{
            height: `${pct}%`,
            background: 'linear-gradient(to top, rgba(37, 99, 235, 0.25), rgba(34, 211, 238, 0.13))',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-mono font-bold" style={{ color: 'var(--fog-white)' }}>{pct.toFixed(0)}%</p>
          <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Available</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: formatGEN(pool.liquidity_total), color: 'var(--fog-white)' },
          { label: 'Available', value: formatGEN(pool.liquidity_available), color: 'var(--payout-mint)' },
          { label: 'Reserved', value: formatGEN(pool.liquidity_reserved), color: 'var(--signal-amber)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center space-y-0.5">
            <p className="text-xs font-mono font-semibold" style={{ color }}>{value}</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: 'var(--glass)', border: '1px solid var(--line)' }}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Premiums Collected</span>
        <span className="text-xs font-mono" style={{ color: 'var(--beacon-cyan)' }}>{formatGEN(pool.premium_collected)}</span>
      </div>
    </div>
  )
}
