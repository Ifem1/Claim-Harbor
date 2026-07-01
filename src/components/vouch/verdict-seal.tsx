'use client'

import type { Verdict } from '@/lib/types/vouch'
import { VERDICT_LABELS } from '@/lib/types/vouch'
import { Shield, BarChart2, Zap } from 'lucide-react'
import { formatTimestamp } from '@/lib/utils/explorer'

interface VerdictSealProps {
  verdict: Verdict
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

const ACTION_LABELS: Record<string, string> = {
  keep_active: 'Keep Active',
  downgrade: 'Downgrade',
  suspend: 'Suspend',
  slash_partial: 'Partial Slash',
  slash_full: 'Full Slash',
  expire_without_slash: 'Expire Without Slash',
  dismiss_challenge: 'Dismiss Challenge',
}

const ALIGNMENT_COLOR: Record<string, string> = {
  full: 'var(--verdict-green)',
  partial: 'var(--bond-gold)',
  weak: 'var(--bond-gold)',
  none: 'var(--challenge-red)',
  contradicted: 'var(--challenge-red)',
}

export function VerdictSeal({ verdict }: VerdictSealProps) {
  const vColor = VERDICT_COLOR[verdict.verdict_status] ?? 'var(--muted-steel)'

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        background: 'var(--fog-panel)',
        borderColor: `${vColor}40`,
        borderLeft: `4px solid ${vColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${vColor}15`, border: `1px solid ${vColor}40` }}
          >
            <Shield className="w-5 h-5" style={{ color: vColor }} />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted-steel)' }}>
              GenLayer Verdict
            </p>
            <h3 className="text-lg font-bold" style={{ color: vColor, fontFamily: 'var(--font-space-grotesk)' }}>
              {VERDICT_LABELS[verdict.verdict_status] ?? verdict.verdict_status}
            </h3>
          </div>
        </div>
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            background: 'var(--glass)',
            color: 'var(--muted-steel)',
            border: '1px solid var(--line)',
          }}
        >
          {ACTION_LABELS[verdict.action] ?? verdict.action}
        </span>
      </div>

      {/* Short reason */}
      <p className="text-sm italic leading-relaxed" style={{ color: 'var(--paper-white)', opacity: 0.85 }}>
        &ldquo;{verdict.short_reason}&rdquo;
      </p>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--muted-steel)' }}>
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            Confidence
          </span>
          <span style={{ color: vColor }}>{verdict.confidence}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass)', border: '1px solid var(--line)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${verdict.confidence}%`, background: vColor }}
          />
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Claim Alignment', value: verdict.claim_alignment, color: ALIGNMENT_COLOR[verdict.claim_alignment] ?? 'var(--muted-steel)' },
          { label: 'Evidence Strength', value: verdict.evidence_strength, color: 'var(--signal-blue)' },
          { label: 'Materiality', value: verdict.materiality, color: 'var(--electric-violet)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--muted-steel)' }}>
              {label}
            </p>
            <p className="text-xs font-mono font-medium capitalize" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Slash info */}
      {verdict.slash_bps > 0 && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg border"
          style={{ borderColor: 'var(--challenge-red)40', background: 'var(--challenge-red)08' }}
        >
          <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--challenge-red)' }} />
          <p className="text-xs font-mono" style={{ color: 'var(--challenge-red)' }}>
            Bond slashed: {(verdict.slash_bps / 100).toFixed(1)}% ({verdict.slash_bps} bps)
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] font-mono" style={{ color: 'var(--muted-steel)' }}>
        Issued {formatTimestamp(verdict.created_at)}
        {verdict.resolved && verdict.resolved_at ? ` · Resolved ${formatTimestamp(verdict.resolved_at)}` : ''}
      </p>
    </div>
  )
}
