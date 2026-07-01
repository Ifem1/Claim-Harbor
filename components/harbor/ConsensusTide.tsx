import type { ClaimStatus } from '@/lib/genlayer/types'
import { STATUS_LABELS } from '@/lib/genlayer/types'

const TIDE_STEPS: { status: ClaimStatus; label: string }[] = [
  { status: 'submitted', label: 'Distress Signal Sent' },
  { status: 'reviewing', label: 'Validators Reviewing' },
  { status: 'verdict_stored', label: 'Verdict Stored' },
  { status: 'payout_open', label: 'Payout Open' },
  { status: 'paid', label: 'Dock Released' },
]

const STATUS_ORDER: Record<ClaimStatus, number> = {
  submitted: 0,
  reviewing: 1,
  verdict_stored: 2,
  payout_open: 3,
  paid: 4,
  rejected: 2,
  manual_review: 2,
  invalid: 2,
}

export function ConsensusTide({ status }: { status: ClaimStatus }) {
  const currentStep = STATUS_ORDER[status] ?? 0
  const isRejected = status === 'rejected' || status === 'invalid'

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--salt-grey)' }}>Consensus Tide</p>
      <div className="relative">
        <div className="flex items-center gap-0">
          {TIDE_STEPS.map((step, i) => {
            const passed = i <= currentStep && !isRejected
            const active = i === currentStep && !isRejected
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all"
                    style={{
                      borderColor: passed ? 'var(--beacon-cyan)' : isRejected && i === currentStep ? 'var(--reef-red)' : 'var(--line)',
                      background: passed ? 'rgba(34, 211, 238, 0.13)' : 'transparent',
                    }}
                  >
                    {active && !isRejected && (
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--beacon-cyan)' }} />
                    )}
                    {passed && i < currentStep && (
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--beacon-cyan)' }} />
                    )}
                    {isRejected && i === currentStep && (
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--reef-red)' }} />
                    )}
                  </div>
                  <p className="text-[9px] font-mono text-center mt-1 leading-tight w-14" style={{
                    color: passed ? 'var(--beacon-cyan)' : isRejected && i === currentStep ? 'var(--reef-red)' : 'var(--salt-grey)'
                  }}>
                    {step.label}
                  </p>
                </div>
                {i < TIDE_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: passed ? 'rgba(34, 211, 238, 0.25)' : 'var(--line)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {isRejected && (
        <p className="text-xs font-mono px-3 py-1.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.06)', color: 'var(--reef-red)', border: '1px solid rgba(239, 68, 68, 0.13)' }}>
          {STATUS_LABELS[status]} — No payout available
        </p>
      )}
    </div>
  )
}
