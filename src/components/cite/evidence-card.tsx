'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Archive, ThumbsUp, ThumbsDown, Minus, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Evidence } from '@/lib/types/cite'
import { SOURCE_TYPE_LABELS } from '@/lib/types/cite'
import { hostFromUrl, shortenAddress, formatTimestamp } from '@/lib/utils/explorer'

interface EvidenceCardProps {
  evidence: Evidence
  evidenceId: string
  index?: number
  isStrongest?: boolean
  isWeakest?: boolean
}

const DIRECTION_CONFIG = {
  supports: {
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    color: 'text-[var(--source-green)]',
    border: 'border-[var(--source-green)]/30',
    label: 'Supports',
  },
  contradicts: {
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
    color: 'text-[var(--contradiction-red)]',
    border: 'border-[var(--contradiction-red)]/30',
    label: 'Contradicts',
  },
  contextual: {
    icon: <Minus className="w-3.5 h-3.5" />,
    color: 'text-[var(--amber-doubt)]',
    border: 'border-[var(--amber-doubt)]/30',
    label: 'Contextual',
  },
  uncertain: {
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: 'text-[var(--paper-muted)]',
    border: 'border-[var(--line)]',
    label: 'Uncertain',
  },
}

export function EvidenceCard({ evidence, evidenceId, index = 0, isStrongest, isWeakest }: EvidenceCardProps) {
  const direction = DIRECTION_CONFIG[evidence.support_direction as keyof typeof DIRECTION_CONFIG] ?? DIRECTION_CONFIG.uncertain

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ rotate: 0.5, transition: { duration: 0.15 } }}
      className={`rounded-lg border bg-[var(--panel)] p-4 space-y-3 relative ${direction.border}`}
    >
      {(isStrongest || isWeakest) && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={`text-[10px] font-mono ${
              isStrongest
                ? 'border-[var(--source-green)]/40 text-[var(--source-green)]'
                : 'border-[var(--contradiction-red)]/40 text-[var(--contradiction-red)]'
            }`}
          >
            {isStrongest ? 'Strongest' : 'Weakest'}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-2 pr-16">
        <div className={`flex items-center gap-1 text-xs font-mono ${direction.color} shrink-0`}>
          {direction.icon}
          <span>{direction.label}</span>
        </div>
        <span className="text-xs font-mono text-[var(--paper-muted)]">#{evidenceId}</span>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm text-[var(--paper)] font-medium leading-snug">{evidence.source_title}</p>
        <div className="flex items-center gap-2">
          <a
            href={evidence.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--proof-blue)] hover:underline flex items-center gap-1 font-mono"
          >
            {hostFromUrl(evidence.source_url)}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <Badge variant="outline" className="text-[10px] font-mono border-[var(--line)] text-[var(--paper-muted)]">
            {SOURCE_TYPE_LABELS[evidence.source_type as keyof typeof SOURCE_TYPE_LABELS] ?? evidence.source_type}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-[var(--paper-muted)] leading-relaxed">{evidence.explanation}</p>

      {evidence.excerpt && (
        <blockquote className="border-l border-[var(--line)] pl-2 text-xs text-[var(--paper-muted)] italic">
          &ldquo;{evidence.excerpt}&rdquo;
        </blockquote>
      )}

      {evidence.archived_url && (
        <a
          href={evidence.archived_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--paper-muted)] hover:text-[var(--paper)] font-mono"
        >
          <Archive className="w-3 h-3" />
          Archived version
        </a>
      )}

      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-mono text-[var(--paper-muted)]">
        <span>{shortenAddress(evidence.submitter)}</span>
        <span>{formatTimestamp(evidence.submitted_at)}</span>
      </div>

      {evidence.review_status === 'challenged' && (
        <div className="text-[10px] font-mono text-[var(--contradiction-red)] border border-[var(--contradiction-red)]/30 rounded px-2 py-1">
          CHALLENGED
        </div>
      )}
    </motion.div>
  )
}
