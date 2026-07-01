'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Claim } from '@/lib/genlayer/types'
import { VERDICT_LABELS, STATUS_LABELS } from '@/lib/genlayer/types'
import { ConsensusTide } from '@/components/harbor/ConsensusTide'
import { EvidenceManifest } from '@/components/harbor/EvidenceManifest'
import { PayoutDock } from '@/components/harbor/PayoutDock'
import { formatGEN, formatDate } from '@/lib/format-gen'
import { verdictColor, claimStatusColor } from '@/lib/visibility'
import { CONTRACT_ADDRESS, buildExplorerTxUrl } from '@/lib/genlayer/client'
import { ChevronLeft, Eye, Loader } from 'lucide-react'


export default function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionState, setActionState] = useState<'idle' | 'pending' | 'done' | 'failed'>('idle')
  const [actionTx, setActionTx] = useState<string | null>(null)

  const reload = () => {
    if (!CONTRACT_ADDRESS) return
    import('@/lib/genlayer/contracts').then(m => m.getClaim(claimId)).then(setClaim).catch(() => {})
  }

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    import('@/lib/genlayer/contracts').then(m => m.getClaim(claimId)).then(setClaim).catch(() => setError('Claim not found.'))
  }, [claimId])

  const runAction = async (fn: () => Promise<`0x${string}`>) => {
    setActionState('pending')
    setActionTx(null)
    try {
      const { waitForTx } = await import('@/lib/genlayer/contracts')
      const hash = await fn()
      setActionTx(hash)
      await waitForTx(hash)
      setActionState('done')
      reload()
    } catch (err: any) {
      setError(err?.message ?? 'Transaction failed')
      setActionState('failed')
    }
  }

  const handleRequestVerdict = () =>
    runAction(async () => {
      const { requestClaimVerdict } = await import('@/lib/genlayer/contracts')
      return requestClaimVerdict(claimId)
    })

  const handlePayout = async () => {
    const { claimPayout } = await import('@/lib/genlayer/contracts')
    return claimPayout(claimId)
  }

  const handlePublishProof = () =>
    runAction(async () => {
      const { publishClaimProof } = await import('@/lib/genlayer/contracts')
      return publishClaimProof(claimId)
    })

  if (!claim) {
    return (
      <div className="p-10 text-center text-sm font-mono" style={{ color: error ? 'var(--reef-red)' : 'var(--salt-grey)' }}>
        {error ?? 'Loading…'}
      </div>
    )
  }

  const statusColor = claimStatusColor(claim.status)
  const vColor = verdictColor(claim.verdict?.verdict)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <Link href="/cabin" className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> My Cabin
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Claim #{claim.id.slice(0, 12)}</p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
            Claim Inspection Room
          </h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Submitted {formatDate(claim.submitted_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: `color-mix(in srgb, ${statusColor} 9%, transparent)`, color: statusColor, border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)` }}
          >
            {STATUS_LABELS[claim.status]}
          </span>
          {claim.public_proof_enabled && (
            <Link href={`/proof/${claim.id}`} className="flex items-center gap-1 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
              <Eye className="w-3 h-3" /> Public Proof
            </Link>
          )}
        </div>
      </div>

      {/* Consensus tide */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
        <ConsensusTide status={claim.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left */}
        <div className="lg:col-span-3 space-y-5">
          {/* Incident summary */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Incident Summary</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fog-white)' }}>{claim.incident_summary}</p>
          </div>

          {/* Evidence */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <EvidenceManifest urls={claim.evidence_urls} summary={claim.evidence_summary} />
          </div>

          {/* Verdict panel */}
          {claim.verdict && (
            <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Validator Verdict</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: vColor, fontFamily: 'var(--font-space-grotesk)' }}>
                  {VERDICT_LABELS[claim.verdict.verdict]}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>
                  {claim.verdict.confidence}% confidence
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--salt-grey)' }}>{claim.verdict.short_reason}</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--salt-grey)' }}>Covered event</span>
                  <span style={{ color: claim.verdict.covered_event ? 'var(--payout-mint)' : 'var(--reef-red)' }}>
                    {claim.verdict.covered_event ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--salt-grey)' }}>Exclusion applies</span>
                  <span style={{ color: claim.verdict.exclusion_applies ? 'var(--reef-red)' : 'var(--payout-mint)' }}>
                    {claim.verdict.exclusion_applies ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <PayoutDock claim={claim} onClaim={async () => { await handlePayout() }} />

          {/* Action panel */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            {error && <p className="text-[10px] font-mono" style={{ color: 'var(--reef-red)' }}>{error}</p>}
            {actionTx && (
              <a href={buildExplorerTxUrl(actionTx)} target="_blank" rel="noreferrer" className="block text-[10px] font-mono underline" style={{ color: 'var(--salt-grey)' }}>
                View tx ↗
              </a>
            )}
            {claim.status === 'submitted' && (
              <button
                onClick={handleRequestVerdict}
                disabled={actionState === 'pending'}
                className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--tide-blue)', color: 'var(--fog-white)', opacity: actionState === 'pending' ? 0.6 : 1 }}
              >
                {actionState === 'pending' && <Loader className="w-3.5 h-3.5 animate-spin" />}
                Request Validator Verdict
              </button>
            )}
            {!claim.public_proof_enabled && (
              <button
                onClick={handlePublishProof}
                disabled={actionState === 'pending'}
                className="w-full py-2.5 rounded-lg text-xs font-semibold border"
                style={{ borderColor: 'var(--line)', color: 'var(--salt-grey)', background: 'transparent', opacity: actionState === 'pending' ? 0.6 : 1 }}
              >
                Publish Public Proof
              </button>
            )}
          </div>

          {/* Claim stats */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            {[
              { label: 'Requested', value: formatGEN(claim.requested_payout), color: 'var(--fog-white)' },
              { label: 'Approved', value: Number(claim.payout_amount) > 0 ? formatGEN(claim.payout_amount) : '—', color: 'var(--payout-mint)' },
              { label: 'Policy', value: `#${claim.policy_id.slice(0, 8)}`, color: 'var(--salt-grey)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs font-mono">
                <span style={{ color: 'var(--salt-grey)' }}>{label}</span>
                <span style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
