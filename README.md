# Claim Harbor

> On-chain insurance protocol powered by GenLayer Intelligent Contracts on StudioNet.

Claim Harbor is a decentralized insurance platform where underwriters create liquidity pools, policyholders buy cover, and GenLayer's non-deterministic validator consensus decides claim verdicts — fully on-chain, no trusted intermediary.

## Why GenLayer

A normal smart contract can verify a transaction happened. It cannot judge whether real-world evidence supports an insurance claim. GenLayer Intelligent Contracts run non-deterministic consensus: multiple independent validators fetch and inspect evidence URLs, then agree on a verdict before it is stored on-chain.

Claim Harbor uses this to answer: **Does the evidence actually prove the insured event occurred?**

## How It Works

1. **Underwriters** create insurance pools (e.g. "GitHub Outage Cover") and deposit GEN liquidity
2. **Policyholders** browse pools on the Harbor Map and buy cover by paying a premium
3. When an insured event occurs, the policyholder **files a claim** with an evidence URL
4. GenLayer validators independently fetch the evidence and return a consensus verdict
5. If approved, the **Payout Dock** unlocks and GEN is released to the policyholder

## Architecture

```
/contracts/claim_harbor.py          GenLayer Intelligent Contract (Python)
/app/                               Next.js 15 App Router pages
/components/harbor/                 UI components (cards, dock, beacon, shell)
/lib/genlayer/                      SDK client, contract calls, chain config
/lib/genlayer/types.ts              TypeScript types (Pool, Policy, Claim)
/lib/format-gen.ts                  GEN token formatting helpers
```

## Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_pool(name, category, terms_summary, terms_full, premium_rate_bps, max_cover_multiple)` | write | Create a new insurance pool |
| `add_pool_liquidity(pool_id)` | write (payable) | Add GEN liquidity to a pool |
| `withdraw_unlocked_liquidity(pool_id, amount)` | write | Withdraw available liquidity |
| `set_pool_active(pool_id, active)` | write | Pause or unpause a pool |
| `buy_cover(pool_id, cover_limit, duration_days)` | write (payable) | Purchase a policy |
| `submit_claim(policy_id, pool_id, description, evidence_url, loss_amount)` | write | File an insurance claim |
| `request_claim_verdict(claim_id)` | write | Trigger GenLayer validator consensus |
| `claim_payout(claim_id)` | write | Collect approved payout |
| `get_pool(pool_id)` | view | Read a Pool struct |
| `get_policy(policy_id)` | view | Read a Policy struct |
| `get_claim(claim_id)` | view | Read a Claim struct |
| `get_policy_ids_for(owner)` | view | Get all policy IDs for an address |
| `get_claim_ids_for(owner)` | view | Get all claim IDs for an address |
| `get_contract_summary()` | view | Pool/policy/claim counters |

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/map` | Harbor Map — browse all active insurance pools |
| `/pool/[id]` | Pool detail — terms, liquidity, active policies |
| `/cabin` | My Cabin — your policies and claim history |
| `/policy/[id]` | Policy detail — file a claim, view status |
| `/claim/[id]` | Claim detail — verdict, payout dock |
| `/underwriter` | Underwriter dashboard — manage your pools |
| `/underwriter/pool/[id]` | Pool management — add liquidity, withdraw, pause |
| `/admin` | Admin panel — contract overview |

## Environment Variables

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x72f56eE1Cc381cE421AeaF3e7d7eD5Fe88905Dd1
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
```

## Local Setup

```bash
git clone https://github.com/Ifem1/Claim-Harbor.git
cd Claim-Harbor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chain

- **Network:** StudioNet
- **Chain ID:** 61999 (`0xF22F`)
- **RPC:** https://studio.genlayer.com/api
- **Explorer:** https://explorer-studio.genlayer.com
- **Contract:** `0x72f56eE1Cc381cE421AeaF3e7d7eD5Fe88905Dd1`

## Tech Stack

- [GenLayer](https://genlayer.com) — Intelligent Contract runtime + StudioNet
- [genlayer-js](https://github.com/yeagerai/genlayer-js) v1.1.8 — contract client
- [Next.js](https://nextjs.org) 15 — App Router
- [Tailwind CSS](https://tailwindcss.com) v4
- [Lucide](https://lucide.dev) icons
