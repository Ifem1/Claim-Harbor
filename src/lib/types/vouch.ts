// ─── Enums / Unions ───────────────────────────────────────────────────────────

export type CapsuleStatus =
  | 'active'
  | 'under_review'
  | 'challenged'
  | 'upheld'
  | 'downgraded'
  | 'suspended'
  | 'slashed'
  | 'expired'
  | 'retired'

export type BondTier = 'micro' | 'standard' | 'high_trust' | 'institutional'

export type VerdictStatus =
  | 'trustworthy'
  | 'weakly_supported'
  | 'overstated'
  | 'contradicted'
  | 'unverifiable'
  | 'impersonation_risk'
  | 'material_breach'
  | 'invalid_challenge'
  | 'insufficient_evidence'

export type VerdictAction =
  | 'keep_active'
  | 'downgrade'
  | 'suspend'
  | 'slash_partial'
  | 'slash_full'
  | 'expire_without_slash'
  | 'dismiss_challenge'

export type ChallengeType =
  | 'factual_inaccuracy'
  | 'outdated_claim'
  | 'scope_overstated'
  | 'identity_mismatch'
  | 'evidence_fabrication'
  | 'material_breach'
  | 'other'

export type CapsuleCategory =
  | 'technical_capability'
  | 'professional_experience'
  | 'contribution_proof'
  | 'partnership_claim'
  | 'audit_result'
  | 'identity_verification'
  | 'credential_claim'
  | 'incident_claim'
  | 'other'

export type ClaimAlignment = 'full' | 'partial' | 'weak' | 'none' | 'contradicted'
export type EvidenceStrength = 'high' | 'medium' | 'low' | 'insufficient'
export type Materiality = 'high' | 'medium' | 'low' | 'none'
export type VisibilityMode = 'public' | 'private'

export type ChallengeStatus =
  | 'open'
  | 'verdict_pending'
  | 'resolved'

export type EndorsementStatus = 'active' | 'withdrawn' | 'refunded' | 'slashed'

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Capsule {
  capsule_id: string
  owner: string
  claim_title: string
  claim_body: string
  category: CapsuleCategory
  scope_boundaries: string
  public_evidence_urls: string[]
  private_evidence_commitment_hash?: string // only in owner view
  visibility_mode: VisibilityMode
  bond_tier: BondTier
  active_bond: number
  total_bonded: number
  status: CapsuleStatus
  endorsement_count: number
  challenge_count: number
  created_at: string
  updated_at: string
  expires_at: string
  latest_verdict_id: string
  renewal_count: number
}

export interface Endorsement {
  endorsement_id: string
  capsule_id: string
  endorser: string
  note: string
  bond_amount_wei: number
  status: EndorsementStatus
  created_at: string
  updated_at: string
  challenge_exposure: boolean
  refund_claimed: boolean
  // dashboard extras
  capsule_status?: CapsuleStatus
  capsule_title?: string
}

export interface Challenge {
  challenge_id: string
  capsule_id: string
  challenger: string
  challenge_type: ChallengeType
  summary: string
  evidence_urls: string[]
  bond_amount_wei: number
  status: ChallengeStatus
  created_at: string
  updated_at: string
  verdict_id: string
  reward_claimed: boolean
  // dashboard extra
  verdict?: Verdict
}

export interface Verdict {
  verdict_id: string
  challenge_id: string
  capsule_id: string
  verdict_status: VerdictStatus
  action: VerdictAction
  claim_alignment: ClaimAlignment
  evidence_strength: EvidenceStrength
  materiality: Materiality
  slash_bps: number
  confidence: number
  short_reason: string
  created_at: string
  resolved: boolean
  resolved_at?: string
}

export interface AdminMonitorStats {
  total_capsules: number
  active_capsules: number
  total_bonded_wei: number
  total_challenge_bonds_wei: number
  active_disputes: number
  pending_verdicts: number
  stuck_withdrawals: number
  protocol_reserve_wei: number
  contract_version: string
  owner: string
}

export interface ActivityRecord {
  type: string
  capsule_id?: string
  endorsement_id?: string
  challenge_id?: string
  verdict_id?: string
  amount_wei?: number
  action?: string
  timestamp: string
  tx_hash: string
}

export interface TransactionResult {
  hash: string
  success: boolean
  error?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const BOND_TIER_LABELS: Record<BondTier, string> = {
  micro: 'Micro',
  standard: 'Standard',
  high_trust: 'High Trust',
  institutional: 'Institutional',
}

export const BOND_TIER_GEN: Record<BondTier, number> = {
  micro: 1,
  standard: 10,
  high_trust: 50,
  institutional: 200,
}

export const STATUS_LABELS: Record<CapsuleStatus, string> = {
  active: 'Active',
  under_review: 'Under Review',
  challenged: 'Challenged',
  upheld: 'Upheld',
  downgraded: 'Downgraded',
  suspended: 'Suspended',
  slashed: 'Slashed',
  expired: 'Expired',
  retired: 'Retired',
}

export const VERDICT_LABELS: Record<VerdictStatus, string> = {
  trustworthy: 'Trustworthy',
  weakly_supported: 'Weakly Supported',
  overstated: 'Overstated',
  contradicted: 'Contradicted',
  unverifiable: 'Unverifiable',
  impersonation_risk: 'Impersonation Risk',
  material_breach: 'Material Breach',
  invalid_challenge: 'Invalid Challenge',
  insufficient_evidence: 'Insufficient Evidence',
}

export const CATEGORY_LABELS: Record<CapsuleCategory, string> = {
  technical_capability: 'Technical Capability',
  professional_experience: 'Professional Experience',
  contribution_proof: 'Contribution Proof',
  partnership_claim: 'Partnership Claim',
  audit_result: 'Audit Result',
  identity_verification: 'Identity Verification',
  credential_claim: 'Credential Claim',
  incident_claim: 'Incident Claim',
  other: 'Other',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ONE_GEN = 1e18

export function weiToGEN(wei: number): string {
  if (!wei || wei === 0) return '0'
  const gen = wei / ONE_GEN
  if (gen < 0.001) return gen.toExponential(2)
  if (gen < 1) return gen.toFixed(4)
  if (gen < 100) return gen.toFixed(2)
  return Math.round(gen).toLocaleString()
}

export function genToWei(gen: number): number {
  return Math.round(gen * ONE_GEN)
}

export function bondTierFromAmount(wei: number): BondTier {
  if (wei >= 200 * ONE_GEN) return 'institutional'
  if (wei >= 50 * ONE_GEN) return 'high_trust'
  if (wei >= 10 * ONE_GEN) return 'standard'
  return 'micro'
}
