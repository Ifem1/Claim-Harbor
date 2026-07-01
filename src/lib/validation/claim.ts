import { z } from 'zod'

const CLAIM_TYPES = [
  'product_ship',
  'public_statement',
  'technical_capability',
  'contribution_proof',
  'milestone_completion',
  'incident_claim',
  'policy_change',
  'identity_link',
  'market_metric',
  'general_claim',
] as const

const EVIDENCE_STANDARDS = [
  'primary_source_required',
  'strong_public_evidence',
  'multiple_independent_sources',
  'official_source_or_repository',
  'reasonable_public_support',
] as const

export const claimSchema = z.object({
  title: z.string().min(8, 'Title must be at least 8 characters').max(120, 'Title must be at most 120 characters'),
  statement: z
    .string()
    .min(30, 'Statement must be at least 30 characters')
    .max(600, 'Statement must be at most 600 characters'),
  claimType: z.enum(CLAIM_TYPES, 'Select a valid claim type'),
  evidenceStandard: z.enum(EVIDENCE_STANDARDS, 'Select a valid evidence standard'),
  context: z.string().max(1000, 'Context must be at most 1000 characters').optional().default(''),
  excludedSources: z.string().max(500, 'Excluded sources must be at most 500 characters').optional().default(''),
  preferredSources: z.string().max(500, 'Preferred sources must be at most 500 characters').optional().default(''),
  deadline: z.string().refine((val) => {
    const d = new Date(val)
    return !isNaN(d.getTime()) && d > new Date()
  }, 'Deadline must be a future date'),
})

export type ClaimFormData = z.infer<typeof claimSchema>

export interface SharpnessResult {
  score: number
  label: 'sharp' | 'acceptable' | 'vague' | 'too_vague'
  warnings: string[]
  rewards: string[]
}

export function assessClaimSharpness(statement: string, title: string): SharpnessResult {
  let score = 50
  const warnings: string[] = []
  const rewards: string[] = []

  if (statement.length < 30) {
    score -= 30
    warnings.push('Statement is too short to be verifiable.')
  } else if (statement.length < 60) {
    score -= 10
    warnings.push('Statement is quite short. More detail helps validators.')
  }

  const vagueWords = ['good', 'best', 'soon', 'probably', 'maybe', 'great', 'awesome', 'nice', 'better', 'worse']
  const foundVague = vagueWords.filter((w) => statement.toLowerCase().includes(w))
  if (foundVague.length > 0) {
    score -= foundVague.length * 8
    warnings.push(`Vague words detected: ${foundVague.join(', ')}. Be more specific.`)
  }

  const bundlingWords = [' and ', ' also ', ' plus ', ' as well as ']
  const foundBundling = bundlingWords.filter((w) => statement.toLowerCase().includes(w))
  if (foundBundling.length > 1) {
    score -= 20
    warnings.push('Claim may bundle multiple claims. Split into separate claims for cleaner verdicts.')
  }

  const hasNamedEntity =
    /\b[A-Z][a-zA-Z]{2,}\b/.test(statement) || /\b(0x[0-9a-fA-F]{8,})\b/.test(statement)
  if (hasNamedEntity) {
    score += 15
    rewards.push('Named entity detected — validators can identify the specific subject.')
  }

  const hasDate =
    /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december|Q[1-4])\b/i.test(
      statement,
    )
  if (hasDate) {
    score += 10
    rewards.push('Date or time reference detected — improves temporal precision.')
  }

  const hasUrl = /https?:\/\/\S+/.test(statement)
  if (hasUrl) {
    score += 10
    rewards.push('URL reference in claim — strong specificity signal.')
  }

  const hasRepo = /github\.com|gitlab\.com|bitbucket/.test(statement.toLowerCase())
  if (hasRepo) {
    score += 10
    rewards.push('Repository reference — strong technical specificity.')
  }

  const hasMetric =
    /\b\d+[\.,]?\d*\s*(%|k|m|b|million|billion|percent|users|transactions|tps)\b/i.test(statement)
  if (hasMetric) {
    score += 10
    rewards.push('Measurable metric detected — highly verifiable.')
  }

  score = Math.max(0, Math.min(100, score))

  let label: SharpnessResult['label']
  if (score >= 70) label = 'sharp'
  else if (score >= 45) label = 'acceptable'
  else if (score >= 25) label = 'vague'
  else label = 'too_vague'

  return { score, label, warnings, rewards }
}
