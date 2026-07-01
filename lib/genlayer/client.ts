'use client'

import { createClient, chains } from 'genlayer-js'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS as `0x${string}` | undefined
export const EXPLORER_URL = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? 'https://explorer-studio.genlayer.com'
export const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api'

const STUDIONET_CHAIN_ID = 61999
const STUDIONET_CHAIN_ID_HEX = '0xF22F'

export function buildExplorerTxUrl(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`
}

export function buildExplorerAddressUrl(address: string) {
  return `${EXPLORER_URL}/address/${address}`
}

/** Read-only client — no wallet needed */
export function getClient() {
  return createClient({ endpoint: RPC_URL, chain: chains.studionet })
}

/**
 * Ensures MetaMask is on StudioNet (chain 61999).
 * Prompts to add/switch if not already there.
 */
async function ensureStudioNet(provider: any) {
  try {
    const chainIdHex: string = await provider.request({ method: 'eth_chainId' })
    if (parseInt(chainIdHex, 16) === STUDIONET_CHAIN_ID) return
  } catch {
    // ignore — chain switch will fix it
  }
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: STUDIONET_CHAIN_ID_HEX }] })
  } catch (switchErr: any) {
    // 4902 = chain not added yet
    if (switchErr?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: STUDIONET_CHAIN_ID_HEX,
          chainName: 'GenLayer StudioNet',
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_URL],
        }],
      })
    } else {
      throw switchErr
    }
  }
}

/**
 * Write client — uses injected wallet (MetaMask/Rabby) for normal transaction signing.
 * Passes the connected address as `account` so genlayer-js routes eth_sendTransaction
 * through window.ethereum, not the GenLayer Snap.
 */
export async function getWriteClient() {
  if (typeof window === 'undefined') throw new Error('No window')
  const provider = (window as any).ethereum
  if (!provider) throw new Error('MetaMask or compatible wallet not found. Please install one.')

  // Ensure wallet is connected
  const accounts: string[] = await provider.request({ method: 'eth_accounts' })
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet not connected. Please connect your wallet first.')
  }

  // Switch to StudioNet if needed
  await ensureStudioNet(provider)

  const address = accounts[0] as `0x${string}`

  // Pass address as string account — genlayer-js routes eth_sendTransaction through
  // window.ethereum (normal MetaMask signing), not the Snap
  return createClient({
    endpoint: RPC_URL,
    chain: chains.studionet,
    account: address,
    provider,
  })
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const accounts = await (window as any).ethereum?.request({ method: 'eth_accounts' })
    return accounts?.[0] ?? null
  } catch {
    return null
  }
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const provider = (window as any).ethereum
  if (!provider) throw new Error('No wallet found. Install MetaMask or Rabby.')

  // If already permitted, return immediately without a popup
  const existing: string[] = await provider.request({ method: 'eth_accounts' }).catch(() => [])
  if (existing?.[0]) return existing[0]

  // Otherwise prompt connection
  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' })
  return accounts?.[0] ?? null
}

export function requireContract(): `0x${string}` {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured — set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS')
  return CONTRACT_ADDRESS
}

export function shortenAddress(addr: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatTimestamp(ts: number) {
  return new Date(ts < 1e12 ? ts * 1000 : ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
