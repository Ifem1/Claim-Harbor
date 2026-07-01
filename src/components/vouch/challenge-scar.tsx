'use client'

import type { Challenge, Verdict } from '@/lib/types/vouch'
import { VERDICT_LABELS } from '@/lib/types/vouch'
import { formatTimestamp } from '@/lib/utils/explorer'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface ChallengeScarProps {
  challenge: Challenge
  verdict?: Verdict
}

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  factual_inaccuracy: 'Factual Inaccuracy',
  outdated_claim: 'Outdated Claim',
  scope_overstated: 'Scope Overstated',
  identity_mismatch: 'Identity Mismatch',
  evidence_fabrication: 'Evidence Fabrication',
  material_breach: 'Material Breach',
  other: 'Other',
}

const STATUS_COLOR: Record<string, string> = {
  open: 'var(--challenge-red)',
  verdict_pending: 'var(--bond-gold)',
  resolved: 'var(--verdict-green)',
}

const VERDICT_COLOR: Record<string, string> = {
  trustworthy: 'var(--verdict-green)',
  weakly_supported: 'var(--bond-gold)',
  overstated: 'var(--bond-gold)',
  contradicted: 'var(--challenge-red)',
  unverifiable: 'var(--muted-steel)',
  impersonation_risk: 'var(--challenge-red)',
  material_breach: 'var(--challenge-red)',
  invalid_challenge: 'var(--verdict-green)',
  insufficient_evidence: 'var(--muted-steel)',
}

export function ChallengeScar({ challenge, verdict }: ChallengeScarProps) {
  const isOpen = challenge.status === 'open'
  const statusColor = STATUS_COLOR[challenge.status] ?? 'var(--muted-steel)'

  return (
    <div
      className="rounded-lg border p-4 space-y-2"
      style={{
        borderColor: isOpen ? 'var(--challenge-red)40' : 'var(--line)',
        background: isOpen ? 'var(--challenge-red)08' : 'var(--fog-panel)',
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: statusColor }} />
          <span className="text-xs font-mono" style={{ color: 'var(--muted-steel)' }}>
            {CHALLENGE_TYPE_LABELS[challenge.challenge_type] ?? challenge.challenge_type}
          </span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            color: statusColor,
            border: `1px solid ${statusColor}40`,
            background: `${statusColor}10`,
          }}
        >
          {challenge.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--paper-white)' }}>
        {challenge.summary}
      </p>

      {verdict && (
        <div
          className="flex items-center gap-2 pt-2 border-t"
          style={{ borderColor: 'var(--line)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: VERDICT_COLOR[verdict.verdict_status] ?? 'var(--muted-steel)' }} />
          <span
            className="text-xs font-mono"
            style={{ color: VERDICT_COLOR[verdict.verdict_status] ?? 'var(--muted-steel)' }}
          >
            {VERDICT_LABELS[verdict.verdict_status] ?? verdict.verdict_status}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted-steel)' }}>
            — {verdict.short_reason}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--muted-steel)' }}>
        <Clock className="w-3 h-3" />
        {formatTimestamp(challenge.created_at)}
      </div>
    </div>
  )
}
