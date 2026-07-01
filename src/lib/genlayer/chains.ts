export const GENLAYER_STUDIONET = {
  id: 61999,
  name: 'GenLayer StudioNet',
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api',
  explorerUrl: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? 'https://explorer-studio.genlayer.com',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
}

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999)
