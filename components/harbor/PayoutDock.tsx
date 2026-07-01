'use client'

import { useState } from 'react'
import type { Claim } from '@/lib/genlayer/types'
import { formatGEN } from '@/lib/format-gen'
import { isApprovedVerdict } from '@/lib/visibility'
import { Lock, Unlock, XCircle } from 'lucide-react'

type DockState = 'idle' | 'awaiting_signature' | 'submitted' | 'success' | 'failed'

interface PayoutDockProps {
  claim: Claim
  onClaim?: () => Promise<void>
}

export function PayoutDock({ claim, onClaim }: PayoutDockProps) {
  const [state, setState] = useState<DockState>('idle')
  const approved = isApprovedVerdict(claim.verdict?.verdict)
  const rejected = claim.status === 'rejected'
  const payoutOpen = claim.status === 'payout_open'
  const pending = !claim.verdict
  const unlocked = approved && payoutOpen && !claim.payout_claimed
  const payoutAmount = Number(claim.payout_amount ?? 0)

  const handleClaim = async () => {
    if (!onClaim || !unlocked) return
    setState('awaiting_signature')
    try {
      await onClaim()
      setState('success')
    } catch {
      setState('failed')
    }
  }

  // Colours per state
  const borderColor = unlocked
    ? 'rgba(52, 211, 153, 0.25)'
    : rejected
    ? 'rgba(239, 68, 68, 0.18)'
    : 'rgba(34, 211, 238, 0.08)'

  const bg = unlocked
    ? 'linear-gradient(145deg, rgba(52,211,153,0.04), rgba(52,211,153,0.01))'
    : rejected
    ? 'linear-gradient(145deg, rgba(239,68,68,0.04), rgba(239,68,68,0.01))'
    : 'linear-gradient(145deg, #0E1E30, #0A1628)'

  const iconBg = unlocked
    ? 'rgba(52,211,153,0.1)'
    : rejected
    ? 'rgba(239,68,68,0.1)'
    : 'rgba(148,163,184,0.07)'

  const iconBorder = unlocked
    ? 'rgba(52,211,153,0.22)'
    : rejected
    ? 'rgba(239,68,68,0.22)'
    : 'rgba(148,163,184,0.12)'

  const titleColor = unlocked
    ? 'var(--payout-mint)'
    : rejected
    ? 'var(--reef-red)'
    : 'var(--salt-grey)'

  const title = claim.payout_claimed
    ? 'Payout Claimed'
    : unlocked
    ? 'Dock Gate Unlocked'
    : rejected
    ? 'Claim Rejected'
    : 'Dock Gate Locked'

  const subtitle = claim.payout_claimed
    ? 'GEN sent to your wallet'
    : unlocked
    ? 'Collect your GEN payout'
    : rejected
    ? (claim.verdict?.short_reason?.slice(0, 60) ?? 'No payout available')
    : pending
    ? 'Awaiting validator verdict'
    : 'No payout available'

  return (
    <div
      className="rounded-2xl border p-5 space-y-4 transition-all duration-300"
      style={{
        background: bg,
        borderColor,
        boxShadow: unlocked
          ? '0 4px 24px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
        >
          {rejected
            ? <XCircle className="w-4 h-4" style={{ color: 'var(--reef-red)' }} />
            : unlocked
            ? <Unlock className="w-4 h-4" style={{ color: 'var(--payout-mint)' }} />
            : <Lock className="w-4 h-4" style={{ color: 'var(--salt-grey)' }} />
          }
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: titleColor, fontFamily: 'var(--font-space-grotesk)' }}>
            {title}
          </p>
          <p className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: 'var(--salt-grey)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {payoutAmount > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Payout Amount</span>
          <span className="text-base font-mono font-bold" style={{ color: 'var(--payout-mint)' }}>
            {formatGEN(claim.payout_amount)}
          </span>
        </div>
      )}

      {claim.payout_claimed && (
        <p className="text-xs font-mono text-center py-2 rounded-lg" style={{ background: 'rgba(52, 211, 153, 0.06)', color: 'var(--payout-mint)', border: '1px solid rgba(52,211,153,0.12)' }}>
          ✓ GEN released to your wallet
        </p>
      )}

      {unlocked && state === 'idle' && (
        <button
          onClick={handleClaim}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, var(--payout-mint), #059669)',
            color: '#050D1A',
            boxShadow: '0 4px 16px rgba(52,211,153,0.25)',
          }}
        >
          Claim GEN Payout
        </button>
      )}

      {state === 'awaiting_signature' && (
        <p className="text-xs font-mono text-center py-2" style={{ color: 'var(--signal-amber)' }}>Waiting for signature…</p>
      )}
      {state === 'submitted' && (
        <p className="text-xs font-mono text-center py-2" style={{ color: 'var(--beacon-cyan)' }}>Transaction submitted…</p>
      )}
      {state === 'success' && (
        <p className="text-xs font-mono text-center py-2 rounded-lg" style={{ background: 'rgba(52,211,153,0.06)', color: 'var(--payout-mint)' }}>GEN transferred successfully</p>
      )}
      {state === 'failed' && (
        <button onClick={() => setState('idle')} className="w-full py-2 rounded-lg text-xs font-mono" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--reef-red)', border: '1px solid rgba(239,68,68,0.18)' }}>
          Transaction failed — retry
        </button>
      )}
    </div>
  )
}
