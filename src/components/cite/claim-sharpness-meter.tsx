import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { assessClaimSharpness } from '@/lib/validation/claim'

interface ClaimSharpnessMeterProps {
  statement: string
  title: string
}

export function ClaimSharpnessMeter({ statement, title }: ClaimSharpnessMeterProps) {
  const result = assessClaimSharpness(statement, title)

  const barColor =
    result.label === 'sharp'
      ? 'bg-[var(--source-green)]'
      : result.label === 'acceptable'
        ? 'bg-[var(--proof-blue)]'
        : result.label === 'vague'
          ? 'bg-[var(--amber-doubt)]'
          : 'bg-[var(--contradiction-red)]'

  const labelColor =
    result.label === 'sharp'
      ? 'text-[var(--source-green)]'
      : result.label === 'acceptable'
        ? 'text-[var(--proof-blue)]'
        : result.label === 'vague'
          ? 'text-[var(--amber-doubt)]'
          : 'text-[var(--contradiction-red)]'

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-[var(--paper-muted)] uppercase tracking-widest">Claim Sharpness</p>
        <span className={`text-xs font-mono font-medium ${labelColor}`}>
          {result.label.replace('_', ' ').toUpperCase()} · {result.score}/100
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--glass)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {result.warnings.length > 0 && (
        <ul className="space-y-1">
          {result.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--amber-doubt)]">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {result.rewards.length > 0 && (
        <ul className="space-y-1">
          {result.rewards.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--source-green)]">
              <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] font-mono text-[var(--paper-muted)] flex items-center gap-1">
        <Info className="w-3 h-3" />
        Frontend guidance only — not GenLayer consensus
      </p>
    </div>
  )
}
