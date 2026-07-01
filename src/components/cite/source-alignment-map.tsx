import type { Evidence } from '@/lib/types/cite'
import { hostFromUrl } from '@/lib/utils/explorer'

interface SourceAlignmentMapProps {
  evidenceItems: Array<{ id: string; evidence: Evidence }>
}

const DIRECTION_CONFIG = {
  supports: { color: 'var(--source-green)', label: 'S' },
  contradicts: { color: 'var(--contradiction-red)', label: 'C' },
  contextual: { color: 'var(--amber-doubt)', label: 'X' },
  uncertain: { color: 'var(--paper-muted)', label: '?' },
}

export function SourceAlignmentMap({ evidenceItems }: SourceAlignmentMapProps) {
  if (evidenceItems.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-4 space-y-3">
      <p className="text-xs font-mono text-[var(--paper-muted)] uppercase tracking-widest">Source Alignment Map</p>
      <div className="space-y-2">
        {evidenceItems.map(({ id, evidence }) => {
          const config = DIRECTION_CONFIG[evidence.support_direction as keyof typeof DIRECTION_CONFIG] ?? DIRECTION_CONFIG.uncertain
          return (
            <div key={id.toString()} className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                style={{ background: config.color + '22', color: config.color, border: `1px solid ${config.color}44` }}
              >
                {config.label}
              </span>
              <span className="text-xs font-mono text-[var(--paper-muted)] truncate">{hostFromUrl(evidence.source_url)}</span>
              <span className="ml-auto text-[10px] font-mono text-[var(--paper-muted)]">#{Number(id)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--paper-muted)]">
        <span className="flex items-center gap-1"><span style={{ color: 'var(--source-green)' }}>S</span> = Supports</span>
        <span className="flex items-center gap-1"><span style={{ color: 'var(--contradiction-red)' }}>C</span> = Contradicts</span>
        <span className="flex items-center gap-1"><span style={{ color: 'var(--amber-doubt)' }}>X</span> = Contextual</span>
      </div>
    </div>
  )
}
