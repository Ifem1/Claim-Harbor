import { Inbox } from 'lucide-react'
import { EvidenceCard } from './evidence-card'
import type { Evidence } from '@/lib/types/cite'

interface EvidenceStackProps {
  evidenceItems: Array<{ id: string; evidence: Evidence }>
  strongestId?: string | number
  weakestId?: string | number
}

export function EvidenceStack({ evidenceItems, strongestId, weakestId }: EvidenceStackProps) {
  if (evidenceItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <Inbox className="w-8 h-8 text-[var(--paper-muted)]" />
        <p className="text-sm text-[var(--paper-muted)]">No evidence has entered the room yet.</p>
        <p className="text-xs text-[var(--paper-muted)]">Be the first to submit a source.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {evidenceItems.map(({ id, evidence }, i) => (
        <EvidenceCard
          key={id.toString()}
          evidence={evidence}
          evidenceId={id}
          index={i}
          isStrongest={strongestId !== undefined && id === String(strongestId)}
          isWeakest={weakestId !== undefined && id === String(weakestId) && id !== String(strongestId)}
        />
      ))}
    </div>
  )
}
