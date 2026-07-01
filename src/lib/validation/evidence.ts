import { z } from 'zod'

const SOURCE_TYPES = [
  'official_docs',
  'github_repository',
  'github_commit',
  'github_issue_or_pr',
  'explorer_transaction',
  'social_post',
  'blog_post',
  'news_article',
  'forum_thread',
  'documentation_page',
  'dashboard_or_metric',
  'other_public_source',
] as const

const SUPPORT_DIRECTIONS = ['supports', 'contradicts', 'contextual', 'uncertain'] as const

export const evidenceSchema = z.object({
  sourceUrl: z
    .string()
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), 'URL must use http or https'),
  sourceTitle: z
    .string()
    .min(5, 'Source title must be at least 5 characters')
    .max(160, 'Source title must be at most 160 characters'),
  sourceType: z.enum(SOURCE_TYPES, 'Select a valid source type'),
  supportDirection: z.enum(SUPPORT_DIRECTIONS, 'Select a support direction'),
  explanation: z
    .string()
    .min(20, 'Explanation must be at least 20 characters')
    .max(500, 'Explanation must be at most 500 characters'),
  excerpt: z.string().max(300, 'Excerpt must be at most 300 characters').optional().default(''),
  archivedUrl: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'Archived URL must use http or https',
    })
    .default(''),
})

export type EvidenceFormData = z.infer<typeof evidenceSchema>
