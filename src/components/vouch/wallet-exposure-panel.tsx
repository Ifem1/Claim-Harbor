'use client'

import type { ActivityRecord } from '@/lib/types/vouch'
import { weiToGEN } from '@/lib/types/vouch'
import { buildExplorerTxUrl } from '@/lib/genlayer/vouch'
import { formatTimestamp } from '@/lib/utils/explorer'
import { ArrowUpRight, Shield, Users, AlertTriangle, CheckCircle2, RotateCcw, Download } from 'lucide-react'

interface WalletExposurePanelProps {
  address: string
  activity: ActivityRecord[]
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  create_capsule: <Shield className="w-3.5 h-3.5" style={{ color: 'var(--bond-gold)' }} />,
  increase_bond: <Shield className="w-3.5 h-3.5" style={{ color: 'var(--bond-gold)' }} />,
  retire_capsule: <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--muted-steel)' }} />,
  renew_capsule: <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--signal-blue)' }} />,
  endorse_capsule: <Users className="w-3.5 h-3.5" style={{ color: 'var(--signal-blue)' }} />,
  withdraw_endorsement: <Download className="w-3.5 h-3.5" style={{ color: 'var(--muted-steel)' }} />,
  claim_endorsement_refund: <Download className="w-3.5 h-3.5" style={{ color: 'var(--verdict-green)' }} />,
  open_challenge: <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--challenge-red)' }} />,
  verdict_requested: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--electric-violet)' }} />,
  resolve_challenge: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--verdict-green)' }} />,
  claim_challenge_reward: <Download className="w-3.5 h-3.5" style={{ color: 'var(--verdict-green)' }} />,
  withdraw_bond: <Download className="w-3.5 h-3.5" style={{ color: 'var(--bond-gold)' }} />,
}

const TYPE_LABEL: Record<string, string> = {
  create_capsule: 'Created Capsule',
  increase_bond: 'Bond Increased',
  retire_capsule: 'Capsule Retired',
  renew_capsule: 'Capsule Renewed',
  endorse_capsule: 'Endorsed Capsule',
  withdraw_endorsement: 'Endorsement Withdrawn',
  claim_endorsement_refund: 'Refund Claimed',
  open_challenge: 'Challenge Opened',
  verdict_requested: 'Verdict Requested',
  resolve_challenge: 'Challenge Resolved',
  claim_challenge_reward: 'Reward Claimed',
  withdraw_bond: 'Bond Withdrawn',
}

export function WalletExposurePanel({ address, activity }: WalletExposurePanelProps) {
  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--muted-steel)' }}>
        <p className="text-sm">No wallet activity found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activity.map((record, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg border"
          style={{ background: 'var(--fog-panel)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--glass)', border: '1px solid var(--line)' }}
            >
              {TYPE_ICON[record.type] ?? <Shield className="w-3.5 h-3.5" style={{ color: 'var(--muted-steel)' }} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--paper-white)' }}>
                {TYPE_LABEL[record.type] ?? record.type.replace(/_/g, ' ')}
              </p>
              {record.capsule_id && (
                <p className="text-[10px] font-mono truncate" style={{ color: 'var(--muted-steel)' }}>
                  {record.capsule_id.slice(0, 24)}…
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            {record.amount_wei != null && record.amount_wei > 0 && (
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--bond-gold)' }}>
                {weiToGEN(record.amount_wei)} GEN
              </span>
            )}
            <span className="text-[10px] font-mono hidden sm:block" style={{ color: 'var(--muted-steel)' }}>
              {formatTimestamp(record.timestamp)}
            </span>
            {record.tx_hash && (
              <a
                href={buildExplorerTxUrl(record.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] font-mono transition-colors hover:text-[var(--signal-blue)]"
                style={{ color: 'var(--muted-steel)' }}
              >
                <ArrowUpRight className="w-3 h-3" />
                tx
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
