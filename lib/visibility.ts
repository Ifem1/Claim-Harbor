export function isApprovedVerdict(verdict: string | null | undefined): boolean {
  return verdict === 'approved_full' || verdict === 'approved_partial'
}

export function isRejectedVerdict(verdict: string | null | undefined): boolean {
  return !!(verdict && verdict.startsWith('rejected_'))
}

export function verdictColor(verdict: string | null | undefined): string {
  if (!verdict) return 'var(--salt-grey)'
  if (isApprovedVerdict(verdict)) return 'var(--payout-mint)'
  if (isRejectedVerdict(verdict)) return 'var(--reef-red)'
  if (verdict === 'manual_review_required') return 'var(--signal-amber)'
  return 'var(--salt-grey)'
}

export function claimStatusColor(status: string): string {
  switch (status) {
    case 'payout_open':
    case 'paid': return 'var(--payout-mint)'
    case 'rejected':
    case 'invalid': return 'var(--reef-red)'
    case 'reviewing': return 'var(--tide-blue)'
    case 'submitted': return 'var(--signal-amber)'
    case 'verdict_stored': return 'var(--beacon-cyan)'
    case 'manual_review': return 'var(--signal-amber)'
    default: return 'var(--salt-grey)'
  }
}
