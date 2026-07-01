'use client'

import type { Endorsement } from '@/lib/types/vouch'
import { weiToGEN } from '@/lib/types/vouch'
import { shortenAddress } from '@/lib/utils/explorer'
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface EndorsementStackProps {
  endorsements: Endorsement[]
  totalBondWei: number
}

const STATUS_COLOR: Record<string, string> = {
  active: 'var(--verdict-green)',
  withdrawn: 'var(--muted-steel)',
  refunded: 'var(--signal-blue)',
  slashed: 'var(--challenge-red)',
}

export function EndorsementStack({ endorsements, totalBondWei }: EndorsementStackProps) {
  const active = endorsements.filter((e) => e.status === 'active')

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{ background: 'var(--fog-panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: 'var(--bond-gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--paper-white)' }}>
            {active.length} endorser{active.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-sm font-mono font-bold" style={{ color: 'var(--bond-gold)' }}>
          {weiToGEN(totalBondWei)} GEN stacked
        </span>
      </div>

      {/* List */}
      {endorsements.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted-steel)' }}>
          No endorsements yet.
        </p>
      )}

      <div className="space-y-2">
        {endorsements.map((e) => {
          const statusColor = STATUS_COLOR[e.status] ?? 'var(--muted-steel)'
          const hasExposure = e.challenge_exposure

          return (
            <div
              key={e.endorsement_id}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{
                background: 'var(--fog-panel)',
                borderColor: hasExposure ? 'var(--challenge-red)40' : 'var(--line)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}40` }}
                >
                  {hasExposure ? (
                    <AlertTriangle className="w-3 h-3" style={{ color: 'var(--challenge-red)' }} />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" style={{ color: statusColor }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--paper-white)' }}>
                    {shortenAddress(e.endorser)}
                  </p>
                  {e.note && (
                    <p className="text-[10px] truncate" style={{ color: 'var(--muted-steel)' }}>
                      {e.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-mono font-bold" style={{ color: 'var(--bond-gold)' }}>
                  {weiToGEN(e.bond_amount_wei)} GEN
                </p>
                <p className="text-[10px] font-mono" style={{ color: statusColor }}>
                  {e.status}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
