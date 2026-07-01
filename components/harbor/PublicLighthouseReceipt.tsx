import type { PublicProof } from '@/lib/genlayer/types'
import { VERDICT_LABELS } from '@/lib/genlayer/types'
import { formatGEN } from '@/lib/format-gen'
import { verdictColor } from '@/lib/visibility'
import { buildExplorerTxUrl } from '@/lib/genlayer/client'
import { ExternalLink, Landmark } from 'lucide-react'

export function PublicLighthouseReceipt({ proof }: { proof: PublicProof }) {
  const color = verdictColor(proof.verdict)
  return (
    <div className="rounded-xl border p-6 space-y-5" style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 211, 238, 0.06)', border: '1px solid rgba(34, 211, 238, 0.19)' }}>
          <Landmark className="w-5 h-5" style={{ color: 'var(--beacon-cyan)' }} />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Public Proof</p>
          <p className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>#{proof.claim_id.slice(0, 12)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Verdict</span>
          <span className="text-xs font-mono font-semibold" style={{ color }}>{VERDICT_LABELS[proof.verdict]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Payout</span>
          <span className="text-xs font-mono" style={{ color: 'var(--payout-mint)' }}>{formatGEN(proof.payout_amount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Status</span>
          <span className="text-xs font-mono" style={{ color: proof.payout_claimed ? 'var(--payout-mint)' : 'var(--signal-amber)' }}>
            {proof.payout_claimed ? 'Settled' : 'Pending Claim'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--salt-grey)' }}>Pool</span>
          <span className="text-xs font-mono" style={{ color: 'var(--fog-white)' }}>{proof.pool_name}</span>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--salt-grey)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
        {proof.policy_terms_summary}
      </p>

      {proof.tx_hash && (
        <a
          href={buildExplorerTxUrl(proof.tx_hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-mono transition-colors hover:opacity-80"
          style={{ color: 'var(--tide-blue)' }}
        >
          <ExternalLink className="w-3 h-3" />
          View on Explorer
        </a>
      )}
    </div>
  )
}
