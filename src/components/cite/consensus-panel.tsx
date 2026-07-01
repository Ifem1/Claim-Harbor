'use client'

import { ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { VerdictRing } from './verdict-ring'
import type { Review } from '@/lib/types/cite'

interface ConsensusPanelProps {
  review: Review | null
  loading?: boolean
}

export function ConsensusPanel({ review, loading }: ConsensusPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-5 space-y-4 animate-pulse">
        <div className="h-4 bg-[var(--glass)] rounded w-32" />
        <div className="h-28 bg-[var(--glass)] rounded" />
        <div className="h-3 bg-[var(--glass)] rounded w-full" />
        <div className="h-3 bg-[var(--glass)] rounded w-3/4" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-5 space-y-4">
        <p className="text-xs font-mono text-[var(--paper-muted)] uppercase tracking-widest">Consensus</p>
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--line)] flex items-center justify-center">
            <span className="text-xs font-mono text-[var(--paper-muted)]">—</span>
          </div>
          <p className="text-sm text-[var(--paper-muted)]">This claim has not faced consensus.</p>
          <p className="text-xs text-[var(--paper-muted)]">Submit evidence, then request a review.</p>
        </div>
      </div>
    )
  }

  const hasCanonical = review.canonical_json
  let canonicalData: Record<string, unknown> | null = null
  try {
    canonicalData = JSON.parse(review.canonical_json)
  } catch {
    /* ignore */
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-5 space-y-5">
      <p className="text-xs font-mono text-[var(--paper-muted)] uppercase tracking-widest">GenLayer Verdict</p>

      <div className="flex justify-center">
        <VerdictRing verdict={review.overall_verdict} confidence={review.confidence} size={140} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--paper-muted)]">Source Alignment</span>
          <span className="text-[var(--paper)] capitalize">{review.source_alignment.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--paper-muted)]">Confidence</span>
          <span className="text-[var(--paper)] capitalize">{review.confidence}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--paper-muted)]">Strongest Evidence</span>
          <span className="text-[var(--source-green)]">#{Number(review.strongest_evidence_id)}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--paper-muted)]">Weakest Evidence</span>
          <span className="text-[var(--amber-doubt)]">#{Number(review.weakest_evidence_id)}</span>
        </div>
      </div>

      {review.contradiction_found ? (
        <div className="flex items-start gap-2 rounded border border-[var(--contradiction-red)]/30 bg-[var(--contradiction-red)]/5 p-3">
          <AlertTriangle className="w-4 h-4 text-[var(--contradiction-red)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--contradiction-red)]">Contradiction detected in the evidence set.</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded border border-[var(--source-green)]/20 bg-[var(--source-green)]/5 p-3">
          <CheckCircle2 className="w-4 h-4 text-[var(--source-green)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--paper-muted)]">No contradiction detected.</p>
        </div>
      )}

      <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-3">
        <p className="text-xs font-mono text-[var(--paper-muted)] mb-1">Verdict Reason</p>
        <p className="text-xs text-[var(--paper)] leading-relaxed">{review.short_reason}</p>
      </div>

      {hasCanonical && canonicalData && (
        <details className="group">
          <summary className="text-xs font-mono text-[var(--paper-muted)] cursor-pointer hover:text-[var(--paper)] list-none flex items-center gap-1">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            Canonical JSON
          </summary>
          <pre className="mt-2 text-[10px] font-mono text-[var(--paper-muted)] bg-[var(--panel)] rounded p-3 overflow-x-auto border border-[var(--line)]">
            {JSON.stringify(canonicalData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
