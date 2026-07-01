import Link from 'next/link'
import type { Policy } from '@/lib/genlayer/types'
import { formatGEN, daysFromNow } from '@/lib/format-gen'
import { Shield, ChevronRight, Clock } from 'lucide-react'

export function PrivateCabinCard({ policy }: { policy: Policy }) {
  const days = daysFromNow(policy.end_time)
  const expired = days < 0
  const urgent = !expired && days <= 7

  return (
    <Link href={`/policy/${policy.id}`}>
      <div
        className="rounded-2xl border p-5 cursor-pointer transition-all duration-200 group"
        style={{
          background: 'linear-gradient(145deg, #0E1E30 0%, #0A1628 100%)',
          borderColor: expired ? 'rgba(148,163,184,0.08)' : urgent ? 'rgba(245,158,11,0.18)' : 'rgba(34,211,238,0.1)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: expired ? 'rgba(148,163,184,0.06)' : 'rgba(34,211,238,0.08)',
                border: `1px solid ${expired ? 'rgba(148,163,184,0.1)' : 'rgba(34,211,238,0.15)'}`,
              }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: expired ? 'var(--salt-grey)' : 'var(--beacon-cyan)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>Policy</p>
              <p className="text-xs font-mono font-semibold" style={{ color: 'var(--fog-white)' }}>#{policy.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-full"
              style={{
                background: expired
                  ? 'rgba(148,163,184,0.08)'
                  : urgent
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(52,211,153,0.08)',
                color: expired ? 'var(--salt-grey)' : urgent ? 'var(--signal-amber)' : 'var(--payout-mint)',
                border: `1px solid ${expired ? 'rgba(148,163,184,0.12)' : urgent ? 'rgba(245,158,11,0.18)' : 'rgba(52,211,153,0.15)'}`,
                letterSpacing: '0.04em',
              }}
            >
              <Clock className="w-2.5 h-2.5" />
              {expired ? 'Expired' : `${days}d left`}
            </span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--salt-grey)' }} />
          </div>
        </div>

        <p className="text-[11px] leading-relaxed mt-3" style={{ color: 'var(--salt-grey)' }}>
          {policy.terms_summary?.slice(0, 110)}{(policy.terms_summary?.length ?? 0) > 110 ? '…' : ''}
        </p>

        <div
          className="flex items-center gap-5 mt-3 pt-3 border-t text-[10px] font-mono"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <span style={{ color: 'var(--salt-grey)' }}>
            Limit <span className="font-bold" style={{ color: 'var(--fog-white)' }}>{formatGEN(policy.cover_limit)}</span>
          </span>
          <span style={{ color: 'var(--salt-grey)' }}>
            Premium <span className="font-bold" style={{ color: 'var(--beacon-cyan)' }}>{formatGEN(policy.premium_paid)}</span>
          </span>
          <span
            className="ml-auto px-1.5 py-0.5 rounded"
            style={{
              background: policy.status === 'active' ? 'rgba(52,211,153,0.08)' : 'rgba(148,163,184,0.06)',
              color: policy.status === 'active' ? 'var(--payout-mint)' : 'var(--salt-grey)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '9px',
            }}
          >
            {policy.status}
          </span>
        </div>
      </div>
    </Link>
  )
}
