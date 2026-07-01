'use client'

import { motion } from 'framer-motion'
import type { Verdict, Confidence } from '@/lib/types/cite'
import { VERDICT_LABELS, VERDICT_COLORS } from '@/lib/types/cite'

interface VerdictRingProps {
  verdict: Verdict
  confidence: Confidence
  size?: number
  animate?: boolean
}

const CONFIDENCE_OPACITY: Record<Confidence, number> = {
  high: 1,
  medium: 0.75,
  low: 0.45,
}

export function VerdictRing({ verdict, confidence, size = 120, animate = true }: VerdictRingProps) {
  const color = VERDICT_COLORS[verdict]
  const opacity = CONFIDENCE_OPACITY[confidence]
  const r = size / 2 - 10
  const circumference = 2 * Math.PI * r
  const label = VERDICT_LABELS[verdict]

  const fill =
    verdict === 'proven' || verdict === 'mostly_supported'
      ? 1
      : verdict === 'weakly_supported' || verdict === 'mixed'
        ? 0.6
        : verdict === 'needs_more_sources' || verdict === 'insufficient_evidence'
          ? 0.3
          : verdict === 'contradicted' || verdict === 'unsupported'
            ? 0.9
            : 0.5

  const dashOffset = circumference * (1 - fill)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={6}
        />
        {/* Verdict arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : dashOffset}
          style={{ opacity, transformOrigin: `${size / 2}px ${size / 2}px`, rotate: '-90deg' }}
          animate={animate ? { strokeDashoffset: dashOffset } : undefined}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
        {/* Center label */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size < 100 ? 9 : 11}
          fontFamily="var(--font-ibm-plex-mono)"
          fontWeight="500"
        >
          {confidence.toUpperCase()}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--paper-muted)"
          fontSize={size < 100 ? 7 : 8}
          fontFamily="var(--font-ibm-plex-mono)"
        >
          confidence
        </text>
      </svg>
      <span
        className="text-xs font-mono text-center"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}
