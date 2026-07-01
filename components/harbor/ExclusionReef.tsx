import { AlertTriangle } from 'lucide-react'

export function ExclusionReef({ exclusions }: { exclusions: string }) {
  const items = exclusions.split('.').map(s => s.trim()).filter(Boolean)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--reef-red)' }} />
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--reef-red)' }}>Exclusion Reef</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(239, 68, 68, 0.06)', color: 'var(--reef-red)', border: '1px solid rgba(239, 68, 68, 0.13)' }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
