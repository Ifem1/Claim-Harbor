import { Calendar, Shield, Ban, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Claim } from '@/lib/types/cite'
import { CLAIM_TYPE_LABELS, EVIDENCE_STANDARD_LABELS } from '@/lib/types/cite'
import { formatTimestamp } from '@/lib/utils/explorer'

interface ClaimLensProps {
  claim: Claim
}

export function ClaimLens({ claim }: ClaimLensProps) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-mono text-[var(--paper-muted)] uppercase tracking-widest">Claim Under Review</p>
        <h2 className="font-display text-xl text-[var(--paper)] leading-snug">{claim.title}</h2>
      </div>

      <blockquote className="border-l-2 border-[var(--proof-blue)] pl-3 text-sm text-[var(--paper)] leading-relaxed">
        {claim.statement}
      </blockquote>

      <div className="grid grid-cols-1 gap-3">
        <LensRow label="Type">
          <Badge variant="outline" className="font-mono text-xs border-[var(--line)] text-[var(--paper-muted)]">
            {CLAIM_TYPE_LABELS[claim.claim_type as keyof typeof CLAIM_TYPE_LABELS] ?? claim.claim_type}
          </Badge>
        </LensRow>

        <LensRow label="Evidence Standard" icon={<Shield className="w-3 h-3 text-[var(--violet-consensus)]" />}>
          <span className="text-xs font-mono text-[var(--violet-consensus)]">
            {EVIDENCE_STANDARD_LABELS[claim.evidence_standard as keyof typeof EVIDENCE_STANDARD_LABELS] ??
              claim.evidence_standard}
          </span>
        </LensRow>

        {claim.preferred_sources && (
          <LensRow label="Preferred Sources" icon={<Star className="w-3 h-3 text-[var(--amber-doubt)]" />}>
            <span className="text-xs text-[var(--paper-muted)]">{claim.preferred_sources}</span>
          </LensRow>
        )}

        {claim.excluded_sources && (
          <LensRow label="Excluded Sources" icon={<Ban className="w-3 h-3 text-[var(--contradiction-red)]" />}>
            <span className="text-xs text-[var(--paper-muted)]">{claim.excluded_sources}</span>
          </LensRow>
        )}

        {claim.context && (
          <LensRow label="Context">
            <span className="text-xs text-[var(--paper-muted)]">{claim.context}</span>
          </LensRow>
        )}

        <LensRow label="Deadline" icon={<Calendar className="w-3 h-3 text-[var(--paper-muted)]" />}>
          <span className="text-xs font-mono text-[var(--paper-muted)]">{formatTimestamp(claim.created_at)}</span>
        </LensRow>
      </div>

      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs font-mono text-[var(--paper-muted)]">
        <span>{Number(claim.evidence_count)} evidence item{Number(claim.evidence_count) !== 1 ? 's' : ''}</span>
        <span>{Number(claim.review_count)} review{Number(claim.review_count) !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

function LensRow({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs font-mono text-[var(--paper-muted)] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}
