'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Policy, Pool } from '@/lib/genlayer/types'
import { ExclusionReef } from '@/components/harbor/ExclusionReef'
import { formatGEN, formatDate, daysFromNow } from '@/lib/format-gen'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'
import { Anchor, ChevronLeft, Radio, Shield } from 'lucide-react'

export default function PolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [pool, setPool] = useState<Pool | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setError('Contract not configured.'); return }
    import('@/lib/genlayer/contracts').then(m => m.getPolicy(policyId)).then(p => {
      setPolicy(p)
      if (p?.pool_id) import('@/lib/genlayer/contracts').then(m => m.getPool(p.pool_id)).then(setPool).catch(() => {})
    }).catch(() => setError('Policy not found.'))
  }, [policyId])

  if (!policy) {
    return (
      <div className="p-10 text-center text-sm font-mono" style={{ color: error ? 'var(--reef-red)' : 'var(--salt-grey)' }}>
        {error ?? 'Loading…'}
      </div>
    )
  }

  const days = daysFromNow(policy.end_time)
  const expired = days < 0
  const claimDays = daysFromNow(policy.claim_deadline)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <Link href="/cabin" className="inline-flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> My Cabin
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4" style={{ color: 'var(--beacon-cyan)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>Policy #{policy.id.slice(0, 12)}</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
          {pool?.name ?? 'Policy Detail'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Terms */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--tide-blue)' }} />
              <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Policy Terms</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fog-white)' }}>{policy.terms_summary}</p>
          </div>

          {/* Exclusions */}
          {pool && (
            <div className="rounded-xl border p-5" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
              <ExclusionReef exclusions={pool.exclusions_summary} />
            </div>
          )}

          {/* Policy timeline */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Timeline</p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <p className="mb-0.5" style={{ color: 'var(--salt-grey)' }}>Start</p>
                <p style={{ color: 'var(--fog-white)' }}>{formatDate(policy.start_time)}</p>
              </div>
              <div>
                <p className="mb-0.5" style={{ color: 'var(--salt-grey)' }}>End</p>
                <p style={{ color: expired ? 'var(--salt-grey)' : 'var(--payout-mint)' }}>
                  {formatDate(policy.end_time)} {expired ? '(expired)' : `(${days}d left)`}
                </p>
              </div>
              <div>
                <p className="mb-0.5" style={{ color: 'var(--salt-grey)' }}>Claim Deadline</p>
                <p style={{ color: claimDays < 7 ? 'var(--signal-amber)' : 'var(--fog-white)' }}>
                  {formatDate(policy.claim_deadline)}
                </p>
              </div>
              <div>
                <p className="mb-0.5" style={{ color: 'var(--salt-grey)' }}>Status</p>
                <p style={{ color: 'var(--payout-mint)' }}>{policy.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
            <div className="space-y-2.5">
              {[
                { label: 'Cover Limit', value: formatGEN(policy.cover_limit), color: 'var(--fog-white)' },
                { label: 'Premium Paid', value: formatGEN(policy.premium_paid), color: 'var(--beacon-cyan)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs font-mono">
                  <span style={{ color: 'var(--salt-grey)' }}>{label}</span>
                  <span style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File claim */}
          {policy.status === 'active' && (
            <Link href={`/claim/new/${policy.id}`}>
              <button
                className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'var(--signal-amber)', color: 'var(--ledger-ink)' }}
              >
                <Radio className="w-4 h-4" />
                File a Claim
              </button>
            </Link>
          )}
          {policy.status !== 'active' && (
            <div className="py-3 rounded-lg text-sm text-center font-mono" style={{ background: 'rgba(148, 163, 184, 0.09)', color: 'var(--salt-grey)' }}>
              Policy {policy.status} — no new claims
            </div>
          )}

          {pool && (
            <Link href={`/pool/${pool.id}`} className="block text-center text-xs font-mono py-2 transition-opacity hover:opacity-70" style={{ color: 'var(--salt-grey)' }}>
              View pool details →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
