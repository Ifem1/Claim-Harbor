'use client'

import { ExternalLink } from 'lucide-react'
import { buildExplorerTxUrl } from '@/lib/genlayer/vouch'

interface TxLinkProps {
  hash: string
  label?: string
}

export function TxLink({ hash, label }: TxLinkProps) {
  if (!hash) return null

  const short = hash.slice(0, 10) + '…' + hash.slice(-6)

  return (
    <a
      href={buildExplorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md border transition-colors hover:border-[var(--signal-blue)] hover:text-[var(--signal-blue)]"
      style={{
        color: 'var(--muted-steel)',
        background: 'var(--fog-panel)',
        borderColor: 'var(--line)',
      }}
    >
      <ExternalLink className="w-3 h-3" />
      {label ?? short}
    </a>
  )
}
