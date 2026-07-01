'use client'

import { useState } from 'react'
import type { Policy } from '@/lib/genlayer/types'
import { Radio } from 'lucide-react'

interface ClaimBeaconProps {
  policy: Policy
  onSubmit?: (data: {
    incident_summary: string
    requested_payout: string
    evidence_urls: string[]
    evidence_notes: string
  }) => Promise<void>
}

type SubmitState = 'idle' | 'awaiting_signature' | 'success' | 'failed'

export function ClaimBeacon({ policy, onSubmit }: ClaimBeaconProps) {
  const [summary, setSummary] = useState('')
  const [payout, setPayout] = useState('')
  const [urlsRaw, setUrlsRaw] = useState('')
  const [notes, setNotes] = useState('')
  const [state, setState] = useState<SubmitState>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSubmit || !summary.trim() || !payout) return
    const urls = urlsRaw.split('\n').map(u => u.trim()).filter(Boolean)
    if (urls.length === 0) return
    setState('awaiting_signature')
    try {
      await onSubmit({ incident_summary: summary, requested_payout: payout, evidence_urls: urls, evidence_notes: notes })
      setState('success')
    } catch {
      setState('failed')
    }
  }

  const inputStyle = {
    background: 'var(--ledger-ink)',
    border: '1px solid var(--line)',
    color: 'var(--fog-white)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  } as React.CSSProperties

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'rgba(245, 158, 11, 0.13)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <Radio className="w-4 h-4" style={{ color: 'var(--signal-amber)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>Distress Signal</p>
          <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Submitting claim for policy #{policy.id.slice(0, 8)}</p>
        </div>
      </div>

      {state === 'success' ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--payout-mint)' }}>Claim submitted</p>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Requesting validator verdict… redirecting.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Incident Summary</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Describe what happened…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Requested Payout (GEN)</label>
            <input
              type="number"
              value={payout}
              onChange={e => setPayout(e.target.value)}
              placeholder="0"
              style={inputStyle}
              required
              min="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Evidence URLs (one per line)</label>
            <textarea
              value={urlsRaw}
              onChange={e => setUrlsRaw(e.target.value)}
              placeholder={'https://incident.page.example.com\nhttps://screenshot.link'}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              required
            />
            <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Public evidence URLs only. Do not include private data.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Evidence Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional context for validators…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={state !== 'idle'}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: state === 'idle' ? 'var(--signal-amber)' : 'rgba(148, 163, 184, 0.19)',
              color: state === 'idle' ? 'var(--ledger-ink)' : 'var(--salt-grey)',
              cursor: state !== 'idle' ? 'not-allowed' : 'pointer',
            }}
          >
            {state === 'idle' && 'Send Distress Signal'}
            {state === 'awaiting_signature' && 'Submitting claim…'}
            {state === 'failed' && 'Failed — retry'}
          </button>
        </form>
      )}
    </div>
  )
}
