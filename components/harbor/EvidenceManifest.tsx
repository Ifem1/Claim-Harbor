import { ExternalLink, FileText } from 'lucide-react'

interface EvidenceManifestProps {
  urls: string[]
  summary: string
}

export function EvidenceManifest({ urls, summary }: EvidenceManifestProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5" style={{ color: 'var(--beacon-cyan)' }} />
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>
          Cargo Manifest
        </p>
      </div>

      {summary && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--salt-grey)' }}>{summary}</p>
      )}

      <div className="space-y-1.5">
        {urls.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-opacity hover:opacity-75"
            style={{ background: 'var(--glass)', border: '1px solid var(--line)', color: 'var(--tide-blue)' }}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{url}</span>
          </a>
        ))}
        {urls.length === 0 && (
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>No evidence links on file.</p>
        )}
      </div>
    </div>
  )
}
