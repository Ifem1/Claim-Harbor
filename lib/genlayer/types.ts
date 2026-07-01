// Contract returns monetary values as JSON numbers, not JS BigInts.
type Wei = string | number

export interface Pool {
  id: string
  owner: string
  name: string
  category: string
  terms_hash: string
  terms_summary: string
  exclusions_summary: string
  liquidity_total: Wei
  liquidity_available: Wei
  liquidity_reserved: Wei
  premium_collected: Wei
  min_premium_bps: number
  max_cover_per_policy: Wei
  claim_window_days: number
  active: boolean
  created_at: number
}

export interface Policy {
  id: string
  pool_id: string
  buyer: string
  premium_paid: Wei
  cover_limit: Wei
  start_time: number
  end_time: number
  claim_deadline: number
  terms_hash: string
  terms_summary: string
  status: PolicyStatus
  created_at: number
}

export type PolicyStatus = 'active' | 'expired' | 'claimed' | 'cancelled'

export interface Claim {
  id: string
  policy_id: string
  pool_id: string
  claimant: string
  requested_payout: Wei
  incident_summary: string
  evidence_summary: string
  evidence_urls: string[]
  submitted_at: number
  verdict: ClaimVerdict | null
  payout_amount: Wei
  payout_claimed: boolean
  public_proof_enabled: boolean
  status: ClaimStatus
}

export type ClaimStatus =
  | 'submitted'
  | 'reviewing'
  | 'verdict_stored'
  | 'payout_open'
  | 'paid'
  | 'rejected'
  | 'manual_review'
  | 'invalid'

export type VerdictLabel =
  | 'approved_full'
  | 'approved_partial'
  | 'rejected_not_covered'
  | 'rejected_exclusion_applies'
  | 'rejected_late_claim'
  | 'rejected_insufficient_evidence'
  | 'rejected_fraud_risk'
  | 'manual_review_required'
  | 'invalid_policy'

export interface ClaimVerdict {
  verdict: VerdictLabel
  payout_bps: number
  confidence: number
  covered_event: boolean
  exclusion_applies: boolean
  short_reason: string
}

export interface PublicProof {
  claim_id: string
  verdict: VerdictLabel
  payout_amount: bigint
  payout_claimed: boolean
  pool_name: string
  policy_terms_summary: string
  tx_hash?: string
}

export function weiToGEN(wei: bigint | number): string {
  const val = typeof wei === 'number' ? BigInt(wei) : wei
  const gen = Number(val) / 1e18
  return gen % 1 === 0 ? gen.toFixed(0) : gen.toFixed(4)
}

export function genToWei(gen: number | string): bigint {
  return BigInt(Math.floor(Number(gen) * 1e18))
}

export const CATEGORY_LABELS: Record<string, string> = {
  saas_outage: 'SaaS Outage',
  creator_suspension: 'Creator Suspension',
  freelancer_nonpayment: 'Freelancer Non-Payment',
  event_disruption: 'Event Disruption',
  marketplace_dispute: 'Marketplace Dispute',
  other: 'Other',
}

export const VERDICT_LABELS: Record<VerdictLabel, string> = {
  approved_full: 'Approved — Full Payout',
  approved_partial: 'Approved — Partial Payout',
  rejected_not_covered: 'Rejected — Not Covered',
  rejected_exclusion_applies: 'Rejected — Exclusion Applies',
  rejected_late_claim: 'Rejected — Late Claim',
  rejected_insufficient_evidence: 'Rejected — Insufficient Evidence',
  rejected_fraud_risk: 'Rejected — Fraud Risk',
  manual_review_required: 'Manual Review Required',
  invalid_policy: 'Invalid Policy',
}

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  submitted: 'Submitted',
  reviewing: 'Under Review',
  verdict_stored: 'Verdict Stored',
  payout_open: 'Payout Open',
  paid: 'Paid',
  rejected: 'Rejected',
  manual_review: 'Manual Review',
  invalid: 'Invalid',
}

