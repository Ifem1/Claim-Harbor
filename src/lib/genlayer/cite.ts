'use client'

import { GENLAYER_STUDIONET } from './chains'
import { getContractAddress } from './contracts'
import { ensureStudioNet, WalletError } from './client'
import type { Claim, Evidence, Review, TransactionResult } from '@/lib/types/cite'

async function getGenLayerClient(withProvider = false) {
  const { createClient } = await import('genlayer-js')
  const { studionet } = await import('genlayer-js/chains')
  return createClient({
    chain: studionet,
    endpoint: GENLAYER_STUDIONET.rpcUrl,
    ...(withProvider && typeof window !== 'undefined' && window.ethereum
      ? { provider: window.ethereum as NonNullable<Parameters<typeof createClient>[0]>['provider'] }
      : {}),
  })
}

function buildExplorerTxUrl(hash: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/tx/${hash}`
}

export function buildExplorerAddressUrl(address: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/address/${address}`
}

async function sendWrite(method: string, args: unknown[]): Promise<TransactionResult> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new WalletError('No wallet detected', 'NO_WALLET')
  }

  await ensureStudioNet()

  const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
  if (!accounts || accounts.length === 0) {
    throw new WalletError('Wallet not connected', 'NOT_CONNECTED')
  }

  const contractAddress = getContractAddress()
  const client = await getGenLayerClient(true) // pass injected wallet as provider

  const hash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: method,
    args: args as Parameters<typeof client.writeContract>[0]['args'],
    value: BigInt(0),
  })

  const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}` & { length: 66 } })

  const success = receipt.txExecutionResult === 1 || receipt.txExecutionResult === 0

  return {
    hash: hash as string,
    status: success ? 'confirmed' : 'failed',
    explorerUrl: buildExplorerTxUrl(hash as string),
  }
}

async function sendRead<T>(method: string, args: unknown[]): Promise<T> {
  const contractAddress = getContractAddress()
  const client = await getGenLayerClient()

  const result = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: method,
    args: args as Parameters<typeof client.readContract>[0]['args'],
  })

  return result as T
}

// All contract IDs are strings (e.g. "CLM-1", "EVI-3").
// Timestamps are ISO strings passed by the caller so they match the client clock.

function nowISO(): string {
  return new Date().toISOString()
}

export interface CreateClaimInput {
  title: string
  statement: string
  claimType: string
  evidenceStandard: string
  context: string
  excludedSources: string
  preferredSources: string
  deadline: number
}

export async function createClaim(input: CreateClaimInput): Promise<TransactionResult> {
  return sendWrite('create_claim', [
    input.title,
    input.statement,
    input.claimType,
    input.evidenceStandard,
    input.context,
    input.excludedSources,
    input.preferredSources,
    BigInt(input.deadline),
    nowISO(),
  ])
}

export interface SubmitEvidenceInput {
  claimId: string
  sourceUrl: string
  sourceTitle: string
  sourceType: string
  supportDirection: string
  explanation: string
  excerpt: string
  archivedUrl: string
}

export async function submitEvidence(input: SubmitEvidenceInput): Promise<TransactionResult> {
  return sendWrite('submit_evidence', [
    input.claimId,
    input.sourceUrl,
    input.sourceTitle,
    input.sourceType,
    input.supportDirection,
    input.explanation,
    input.excerpt,
    input.archivedUrl,
    nowISO(),
  ])
}

export async function requestReview(claimId: string): Promise<TransactionResult> {
  return sendWrite('request_review', [claimId, nowISO()])
}

export async function challengeEvidence(
  claimId: string,
  evidenceId: string,
  challengeReason: string,
  counterSourceUrl: string,
  challengerNotes: string,
): Promise<TransactionResult> {
  return sendWrite('challenge_evidence', [
    claimId,
    evidenceId,
    challengeReason,
    counterSourceUrl,
    challengerNotes,
    nowISO(),
  ])
}

export async function closeClaim(claimId: string): Promise<TransactionResult> {
  return sendWrite('close_claim', [claimId, nowISO()])
}

export async function getClaim(claimId: string): Promise<Claim> {
  return sendRead<Claim>('get_claim', [claimId])
}

export async function getEvidence(evidenceId: string): Promise<Evidence> {
  return sendRead<Evidence>('get_evidence', [evidenceId])
}

export async function getReview(reviewId: string): Promise<Review> {
  return sendRead<Review>('get_review', [reviewId])
}

export async function getClaimEvidenceIds(claimId: string): Promise<string> {
  return sendRead<string>('get_claim_evidence_ids', [claimId])
}

export async function getClaimReviewIds(claimId: string): Promise<string> {
  return sendRead<string>('get_claim_review_ids', [claimId])
}

export async function getLatestReview(claimId: string): Promise<string> {
  return sendRead<string>('get_latest_review', [claimId])
}

export async function getLatestReviewId(claimId: string): Promise<string> {
  return sendRead<string>('get_latest_review_id', [claimId])
}

export async function getCreatorClaimIds(wallet: string): Promise<string> {
  return sendRead<string>('get_creator_claim_ids', [wallet])
}

export async function getContractSummary(): Promise<string> {
  return sendRead<string>('get_contract_summary', [])
}

export function parsePipeSeparated(raw: string): string[] {
  if (!raw) return []
  return raw.split('|').filter(Boolean)
}
