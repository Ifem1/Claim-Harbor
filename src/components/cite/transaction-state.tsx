'use client'

import { CheckCircle, XCircle, Loader2, ExternalLink, Clock, Wallet } from 'lucide-react'
import type { TxState } from '@/lib/types/cite'

interface TransactionStateProps {
  state: TxState
  hash?: string
  explorerUrl?: string
  errorMessage?: string
}

const STATE_CONFIG: Record<TxState, { label: string; icon: React.ReactNode; color: string }> = {
  idle: { label: '', icon: null, color: '' },
  preparing: {
    label: 'Preparing transaction…',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-[var(--paper-muted)]',
  },
  wallet_confirm: {
    label: 'Confirm in wallet…',
    icon: <Wallet className="w-4 h-4" />,
    color: 'text-[var(--amber-doubt)]',
  },
  submitted: {
    label: 'Transaction submitted…',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-[var(--proof-blue)]',
  },
  waiting: {
    label: 'Waiting for confirmation…',
    icon: <Clock className="w-4 h-4 animate-pulse" />,
    color: 'text-[var(--proof-blue)]',
  },
  confirmed: {
    label: 'Confirmed on-chain',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-[var(--source-green)]',
  },
  failed: {
    label: 'Transaction failed',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-[var(--contradiction-red)]',
  },
}

export function TransactionState({ state, hash, explorerUrl, errorMessage }: TransactionStateProps) {
  if (state === 'idle') return null

  const config = STATE_CONFIG[state]

  return (
    <div
      className={`flex items-center gap-2 text-sm font-mono p-3 rounded border border-[var(--line)] bg-[var(--panel)] ${config.color}`}
    >
      {config.icon}
      <span>{config.label}</span>
      {errorMessage && state === 'failed' && (
        <span className="text-xs text-[var(--paper-muted)] ml-1">— {errorMessage}</span>
      )}
      {explorerUrl && hash && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-[var(--proof-blue)] hover:underline text-xs"
        >
          View on Explorer <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
