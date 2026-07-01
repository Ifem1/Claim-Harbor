'use client'

import { ExternalLink, Link as LinkIcon } from 'lucide-react'

interface EvidenceStackProps {
  urls: string[]
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url.slice(0, 40)
  }
}

function getPathLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname
    if (path.length > 1) {
      const parts = path.split('/').filter(Boolean)
      if (parts.length > 0) {
        return parts[parts.length - 1].slice(0, 40)
      }
    }
    return u.hostname
  } catch {
    return url.slice(0, 50)
  }
}

export function EvidenceStack({ urls }: EvidenceStackProps) {
  if (!urls || urls.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-steel)' }}>
        No evidence URLs provided.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-4 h-4" style={{ color: 'var(--signal-blue)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--muted-steel)' }}>
          {urls.length} evidence item{urls.length !== 1 ? 's' : ''}
        </span>
      </div>

      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 p-3 rounded-lg border transition-colors group"
          style={{
            background: 'var(--fog-panel)',
            borderColor: 'var(--line)',
          }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'var(--signal-blue)15', color: 'var(--signal-blue)' }}
          >
            <span className="text-[10px] font-mono font-bold">{i + 1}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-mono font-medium group-hover:text-[var(--signal-blue)] transition-colors"
              style={{ color: 'var(--paper-white)' }}
            >
              {getDomain(url)}
            </p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--muted-steel)' }}>
              {getPathLabel(url)}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--signal-blue)' }} />
        </a>
      ))}
    </div>
  )
}
