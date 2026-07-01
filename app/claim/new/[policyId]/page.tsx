'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Policy } from '@/lib/genlayer/types'
import { ClaimBeacon } from '@/components/harbor/ClaimBeacon'
import { ExclusionReef } from '@/components/harbor/ExclusionReef'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { ChevronLeft } from 'lucide-react'

export default function ClaimNewPage() {
  const { policyId } = useParams<{ policyId: string }>()
  const router = useRouter()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pool, setPool] = useState<any>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    import('@/lib/genlayer/contracts').then(m => m.getPolicy(policyId)).then(setPolicy).catch(() => setError('Policy not found.'))
  }, [policyId])

  useEffect(() => {
    if (policy?.pool_id && CONTRACT_ADDRESS) {
      import('@/lib/genlayer/contracts').then(m => m.getPool(policy.pool_id)).then(setPool).catch(() => {})
    }
  }, [policy])

  if (!policy) {
    return (
      <div className="p-10 text-center text-sm font-mono" style={{ color: error ? 'var(--reef-red)' : 'var(--salt-grey)' }}>
        {error ?? 'Loading…'}
      </div>
    )
  }

  const handleSubmit = async (data: {
    incident_summary: string
    requested_payout: string
    evidence_urls: string[]
    evidence_notes: string
  }) => {
    const contracts = await import('@/lib/genlayer/contracts')
    const { getClient, requireContract } = await import('@/lib/genlayer/client')

    // Step 1: submit the claim on-chain
    const submitHash = await contracts.submitClaim({
      policy_id: policyId,
      requested_payout: BigInt(Math.floor(Number(data.requested_payout) * 1e18)),
      incident_summary: data.incident_summary,
      evidence_urls: data.evidence_urls,
      evidence_notes: data.evidence_notes,
    })
    setTxHash(submitHash)
    await contracts.waitForTx(submitHash)

    // Step 2: read claim counter to get the new claim id
    const client = getClient()
    const raw = await client.readContract({ address: requireContract(), functionName: 'get_contract_summary', args: [] }) as string
    const claimId = 'claim-' + JSON.parse(raw).claim_counter

    // Step 3: fire request_claim_verdict — this kicks off AI validator consensus
    // Don't await it: takes 30-60s, redirect now so user sees live status on claim page
    contracts.requestClaimVerdict(claimId).catch(() => {})

    router.push(`/claim/${claimId}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <Link href={`/policy/${policyId}`} className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Policy Detail
      </Link>

      <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
        File a Claim
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main form */}
        <div className="lg:col-span-3 rounded-xl border p-6" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
          <ClaimBeacon policy={policy} onSubmit={handleSubmit} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {pool && (
            <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--salt-grey)' }}>Covered Under</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>{pool.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--salt-grey)' }}>Terms</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--salt-grey)' }}>{pool.terms_summary}</p>
              </div>
              <ExclusionReef exclusions={pool.exclusions_summary} />
            </div>
          )}

          <div className="rounded-xl border p-4 space-y-2" style={{ background: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.19)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--signal-amber)' }}>Before you submit</p>
            <ul className="space-y-1.5">
              {[
                'Ensure your incident is within the covered category',
                'Check that no exclusion applies to your situation',
                'Provide at least one public evidence URL',
                'Claims submitted after the deadline cannot be processed',
              ].map((tip, i) => (
                <li key={i} className="text-[11px] font-mono flex gap-2" style={{ color: 'var(--salt-grey)' }}>
                  <span style={{ color: 'var(--signal-amber)' }}>·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
