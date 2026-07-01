# Cite — Evidence Court

> A link is not proof until the claim and the source have been judged together.

Cite is a GenLayer-powered decentralized evidence court. Users create public claims, submit public sources, and GenLayer validators reach consensus on whether those sources actually prove the claim — on-chain.

## Why GenLayer

A normal smart contract can verify that someone uploaded a URL. It cannot judge whether that URL proves a natural-language claim. GenLayer's Intelligent Contracts run nondeterministic consensus: multiple independent validators inspect each source and agree on a verdict before it is stored on-chain.

Cite uses this to answer: **Did the evidence actually prove the claim?**

## Architecture

```
/contracts/CiteEvidenceCourt.py   GenLayer Intelligent Contract
/app/                             Next.js 15 App Router pages
/src/components/cite/             Claim Lens, Evidence Stack, Consensus Panel
/src/lib/genlayer/                SDK client, chain config, contract interaction
/src/lib/types/                   TypeScript types
/src/lib/validation/              Zod schemas + claim sharpness meter
```

**Data flow:**
1. User fills form → Zod validates → `genlayer-js` writes to StudioNet
2. Contract stores Claim / Evidence / Review in `TreeMap` / `DynArray`
3. `request_review` calls GenLayer's nondeterministic consensus
4. Validators independently fetch sources and return canonical JSON verdict
5. Consensus result stored on-chain — frontend reads and displays it

## Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_claim(title, statement, claim_type, evidence_standard, context, excluded_sources, preferred_sources, deadline)` | write | Create a new claim, returns `claim_id` |
| `submit_evidence(claim_id, source_url, source_title, source_type, support_direction, explanation, excerpt, archived_url)` | write | Submit evidence for a claim, returns `evidence_id` |
| `request_review(claim_id)` | write | Trigger GenLayer consensus on submitted evidence, returns `review_id` |
| `challenge_evidence(claim_id, evidence_id, challenge_reason, counter_source_url)` | write | Mark evidence as challenged |
| `get_claim(claim_id)` | view | Read a Claim struct |
| `get_evidence(evidence_id)` | view | Read an Evidence struct |
| `get_claim_evidence_ids(claim_id)` | view | Get all evidence IDs for a claim |
| `get_review(review_id)` | view | Read a Review struct |
| `get_claim_latest_review(claim_id)` | view | Get the most recent review for a claim |

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, how-it-works, example claim rooms |
| `/claims` | Claim index with filters and verdict heat |
| `/claims/new` | Multi-step claim creation form with sharpness meter |
| `/claims/[id]` | Claim room — Claim Lens + Evidence Stack + Consensus Panel |
| `/claims/[id]/evidence/new` | Evidence submission form with source self-check |
| `/claims/[id]/review/[reviewId]` | Verdict detail — canonical JSON, ring, strongest/weakest source |
| `/sources` | Source library (demo fixture in MVP) |

## Environment Variables

```env
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_CITE_CONTRACT_ADDRESS=0x...  # Set after deploying the contract
```

Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_CITE_CONTRACT_ADDRESS` after deploying.

## Local Setup

```bash
git clone <repo>
cd CITE
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## StudioNet Deployment

1. Open [GenLayer Studio](https://studio.genlayer.com)
2. Create a new project and paste the contents of `contracts/CiteEvidenceCourt.py`
3. Deploy to StudioNet (chain ID 61999)
4. Copy the deployed contract address
5. Set `NEXT_PUBLIC_CITE_CONTRACT_ADDRESS=<address>` in `.env.local`
6. Restart the dev server

## Testing Steps

### Manual E2E

1. Install MetaMask and add StudioNet:
   - RPC: `https://studio.genlayer.com/api`
   - Chain ID: `61999`
   - Explorer: `https://explorer-studio.genlayer.com`

2. Get test GEN from the StudioNet faucet in GenLayer Studio

3. Connect wallet at `/` or `/claims/new`

4. Create a claim:
   - Title: "The GenLayer Studio documentation describes Studio as a sandbox for testing Intelligent Contracts"
   - Statement: "The official GenLayer Studio documentation explicitly describes Studio as a local sandbox environment for testing Intelligent Contracts, not a production deployment environment."
   - Type: Technical Capability
   - Standard: Official Source or Repository

5. Submit strong evidence:
   - URL: `https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio`
   - Type: Documentation Page
   - Direction: Supports

6. Submit weak evidence:
   - URL: `https://example.com/some-blog-post`
   - Type: Blog Post
   - Direction: Supports

7. Click "Request Review" from the Claim Room

8. Wait for GenLayer consensus (can take 30–90 seconds on StudioNet)

9. Refresh the Claim Room — the Consensus Panel will show the verdict

10. Open the explorer link to see the on-chain transaction

## Known Limitations

- `request_review` uses `gl.get_webpage` as the nondeterministic consensus call. On StudioNet, response times vary.
- The Sources page (`/sources`) uses demo fixtures in MVP. Full on-chain aggregation requires indexing all evidence across claims.
- GenLayer JS SDK wallet integration uses `window.ethereum` directly — MetaMask or a compatible injected wallet is required.
- The Claim Sharpness Meter is frontend-only heuristics, not GenLayer consensus.
- No pagination on `/claims` — loads up to 10 on-chain claims by sequential ID scan.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui** (Inkglass Evidence Lab theme)
- **Framer Motion** (verdict ring, evidence card animations)
- **genlayer-js** (SDK for StudioNet interaction)
- **Zod** + **react-hook-form** (form validation)
- **GenLayer Intelligent Contract** (Python, TreeMap/DynArray storage, nondeterministic review)
