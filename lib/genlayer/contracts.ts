import { getClient, getWriteClient, requireContract } from './client'
import type { Pool, Policy, Claim, PublicProof } from './types'

// Contract returns JSON strings for all reads — parse them here
function parseStr<T>(raw: unknown): T {
  if (typeof raw === 'string') return JSON.parse(raw) as T
  return raw as T
}

function nowISO() {
  return new Date().toISOString()
}

// ─── Read functions ──────────────────────────────────────────────────────────

export async function getPool(poolId: string): Promise<Pool> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_pool',
    args: [poolId],
  })
  return parseStr<Pool>(result)
}

export async function getAllPoolIds(): Promise<string[]> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_all_pool_ids',
    args: [],
  })
  const raw = typeof result === 'string' ? result : ''
  return raw ? raw.split('|') : []
}

export async function getAllPools(): Promise<Pool[]> {
  const ids = await getAllPoolIds()
  if (ids.length === 0) return []
  const pools = await Promise.all(ids.map(id => getPool(id).catch(() => null)))
  return pools.filter(Boolean) as Pool[]
}

export async function getPolicy(policyId: string): Promise<Policy> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_policy',
    args: [policyId],
  })
  return parseStr<Policy>(result)
}

export async function getClaim(claimId: string): Promise<Claim> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_claim',
    args: [claimId],
  })
  return parseStr<Claim>(result)
}

// Use get_policy_ids_for / get_claim_ids_for which take an explicit address param,
// bypassing gl.message.sender_address which is zero for gen_call reads.
export async function getMyPolicyIds(callerAddress: string): Promise<string[]> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_policy_ids_for',
    args: [callerAddress.toLowerCase()],
  })
  const raw = typeof result === 'string' ? result : ''
  return raw ? raw.split('|') : []
}

export async function getMyClaimIds(callerAddress: string): Promise<string[]> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_claim_ids_for',
    args: [callerAddress.toLowerCase()],
  })
  const raw = typeof result === 'string' ? result : ''
  return raw ? raw.split('|') : []
}

export async function getMyPolicies(callerAddress: string): Promise<Policy[]> {
  const ids = await getMyPolicyIds(callerAddress)
  if (ids.length === 0) return []
  const policies = await Promise.all(ids.map(id => getPolicy(id).catch(() => null)))
  return policies.filter(Boolean) as Policy[]
}

export async function getMyClaims(callerAddress: string): Promise<Claim[]> {
  const ids = await getMyClaimIds(callerAddress)
  if (ids.length === 0) return []
  const claims = await Promise.all(ids.map(id => getClaim(id).catch(() => null)))
  return claims.filter(Boolean) as Claim[]
}

export async function getPoolClaimIds(poolId: string): Promise<string[]> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_pool_claim_ids',
    args: [poolId],
  })
  const raw = typeof result === 'string' ? result : ''
  return raw ? raw.split('|') : []
}

export async function getPoolClaims(poolId: string): Promise<Claim[]> {
  const ids = await getPoolClaimIds(poolId)
  if (ids.length === 0) return []
  const claims = await Promise.all(ids.map(id => getClaim(id).catch(() => null)))
  return claims.filter(Boolean) as Claim[]
}

export async function getPublicProof(claimId: string): Promise<PublicProof> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_public_proof',
    args: [claimId],
  })
  return parseStr<PublicProof>(result)
}

export async function getPoolAccounting(poolId: string): Promise<{
  liquidity_total: string
  liquidity_available: string
  liquidity_reserved: string
  premium_collected: string
}> {
  const client = getClient()
  const result = await client.readContract({
    address: requireContract(),
    functionName: 'get_pool_accounting',
    args: [poolId],
  })
  return parseStr(result)
}

// ─── Write functions (trigger MetaMask signing) ──────────────────────────────

export async function createPool(params: {
  name: string
  category: string
  terms_summary: string
  exclusions_summary: string
  terms_hash: string
  max_cover_per_policy: bigint
  min_premium_bps: bigint
  claim_window_days: bigint
  liquidity_wei: bigint
}): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'create_pool',
    args: [
      params.name,
      params.category,
      params.terms_summary,
      params.exclusions_summary,
      params.terms_hash,
      params.max_cover_per_policy,
      params.min_premium_bps,
      params.claim_window_days,
      nowISO(),
    ],
    value: params.liquidity_wei,
  })
}

export async function addPoolLiquidity(poolId: string, amountWei: bigint): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'add_pool_liquidity',
    args: [poolId],
    value: amountWei,
  })
}

export async function setPoolActive(poolId: string, active: boolean): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'set_pool_active',
    args: [poolId, active],
    value: 0n,
  })
}

export async function buyCover(params: {
  pool_id: string
  cover_limit: bigint
  duration_days: bigint
  premium_wei: bigint
}): Promise<`0x${string}`> {
  const client = await getWriteClient()
  const now = new Date()
  const end = new Date(now.getTime() + Number(params.duration_days) * 86400000)
  const deadline = new Date(end.getTime() + 30 * 86400000) // +30 days claim window
  return await client.writeContract({
    address: requireContract(),
    functionName: 'buy_cover',
    args: [
      params.pool_id,
      params.cover_limit,
      params.duration_days,
      true,
      now.toISOString(),
      end.toISOString(),
      deadline.toISOString(),
      now.toISOString(),
    ],
    value: params.premium_wei,
  })
}

export async function submitClaim(params: {
  policy_id: string
  requested_payout: bigint
  incident_summary: string
  evidence_urls: string[]
  evidence_notes: string
}): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'submit_claim',
    args: [
      params.policy_id,
      params.requested_payout,
      params.incident_summary,
      params.evidence_urls.join(','),
      params.evidence_notes,
      nowISO(),
    ],
    value: 0n,
  })
}

export async function requestClaimVerdict(claimId: string): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'request_claim_verdict',
    args: [claimId],
    value: 0n,
  })
}

export async function claimPayout(claimId: string): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'claim_payout',
    args: [claimId],
    value: 0n,
  })
}

export async function withdrawUnlockedLiquidity(poolId: string, amountWei: bigint): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'withdraw_unlocked_liquidity',
    args: [poolId, amountWei, nowISO()],
    value: 0n,
  })
}

export async function publishClaimProof(claimId: string): Promise<`0x${string}`> {
  const client = await getWriteClient()
  return await client.writeContract({
    address: requireContract(),
    functionName: 'publish_claim_proof',
    args: [claimId],
    value: 0n,
  })
}

export async function waitForTx(hash: `0x${string}`) {
  const client = getClient()
  const receipt = await client.waitForTransactionReceipt({ hash: hash as any })

  // GenLayer transactions can succeed at EVM level but fail at GenVM level (rollback).
  // Detect this by fetching the transaction detail and checking execution_result.
  try {
    const detail = await client.getTransaction({ hash: hash as any }) as any
    const execResult = detail?.execution_result ?? detail?.result ?? detail?.genvm_result
    if (typeof execResult === 'string' && execResult.toUpperCase() === 'ERROR') {
      const msg = detail?.error_message ?? detail?.genvm_error ?? 'GenVM execution failed (rollback)'
      throw new Error(msg)
    }
  } catch (e: any) {
    if (e?.message && (e.message.includes('GenVM') || e.message.includes('rollback') || e.message.includes('Insufficient'))) {
      throw e
    }
    // Swallow node response shape errors — they don't indicate tx failure
  }

  return receipt
}
