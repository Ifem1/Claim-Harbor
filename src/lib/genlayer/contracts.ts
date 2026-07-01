export const CITE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CITE_CONTRACT_ADDRESS ?? ''

export function getContractAddress(): string {
  const addr = CITE_CONTRACT_ADDRESS
  if (!addr) {
    throw new Error('Contract address not configured. Set NEXT_PUBLIC_CITE_CONTRACT_ADDRESS.')
  }
  return addr
}

export const VOUCH_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOUCH_CONTRACT_ADDRESS ?? ''
