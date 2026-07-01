'use client'

import Link from 'next/link'
import { Shield, Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import type { Capsule } from '@/lib/types/vouch'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  BOND_TIER_LABELS,
  weiToGEN,
} from '@/lib/types/vouch'
import { formatTimestamp, shortenAddress } from '@/lib/utils/explorer'

interface CapsuleCardProps {
  capsule: Capsule
  showOwner?: boolean
}

const STATUS_COLOR: Record<string, string> = {
  active: 'var(--verdict-green)',
  upheld: 'var(--verdict-green)',
  challenged: 'var(--challenge-red)',
  under_review: 'var(--bond-gold)',
  downgraded: 'var(--bond-gold)',
  suspended: 'var(--challenge-red)',
  slashed: 'var(--challenge-red)',
  expired: 'var(--muted-steel)',
  retired: 'var(--muted-steel)',
}

const BORDER_COLOR: Record<string, string> = {
  active: 'var(--bond-gold)',
  upheld: 'var(--verdict-green)',
  challenged: 'var(--challenge-red)',
  under_review: 'var(--bond-gold)',
  downgraded: 'var(--bond-gold)',
  suspended: 'var(--challenge-red)',
  slashed: 'var(--challenge-red)',
  expired: 'var(--line)',
  retired: 'var(--line)',
}

export function CapsuleCard({ capsule, showOwner = false }: CapsuleCardProps) {
  const borderColor = BORDER_COLOR[capsule.status] ?? 'var(--line)'
  const statusColor = STATUS_COLOR[capsule.status] ?? 'var(--muted-steel)'
  const isMuted = ['expired', 'retired'].includes(capsule.status)

  return (
    <Link href={`/capsule/${capsule.capsule_id}`} className="block group">
      <div
        className="rounded-xl border p-5 transition-all duration-200 group-hover:shadow-lg"
        style={{
          background: 'var(--fog-panel)',
          borderColor: 'var(--line)',
          borderLeft: `3px solid ${borderColor}`,
          opacity: isMuted ? 0.7 : 1,
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'var(--glass)',
                color: 'var(--signal-blue)',
                border: '1px solid var(--line)',
              }}
            >
              {CATEGORY_LABELS[capsule.category] ?? capsule.category}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                color: statusColor,
                border: `1px solid ${statusColor}`,
                background: `${statusColor}15`,
              }}
            >
              {STATUS_LABELS[capsule.status] ?? capsule.status}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'var(--glass)',
                color: 'var(--bond-gold)',
                border: '1px solid var(--line)',
              }}
            >
              {BOND_TIER_LABELS[capsule.bond_tier] ?? capsule.bond_tier}
            </span>
          </div>

          {capsule.latest_verdict_id && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
              style={{
                background: 'var(--electric-violet)15',
                color: 'var(--electric-violet)',
                border: '1px solid var(--electric-violet)',
              }}
            >
              Verdict
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-medium leading-snug mb-3 group-hover:text-[var(--bond-gold)] transition-colors"
          style={{ color: 'var(--paper-white)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          {capsule.claim_title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[11px] font-mono" style={{ color: 'var(--muted-steel)' }}>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: 'var(--bond-gold)' }} />
            {weiToGEN(capsule.active_bond)} GEN
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {capsule.endorsement_count} endorsers
          </span>
          {capsule.challenge_count > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--challenge-red)' }}>
              <AlertTriangle className="w-3 h-3" />
              {capsule.challenge_count} challenge{capsule.challenge_count !== 1 ? 's' : ''}
            </span>
          )}
          {capsule.challenge_count === 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--verdict-green)' }}>
              <CheckCircle2 className="w-3 h-3" />
              clean
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-3 pt-3 text-[10px] font-mono border-t"
          style={{ borderColor: 'var(--line)', color: 'var(--muted-steel)' }}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expires {formatTimestamp(capsule.expires_at)}
          </span>
          {showOwner && (
            <span style={{ color: 'var(--signal-blue)' }}>
              {shortenAddress(capsule.owner)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
