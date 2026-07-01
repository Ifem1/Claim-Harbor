'use client'

import type { BondTier } from '@/lib/types/vouch'
import { BOND_TIER_LABELS, BOND_TIER_GEN, weiToGEN } from '@/lib/types/vouch'

interface GenBondRailProps {
  bondWei: number
  tier: BondTier
  label?: string
}

const TIER_MAX_GEN: Record<BondTier, number> = {
  micro: 10,
  standard: 50,
  high_trust: 200,
  institutional: 500,
}

export function GenBondRail({ bondWei, tier, label }: GenBondRailProps) {
  const genAmount = bondWei / 1e18
  const tierMax = TIER_MAX_GEN[tier]
  const fillPct = Math.min(100, (genAmount / tierMax) * 100)

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-mono" style={{ color: 'var(--muted-steel)' }}>
          {label}
        </p>
      )}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background: 'var(--bond-gold)15',
              color: 'var(--bond-gold)',
              border: '1px solid var(--bond-gold)40',
            }}
          >
            {BOND_TIER_LABELS[tier]}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--bond-gold)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
            {weiToGEN(bondWei)} GEN
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--muted-steel)' }}>
          min {BOND_TIER_GEN[tier]} GEN
        </span>
      </div>

      {/* Rail bar */}
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{ background: 'var(--glass)', border: '1px solid var(--line)' }}
      >
        {/* Pressure fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, var(--bond-gold) 0%, var(--verdict-green) 100%)`,
          }}
        />
        {/* Tier min marker */}
        <div
          className="absolute top-0 h-full w-px"
          style={{
            left: `${(BOND_TIER_GEN[tier] / tierMax) * 100}%`,
            background: 'var(--paper-white)',
            opacity: 0.3,
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--muted-steel)' }}>
        <span>0 GEN</span>
        <span>{tierMax} GEN</span>
      </div>
    </div>
  )
}
