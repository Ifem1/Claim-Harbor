'use client'

import { GENLAYER_STUDIONET } from './chains'
import { getConnectedAddress, ensureStudioNet } from './client'
import type {
  Capsule,
  Endorsement,
  Challenge,
  Verdict,
  AdminMonitorStats,
  ActivityRecord,
} from '@/lib/types/vouch'

export const VOUCH_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOUCH_CONTRACT_ADDRESS ?? ''

export function getVouchContractAddress(): string {
  if (!VOUCH_CONTRACT_ADDRESS) {
    throw new Error('Vouch contract address not configured. Set NEXT_PUBLIC_VOUCH_CONTRACT_ADDRESS.')
  }
  return VOUCH_CONTRACT_ADDRESS
}

export function buildExplorerTxUrl(hash: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/tx/${hash}`
}

export function buildExplorerAddressUrl(address: string): string {
  return `${GENLAYER_STUDIONET.explorerUrl}/address/${address}`
}

async function getGenLayerClient(withProvider = false) {
  const { createClient } = await import('genlayer-js')
  const { studionet } = await import('genlayer-js/chains')

  const options: Record<string, unknown> = {
    chain: studionet,
    endpoint: GENLAYER_STUDIONET.rpcUrl,
  }

  if (withProvider && typeof window !== 'undefined' && window.ethereum) {
    options.account = window.ethereum
  }

  return createClient(options)
}

async function sendWrite(method: string, args: unknown[], valueWei = 0): Promise<{ hash: string }> {
  await ensureStudioNet()
  const client = await getGenLayerClient(true)
  const address = getVouchContractAddress()

  const hash = await client.writeContract({
    address,
    functionName: method,
    args,
    value: BigInt(valueWei),
  })

  await client.waitForTransactionReceipt({ hash })
  return { hash: String(hash) }
}

async function sendRead<T>(method: string, args: unknown[]): Promise<T> {
  const client = await getGenLayerClient(false)
  const address = getVouchContractAddress()

  const result = await client.readContract({
    address,
    functionName: method,
    args,
  })

  if (typeof result === 'string') {
    return JSON.parse(result) as T
  }
  return result as T
}

// ─── Capsule Writes ───────────────────────────────────────────────────────────

export async function createCapsule(params: {
  capsule_id: string
  claim_title: string
  claim_body: string
  category: string
  scope_boundaries: string
  public_evidence_urls: string[]
  private_evidence_commitment_hash: string
  visibility_mode: string
  bond_tier: string
  bond_amount_wei: number
  expires_at: string
}): Promise<{ hash: string }> {
  return sendWrite(
    'create_capsule',
    [
      params.capsule_id,
      params.claim_title,
      params.claim_body,
      params.category,
      params.scope_boundaries,
      JSON.stringify(params.public_evidence_urls),
      params.private_evidence_commitment_hash,
      params.visibility_mode,
      params.bond_tier,
      params.bond_amount_wei,
      params.expires_at,
    ],
    params.bond_amount_wei,
  )
}

export async function increaseCapsuleBond(capsuleId: string, additionalWei: number): Promise<{ hash: string }> {
  return sendWrite('increase_capsule_bond', [capsuleId, additionalWei], additionalWei)
}

export async function retireCapsule(capsuleId: string): Promise<{ hash: string }> {
  return sendWrite('retire_capsule', [capsuleId])
}

export async function renewCapsule(
  capsuleId: string,
  newExpiresAt: string,
  additionalBondWei: number,
): Promise<{ hash: string }> {
  return sendWrite('renew_capsule', [capsuleId, newExpiresAt, additionalBondWei], additionalBondWei)
}

export async function withdrawUnlockedBond(capsuleId: string, amountWei: number): Promise<{ hash: string }> {
  return sendWrite('withdraw_unlocked_bond', [capsuleId, amountWei])
}

// ─── Endorsement Writes ───────────────────────────────────────────────────────

export async function endorseCapsule(
  capsuleId: string,
  note: string,
  bondAmountWei: number,
): Promise<{ hash: string }> {
  return sendWrite('endorse_capsule', [capsuleId, note, bondAmountWei], bondAmountWei)
}

export async function withdrawEndorsement(endorsementId: string): Promise<{ hash: string }> {
  return sendWrite('withdraw_endorsement', [endorsementId])
}

export async function claimEndorsementRefund(endorsementId: string): Promise<{ hash: string }> {
  return sendWrite('claim_endorsement_refund', [endorsementId])
}

// ─── Challenge Writes ─────────────────────────────────────────────────────────

export async function openChallenge(params: {
  capsule_id: string
  challenge_type: string
  summary: string
  evidence_urls: string[]
  bond_amount_wei: number
}): Promise<{ hash: string }> {
  return sendWrite(
    'open_challenge',
    [
      params.capsule_id,
      params.challenge_type,
      params.summary,
      JSON.stringify(params.evidence_urls),
      params.bond_amount_wei,
    ],
    params.bond_amount_wei,
  )
}

export async function requestChallengeVerdict(challengeId: string): Promise<{ hash: string }> {
  return sendWrite('request_challenge_verdict', [challengeId])
}

export async function resolveChallenge(challengeId: string): Promise<{ hash: string }> {
  return sendWrite('resolve_challenge', [challengeId])
}

export async function claimChallengeReward(challengeId: string): Promise<{ hash: string }> {
  return sendWrite('claim_challenge_reward', [challengeId])
}

// ─── Read Views ───────────────────────────────────────────────────────────────

export async function getCapsule(capsuleId: string): Promise<Capsule> {
  return sendRead<Capsule>('get_capsule', [capsuleId])
}

export async function getCapsuleOwnerView(capsuleId: string): Promise<Capsule> {
  return sendRead<Capsule>('get_capsule_owner_view', [capsuleId])
}

export async function getPublicCapsules(
  offset: number,
  limit: number,
): Promise<{ items: Capsule[]; total: number; offset: number; limit: number }> {
  return sendRead('get_public_capsules', [offset, limit])
}

export async function getCapsulesByOwner(address: string): Promise<Capsule[]> {
  return sendRead<Capsule[]>('get_capsules_by_owner', [address])
}

export async function getCapsuleChallenges(capsuleId: string): Promise<Challenge[]> {
  return sendRead<Challenge[]>('get_capsule_challenges', [capsuleId])
}

export async function getCapsuleEndorsements(capsuleId: string): Promise<Endorsement[]> {
  return sendRead<Endorsement[]>('get_capsule_endorsements', [capsuleId])
}

export async function getVerdict(verdictId: string): Promise<Verdict | null> {
  if (!verdictId) return null
  const result = await sendRead<Verdict | { error: string }>('get_verdict', [verdictId])
  if ('error' in result) return null
  return result as Verdict
}

export async function getEndorserDashboard(
  address: string,
): Promise<{ endorsements: Endorsement[]; total_locked_wei: number }> {
  return sendRead('get_endorser_dashboard', [address])
}

export async function getChallengerDashboard(
  address: string,
): Promise<{ challenges: Challenge[] }> {
  return sendRead('get_challenger_dashboard', [address])
}

export async function getWalletActivity(address: string, limit: number): Promise<ActivityRecord[]> {
  return sendRead<ActivityRecord[]>('get_wallet_activity', [address, limit])
}

export async function getAdminMonitorStats(): Promise<AdminMonitorStats> {
  return sendRead<AdminMonitorStats>('get_admin_monitor_stats', [])
}

export { getConnectedAddress }
