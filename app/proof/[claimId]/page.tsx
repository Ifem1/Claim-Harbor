'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { PublicProof } from '@/lib/genlayer/types'
import { PublicLighthouseReceipt } from '@/components/harbor/PublicLighthouseReceipt'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { ChevronLeft, Landmark } from 'lucide-react'

const DEMO_PROOF: PublicProof = {
  claim_id: 'claim-demo-001',
  verdict: 'approved_full',
  payout_amount: BigInt('8000000000000000000000'),
  payout_claimed: false,
  pool_name: 'SaaS Outage Cover',
  policy_terms_summary: 'Covers verified service downtime exceeding 4 hours within a 30-day policy window.',
  tx_hash: undefined,
}

export default function PublicProofPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const [proof, setProof] = useState<PublicProof | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setProof({ ...DEMO_PROOF, claim_id: claimId }); return }
    import('@/lib/genlayer/contracts')
      .then(m => m.getPublicProof(claimId))
      .then(setProof)
      .catch(() => setError('Proof not available or not public.'))
  }, [claimId])

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Harbor Gate
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Landmark className="w-5 h-5" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>Lighthouse Proof</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Public claim verification — no private data</p>
        </div>
      </div>

      {!CONTRACT_ADDRESS && (
        <div className="rounded border px-3 py-2 text-[10px] font-mono" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--signal-amber)' }}>
          Demo fixture — configure contract for live proofs
        </div>
      )}

      {error ? (
        <div className="text-center py-12 rounded-xl border space-y-3" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)' }}>
          <p className="text-sm font-mono" style={{ color: 'var(--reef-red)' }}>{error}</p>
          <p className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>
            The claimant must publish the proof from the claim inspection room.
          </p>
        </div>
      ) : !proof ? (
        <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)', color: 'var(--salt-grey)' }}>
          <p className="text-sm font-mono">Loading…</p>
        </div>
      ) : (
        <PublicLighthouseReceipt proof={proof} />
      )}

      <div className="rounded-xl border p-5 space-y-2" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>About Public Proofs</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--salt-grey)' }}>
          Public proofs show the final settlement outcome of a GenLayer claim. Private evidence details and personal data are never shown here.
          Only the verdict, payout status, pool name, and policy summary are visible. Verdicts are issued by GenLayer validators.
        </p>
      </div>
    </div>
  )
}
