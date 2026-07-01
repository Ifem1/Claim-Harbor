export type ClaimStatus = 'open' | 'under_review' | 'reviewed' | 'closed'

export type ClaimType =
  | 'product_ship'
  | 'public_statement'
  | 'technical_capability'
  | 'contribution_proof'
  | 'milestone_completion'
  | 'incident_claim'
  | 'policy_change'
  | 'identity_link'
  | 'market_metric'
  | 'general_claim'

export type EvidenceStandard =
  | 'primary_source_required'
  | 'strong_public_evidence'
  | 'multiple_independent_sources'
  | 'official_source_or_repository'
  | 'reasonable_public_support'

export type SourceType =
  | 'official_docs'
  | 'github_repository'
  | 'github_commit'
  | 'github_issue_or_pr'
  | 'explorer_transaction'
  | 'social_post'
  | 'blog_post'
  | 'news_article'
  | 'forum_thread'
  | 'documentation_page'
  | 'dashboard_or_metric'
  | 'other_public_source'

export type SupportDirection = 'supports' | 'contradicts' | 'contextual' | 'uncertain'

export type Verdict =
  | 'proven'
  | 'mostly_supported'
  | 'weakly_supported'
  | 'contradicted'
  | 'unsupported'
  | 'stale_evidence'
  | 'wrong_scope'
  | 'source_unreachable'
  | 'insufficient_evidence'
  | 'mixed'
  | 'needs_more_sources'

export type Confidence = 'high' | 'medium' | 'low'

export type SourceAlignment = 'direct' | 'indirect' | 'partial' | 'conflicting' | 'none'

export interface Claim {
  claim_id: string
  creator: string
  title: string
  statement: string
  claim_type: ClaimType
  evidence_standard: EvidenceStandard
  context: string
  excluded_sources: string
  preferred_sources: string
  deadline: string
  status: ClaimStatus
  created_at: string
  updated_at: string
  evidence_count: string
  review_count: string
  final_verdict: string
  final_confidence: string
  final_reason: string
}

export interface Evidence {
  evidence_id: string
  submitter: string
  claim_id: string
  source_url: string
  source_title: string
  source_type: SourceType
  support_direction: SupportDirection
  explanation: string
  excerpt: string
  archived_url: string
  submitted_at: string
  review_status: string
  evidence_verdict: string
  evidence_reason: string
}

export interface Review {
  review_id: string
  claim_id: string
  requested_by: string
  overall_verdict: Verdict
  confidence: Confidence
  source_alignment: SourceAlignment
  strongest_evidence_id: string | number
  weakest_evidence_id: string | number
  contradiction_found: boolean
  short_reason: string
  canonical_json: string
  requested_at: string
}

export interface TransactionResult {
  hash: string
  status: 'submitted' | 'confirmed' | 'failed'
  explorerUrl: string
}

export type TxState =
  | 'idle'
  | 'preparing'
  | 'wallet_confirm'
  | 'submitted'
  | 'waiting'
  | 'confirmed'
  | 'failed'

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  product_ship: 'Product Ship',
  public_statement: 'Public Statement',
  technical_capability: 'Technical Capability',
  contribution_proof: 'Contribution Proof',
  milestone_completion: 'Milestone Completion',
  incident_claim: 'Incident Claim',
  policy_change: 'Policy Change',
  identity_link: 'Identity Link',
  market_metric: 'Market Metric',
  general_claim: 'General Claim',
}

export const EVIDENCE_STANDARD_LABELS: Record<EvidenceStandard, string> = {
  primary_source_required: 'Primary Source Required',
  strong_public_evidence: 'Strong Public Evidence',
  multiple_independent_sources: 'Multiple Independent Sources',
  official_source_or_repository: 'Official Source or Repository',
  reasonable_public_support: 'Reasonable Public Support',
}

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official_docs: 'Official Docs',
  github_repository: 'GitHub Repository',
  github_commit: 'GitHub Commit',
  github_issue_or_pr: 'GitHub Issue / PR',
  explorer_transaction: 'Explorer Transaction',
  social_post: 'Social Post',
  blog_post: 'Blog Post',
  news_article: 'News Article',
  forum_thread: 'Forum Thread',
  documentation_page: 'Documentation Page',
  dashboard_or_metric: 'Dashboard / Metric',
  other_public_source: 'Other Public Source',
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  proven: 'Proven',
  mostly_supported: 'Mostly Supported',
  weakly_supported: 'Weakly Supported',
  contradicted: 'Contradicted',
  unsupported: 'Unsupported',
  stale_evidence: 'Stale Evidence',
  wrong_scope: 'Wrong Scope',
  source_unreachable: 'Source Unreachable',
  insufficient_evidence: 'Insufficient Evidence',
  mixed: 'Mixed',
  needs_more_sources: 'Needs More Sources',
}

export const VERDICT_COLORS: Record<Verdict, string> = {
  proven: 'var(--source-green)',
  mostly_supported: 'var(--source-green)',
  weakly_supported: 'var(--amber-doubt)',
  contradicted: 'var(--contradiction-red)',
  unsupported: 'var(--contradiction-red)',
  stale_evidence: 'var(--amber-doubt)',
  wrong_scope: 'var(--amber-doubt)',
  source_unreachable: 'var(--amber-doubt)',
  insufficient_evidence: 'var(--paper-muted)',
  mixed: 'var(--amber-doubt)',
  needs_more_sources: 'var(--proof-blue)',
}
