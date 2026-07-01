'use client'

import type { Capsule } from '@/lib/types/vouch'
import { BOND_TIER_GEN, weiToGEN } from '@/lib/types/vouch'

interface ReputationHeatRingProps {
  capsule: Capsule
}

const TIER_MAX_GEN: Record<string, number> = {
  micro: 10,
  standard: 50,
  high_trust: 200,
  institutional: 500,
}

const STATUS_RING_COLOR: Record<string, string> = {
  active: 'var(--bond-gold)',
  upheld: 'var(--verdict-green)',
  challenged: 'var(--challenge-red)',
  under_review: 'var(--bond-gold)',
  downgraded: 'var(--bond-gold)',
  suspended: 'var(--challenge-red)',
  slashed: 'var(--challenge-red)',
  expired: 'var(--muted-steel)',
  retired: 'var(--muted-steel)',
}

export function ReputationHeatRing({ capsule }: ReputationHeatRingProps) {
  const genAmount = capsule.active_bond / 1e18
  const tierMax = TIER_MAX_GEN[capsule.bond_tier] ?? 10
  const fillRatio = Math.min(1, genAmount / tierMax)
  const ringColor = STATUS_RING_COLOR[capsule.status] ?? 'var(--muted-steel)'

  const radius = 52
  const cx = 64
  const cy = 64
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - fillRatio)

  // Challenge notches — evenly spread
  const challengeCount = Math.min(capsule.challenge_count, 12)
  const notches = Array.from({ length: challengeCount }, (_, i) => {
    const angle = (i / Math.max(challengeCount, 1)) * 2 * Math.PI - Math.PI / 2
    const x1 = cx + (radius - 6) * Math.cos(angle)
    const y1 = cy + (radius - 6) * Math.sin(angle)
    const x2 = cx + (radius + 6) * Math.cos(angle)
    const y2 = cy + (radius + 6) * Math.sin(angle)
    return { x1, y1, x2, y2 }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--glass)"
            strokeWidth="8"
          />
          {/* Fill ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
          {/* Challenge notches */}
          {notches.map((n, i) => (
            <line
              key={i}
              x1={n.x1}
              y1={n.y1}
              x2={n.x2}
              y2={n.y2}
              stroke="var(--challenge-red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          ))}
          {/* Center text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="var(--paper-white)"
            fontSize="14"
            fontFamily="var(--font-ibm-plex-mono)"
            fontWeight="bold"
          >
            {weiToGEN(capsule.active_bond)}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fill="var(--muted-steel)"
            fontSize="9"
            fontFamily="var(--font-ibm-plex-mono)"
          >
            GEN
          </text>
          {capsule.challenge_count > 0 && (
            <text
              x={cx}
              y={cy + 24}
              textAnchor="middle"
              fill="var(--challenge-red)"
              fontSize="8"
              fontFamily="var(--font-ibm-plex-mono)"
            >
              {capsule.challenge_count}×
            </text>
          )}
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono" style={{ color: 'var(--muted-steel)' }}>
          {BOND_TIER_GEN[capsule.bond_tier]}–{tierMax} GEN tier range
        </p>
        {capsule.challenge_count > 0 && (
          <p className="text-[10px] font-mono" style={{ color: 'var(--challenge-red)' }}>
            {capsule.challenge_count} challenge{capsule.challenge_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
