from genlayer import *
from genlayer.py.types import u256
import json
import datetime


@gl.contract
class VouchReputation:
    # Bond minimums in wei
    MICRO: u256 = int(1e18)
    STANDARD: u256 = int(10e18)
    HIGH_TRUST: u256 = int(50e18)
    INSTITUTIONAL: u256 = int(200e18)
    MIN_ENDORSEMENT: u256 = int(1e18)
    MIN_CHALLENGE: u256 = int(2e18)
    CONTRACT_VERSION: str = "1.0.0"

    # Storage
    capsules: TreeMap[str, str]             # capsule_id -> JSON
    endorsements: TreeMap[str, str]         # endorsement_id -> JSON
    challenges: TreeMap[str, str]           # challenge_id -> JSON
    verdicts: TreeMap[str, str]             # verdict_id -> JSON
    owner_capsules: TreeMap[str, str]       # owner_address -> JSON array of capsule_ids
    endorser_index: TreeMap[str, str]       # endorser_address -> JSON array of endorsement_ids
    challenger_index: TreeMap[str, str]     # challenger_address -> JSON array of challenge_ids
    wallet_activity: TreeMap[str, str]      # address -> JSON array of activity records
    capsule_endorsements: TreeMap[str, str] # capsule_id -> JSON array of endorsement_ids
    capsule_challenges: TreeMap[str, str]   # capsule_id -> JSON array of challenge_ids
    public_capsule_ids: str                 # JSON array of all public capsule_ids
    protocol_reserve: u256

    def __init__(self):
        self.public_capsule_ids = "[]"
        self.protocol_reserve = u256(0)

    # --- Helpers ---

    def _now_iso(self) -> str:
        return datetime.datetime.utcnow().isoformat() + "Z"

    def _load_json(self, s: str) -> object:
        if not s:
            return []
        try:
            return json.loads(s)
        except Exception:
            return []

    def _gen_id(self, prefix: str, extra: str = "") -> str:
        import hashlib
        raw = f"{prefix}:{gl.message.sender_account}:{gl.message.value}:{extra}:{self._now_iso()}"
        return prefix + "_" + hashlib.sha256(raw.encode()).hexdigest()[:16]

    def _log_activity(self, address: str, record: dict):
        activities = list(self._load_json(self.wallet_activity.get(address, "[]")))
        activities.insert(0, record)
        if len(activities) > 200:
            activities = activities[:200]
        self.wallet_activity[address] = json.dumps(activities)

    def _get_capsule_dict(self, capsule_id: str) -> dict:
        raw = self.capsules.get(capsule_id, "")
        if not raw:
            raise Exception(f"Capsule not found: {capsule_id}")
        return json.loads(raw)

    def _save_capsule(self, capsule_id: str, capsule: dict):
        self.capsules[capsule_id] = json.dumps(capsule)

    # --- Capsule Writes ---

    @gl.public.write
    def create_capsule(
        self,
        capsule_id: str,
        claim_title: str,
        claim_body: str,
        category: str,
        scope_boundaries: str,
        public_evidence_urls: str,
        private_evidence_commitment_hash: str,
        visibility_mode: str,
        bond_tier: str,
        bond_amount_wei: int,
        expires_at: str,
    ):
        valid_categories = [
            "technical_capability", "professional_experience", "contribution_proof",
            "partnership_claim", "audit_result", "identity_verification",
            "credential_claim", "incident_claim", "other"
        ]
        valid_tiers = ["micro", "standard", "high_trust", "institutional"]
        valid_visibility = ["public", "private"]

        assert category in valid_categories, f"Invalid category: {category}"
        assert bond_tier in valid_tiers, f"Invalid bond_tier: {bond_tier}"
        assert visibility_mode in valid_visibility, f"Invalid visibility_mode: {visibility_mode}"

        tier_minimums = {
            "micro": int(self.MICRO),
            "standard": int(self.STANDARD),
            "high_trust": int(self.HIGH_TRUST),
            "institutional": int(self.INSTITUTIONAL),
        }
        assert int(gl.message.value) >= tier_minimums[bond_tier], "Insufficient bond for tier"
        assert int(gl.message.value) >= bond_amount_wei, "Value does not match declared bond"

        now = self._now_iso()
        capsule = {
            "capsule_id": capsule_id,
            "owner": gl.message.sender_account,
            "claim_title": claim_title,
            "claim_body": claim_body,
            "category": category,
            "scope_boundaries": scope_boundaries,
            "public_evidence_urls": json.loads(public_evidence_urls) if public_evidence_urls else [],
            "private_evidence_commitment_hash": private_evidence_commitment_hash,
            "visibility_mode": visibility_mode,
            "bond_tier": bond_tier,
            "active_bond": bond_amount_wei,
            "total_bonded": bond_amount_wei,
            "status": "active",
            "endorsement_count": 0,
            "challenge_count": 0,
            "created_at": now,
            "updated_at": now,
            "expires_at": expires_at,
            "latest_verdict_id": "",
            "renewal_count": 0,
        }
        self._save_capsule(capsule_id, capsule)

        # Update owner index
        owner_list = list(self._load_json(self.owner_capsules.get(gl.message.sender_account, "[]")))
        owner_list.append(capsule_id)
        self.owner_capsules[gl.message.sender_account] = json.dumps(owner_list)

        # Update public index
        pub_ids = list(self._load_json(self.public_capsule_ids))
        if visibility_mode == "public":
            pub_ids.append(capsule_id)
            self.public_capsule_ids = json.dumps(pub_ids)

        # Init sub-indexes
        self.capsule_endorsements[capsule_id] = "[]"
        self.capsule_challenges[capsule_id] = "[]"

        self._log_activity(gl.message.sender_account, {
            "type": "create_capsule",
            "capsule_id": capsule_id,
            "amount_wei": bond_amount_wei,
            "timestamp": now,
            "tx_hash": "",
        })

    @gl.public.write
    def increase_capsule_bond(self, capsule_id: str, additional_wei: int):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["owner"] == gl.message.sender_account, "Not capsule owner"
        assert capsule["status"] in ["active", "upheld"], "Cannot bond on inactive capsule"
        assert int(gl.message.value) >= additional_wei, "Insufficient value"

        capsule["active_bond"] = capsule["active_bond"] + additional_wei
        capsule["total_bonded"] = capsule["total_bonded"] + additional_wei
        capsule["updated_at"] = self._now_iso()
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "increase_bond",
            "capsule_id": capsule_id,
            "amount_wei": additional_wei,
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    @gl.public.write
    def retire_capsule(self, capsule_id: str):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["owner"] == gl.message.sender_account, "Not capsule owner"
        assert capsule["status"] in ["active", "upheld"], "Cannot retire capsule in current status"
        capsule["status"] = "retired"
        capsule["updated_at"] = self._now_iso()
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "retire_capsule",
            "capsule_id": capsule_id,
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    @gl.public.write
    def renew_capsule(self, capsule_id: str, new_expires_at: str, additional_bond_wei: int):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["owner"] == gl.message.sender_account, "Not capsule owner"
        assert capsule["status"] in ["active", "upheld", "expired"], "Cannot renew in current status"
        if additional_bond_wei > 0:
            assert int(gl.message.value) >= additional_bond_wei, "Insufficient value for bond"
            capsule["active_bond"] = capsule["active_bond"] + additional_bond_wei
            capsule["total_bonded"] = capsule["total_bonded"] + additional_bond_wei

        capsule["expires_at"] = new_expires_at
        capsule["renewal_count"] = capsule.get("renewal_count", 0) + 1
        capsule["status"] = "active"
        capsule["updated_at"] = self._now_iso()
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "renew_capsule",
            "capsule_id": capsule_id,
            "amount_wei": additional_bond_wei,
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    @gl.public.write
    def withdraw_unlocked_bond(self, capsule_id: str, amount_wei: int):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["owner"] == gl.message.sender_account, "Not capsule owner"
        assert capsule["status"] in ["retired", "expired", "slashed"], "Capsule must be retired/expired/slashed to withdraw"
        assert capsule["active_bond"] >= amount_wei, "Insufficient unlocked bond"

        capsule["active_bond"] = capsule["active_bond"] - amount_wei
        capsule["updated_at"] = self._now_iso()
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "withdraw_bond",
            "capsule_id": capsule_id,
            "amount_wei": amount_wei,
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    # --- Endorsement Writes ---

    @gl.public.write
    def endorse_capsule(self, capsule_id: str, note: str, bond_amount_wei: int):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["status"] == "active", "Capsule not active"
        assert int(gl.message.value) >= int(self.MIN_ENDORSEMENT), "Bond below minimum"
        assert int(gl.message.value) >= bond_amount_wei, "Insufficient value"

        endorsement_id = self._gen_id("end", capsule_id)
        now = self._now_iso()
        endorsement = {
            "endorsement_id": endorsement_id,
            "capsule_id": capsule_id,
            "endorser": gl.message.sender_account,
            "note": note,
            "bond_amount_wei": bond_amount_wei,
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "challenge_exposure": False,
            "refund_claimed": False,
        }
        self.endorsements[endorsement_id] = json.dumps(endorsement)

        # Update indexes
        cap_ends = list(self._load_json(self.capsule_endorsements.get(capsule_id, "[]")))
        cap_ends.append(endorsement_id)
        self.capsule_endorsements[capsule_id] = json.dumps(cap_ends)

        end_idx = list(self._load_json(self.endorser_index.get(gl.message.sender_account, "[]")))
        end_idx.append(endorsement_id)
        self.endorser_index[gl.message.sender_account] = json.dumps(end_idx)

        capsule["endorsement_count"] = capsule.get("endorsement_count", 0) + 1
        capsule["updated_at"] = now
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "endorse_capsule",
            "capsule_id": capsule_id,
            "endorsement_id": endorsement_id,
            "amount_wei": bond_amount_wei,
            "timestamp": now,
            "tx_hash": "",
        })

    @gl.public.write
    def withdraw_endorsement(self, endorsement_id: str):
        raw = self.endorsements.get(endorsement_id, "")
        assert raw, "Endorsement not found"
        endorsement = json.loads(raw)
        assert endorsement["endorser"] == gl.message.sender_account, "Not endorser"
        assert endorsement["status"] == "active", "Endorsement not active"

        capsule = self._get_capsule_dict(endorsement["capsule_id"])
        assert capsule["status"] not in ["challenged", "under_review"], "Cannot withdraw while challenged"

        endorsement["status"] = "withdrawn"
        endorsement["updated_at"] = self._now_iso()
        self.endorsements[endorsement_id] = json.dumps(endorsement)

        capsule["endorsement_count"] = max(0, capsule.get("endorsement_count", 1) - 1)
        capsule["updated_at"] = self._now_iso()
        self._save_capsule(endorsement["capsule_id"], capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "withdraw_endorsement",
            "endorsement_id": endorsement_id,
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    @gl.public.write
    def claim_endorsement_refund(self, endorsement_id: str):
        raw = self.endorsements.get(endorsement_id, "")
        assert raw, "Endorsement not found"
        endorsement = json.loads(raw)
        assert endorsement["endorser"] == gl.message.sender_account, "Not endorser"
        assert not endorsement.get("refund_claimed", False), "Refund already claimed"

        capsule = self._get_capsule_dict(endorsement["capsule_id"])
        assert capsule["status"] in ["upheld", "retired", "expired"], "Capsule not in refund-eligible state"

        endorsement["refund_claimed"] = True
        endorsement["status"] = "refunded"
        endorsement["updated_at"] = self._now_iso()
        self.endorsements[endorsement_id] = json.dumps(endorsement)

        self._log_activity(gl.message.sender_account, {
            "type": "claim_endorsement_refund",
            "endorsement_id": endorsement_id,
            "amount_wei": endorsement["bond_amount_wei"],
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    # --- Challenge Writes ---

    @gl.public.write
    def open_challenge(
        self,
        capsule_id: str,
        challenge_type: str,
        summary: str,
        evidence_urls: str,
        bond_amount_wei: int,
    ):
        capsule = self._get_capsule_dict(capsule_id)
        assert capsule["status"] == "active", "Capsule not active"
        assert int(gl.message.value) >= int(self.MIN_CHALLENGE), "Bond below minimum"
        assert int(gl.message.value) >= bond_amount_wei, "Insufficient value"

        valid_types = [
            "factual_inaccuracy", "outdated_claim", "scope_overstated",
            "identity_mismatch", "evidence_fabrication", "material_breach", "other"
        ]
        assert challenge_type in valid_types, f"Invalid challenge_type: {challenge_type}"

        challenge_id = self._gen_id("chall", capsule_id)
        now = self._now_iso()
        challenge = {
            "challenge_id": challenge_id,
            "capsule_id": capsule_id,
            "challenger": gl.message.sender_account,
            "challenge_type": challenge_type,
            "summary": summary,
            "evidence_urls": json.loads(evidence_urls) if evidence_urls else [],
            "bond_amount_wei": bond_amount_wei,
            "status": "open",
            "created_at": now,
            "updated_at": now,
            "verdict_id": "",
            "reward_claimed": False,
        }
        self.challenges[challenge_id] = json.dumps(challenge)

        # Update indexes
        cap_challenages = list(self._load_json(self.capsule_challenges.get(capsule_id, "[]")))
        cap_challenages.append(challenge_id)
        self.capsule_challenges[capsule_id] = json.dumps(cap_challenages)

        chal_idx = list(self._load_json(self.challenger_index.get(gl.message.sender_account, "[]")))
        chal_idx.append(challenge_id)
        self.challenger_index[gl.message.sender_account] = json.dumps(chal_idx)

        capsule["challenge_count"] = capsule.get("challenge_count", 0) + 1
        capsule["status"] = "challenged"
        capsule["updated_at"] = now
        self._save_capsule(capsule_id, capsule)

        self._log_activity(gl.message.sender_account, {
            "type": "open_challenge",
            "capsule_id": capsule_id,
            "challenge_id": challenge_id,
            "amount_wei": bond_amount_wei,
            "timestamp": now,
            "tx_hash": "",
        })

    @gl.public.write
    async def request_challenge_verdict(self, challenge_id: str):
        raw = self.challenges.get(challenge_id, "")
        assert raw, "Challenge not found"
        challenge = json.loads(raw)
        assert challenge["status"] == "open", "Challenge not open"

        capsule = self._get_capsule_dict(challenge["capsule_id"])

        # Previous verdict summary
        prev_verdict_summary = "None"
        if capsule.get("latest_verdict_id"):
            prev_raw = self.verdicts.get(capsule["latest_verdict_id"], "")
            if prev_raw:
                prev_v = json.loads(prev_raw)
                prev_verdict_summary = f"Previous verdict: {prev_v.get('verdict_status', '')} — {prev_v.get('short_reason', '')}"

        evidence_list = "\n".join([f"- {url}" for url in capsule.get("public_evidence_urls", [])])
        challenge_evidence_list = "\n".join([f"- {url}" for url in challenge.get("evidence_urls", [])])

        # Endorsement summary
        cap_ends = list(self._load_json(self.capsule_endorsements.get(challenge["capsule_id"], "[]")))
        endorsement_summary = f"{len(cap_ends)} active endorsers supporting this capsule"

        prompt = f"""You are a GenLayer validator evaluating a reputation bond challenge.

CAPSULE CLAIM:
Title: {capsule["claim_title"]}
Body: {capsule["claim_body"]}
Category: {capsule["category"]}
Scope/Boundaries: {capsule["scope_boundaries"]}

PUBLIC EVIDENCE (submitted by capsule owner):
{evidence_list if evidence_list else "None provided"}

ENDORSEMENT SUMMARY:
{endorsement_summary}

CHALLENGE:
Type: {challenge["challenge_type"]}
Summary: {challenge["summary"]}

CHALLENGE EVIDENCE:
{challenge_evidence_list if challenge_evidence_list else "None provided"}

PRIOR VERDICT:
{prev_verdict_summary}

INSTRUCTIONS:
Carefully evaluate whether the capsule's claim is truthful, well-scoped, and supported by evidence. Evaluate the challenge's evidence against the capsule's claim.

You MUST return ONLY valid JSON matching this exact schema — no prose, no markdown, no explanation outside the JSON:

{{"verdict_status":"<trustworthy|weakly_supported|overstated|contradicted|unverifiable|impersonation_risk|material_breach|invalid_challenge|insufficient_evidence>","action":"<keep_active|downgrade|suspend|slash_partial|slash_full|expire_without_slash|dismiss_challenge>","claim_alignment":"<full|partial|weak|none|contradicted>","evidence_strength":"<high|medium|low|insufficient>","materiality":"<high|medium|low|none>","slash_bps":<integer 0-10000>,"confidence":<integer 0-100>,"short_reason":"<max 200 chars>"}}

Rules:
- verdict_status must be one of: trustworthy, weakly_supported, overstated, contradicted, unverifiable, impersonation_risk, material_breach, invalid_challenge, insufficient_evidence
- action must be one of: keep_active, downgrade, suspend, slash_partial, slash_full, expire_without_slash, dismiss_challenge
- claim_alignment must be one of: full, partial, weak, none, contradicted
- evidence_strength must be one of: high, medium, low, insufficient
- materiality must be one of: high, medium, low, none
- slash_bps: integer 0-10000 (basis points of bond to slash; 0 if no slash)
- confidence: integer 0-100
- short_reason: string, max 200 characters
"""

        result = await gl.exec_prompt(prompt)
        verdict_data = json.loads(result.strip())
        self._validate_verdict_fields(verdict_data)

        verdict_id = self._gen_id("verd", challenge_id)
        now = self._now_iso()
        verdict = {
            "verdict_id": verdict_id,
            "challenge_id": challenge_id,
            "capsule_id": challenge["capsule_id"],
            "verdict_status": verdict_data["verdict_status"],
            "action": verdict_data["action"],
            "claim_alignment": verdict_data["claim_alignment"],
            "evidence_strength": verdict_data["evidence_strength"],
            "materiality": verdict_data["materiality"],
            "slash_bps": int(verdict_data["slash_bps"]),
            "confidence": int(verdict_data["confidence"]),
            "short_reason": verdict_data["short_reason"],
            "created_at": now,
            "resolved": False,
        }
        self.verdicts[verdict_id] = json.dumps(verdict)

        challenge["verdict_id"] = verdict_id
        challenge["status"] = "verdict_pending"
        challenge["updated_at"] = now
        self.challenges[challenge_id] = json.dumps(challenge)

        capsule["latest_verdict_id"] = verdict_id
        capsule["status"] = "under_review"
        capsule["updated_at"] = now
        self._save_capsule(challenge["capsule_id"], capsule)

        self._log_activity(challenge["challenger"], {
            "type": "verdict_requested",
            "challenge_id": challenge_id,
            "verdict_id": verdict_id,
            "timestamp": now,
            "tx_hash": "",
        })

    def _validate_verdict_fields(self, data: dict):
        valid_verdict_statuses = {
            "trustworthy", "weakly_supported", "overstated", "contradicted",
            "unverifiable", "impersonation_risk", "material_breach",
            "invalid_challenge", "insufficient_evidence"
        }
        valid_actions = {
            "keep_active", "downgrade", "suspend", "slash_partial",
            "slash_full", "expire_without_slash", "dismiss_challenge"
        }
        valid_claim_alignments = {"full", "partial", "weak", "none", "contradicted"}
        valid_evidence_strengths = {"high", "medium", "low", "insufficient"}
        valid_materialities = {"high", "medium", "low", "none"}

        assert data.get("verdict_status") in valid_verdict_statuses, f"Invalid verdict_status: {data.get('verdict_status')}"
        assert data.get("action") in valid_actions, f"Invalid action: {data.get('action')}"
        assert data.get("claim_alignment") in valid_claim_alignments, f"Invalid claim_alignment: {data.get('claim_alignment')}"
        assert data.get("evidence_strength") in valid_evidence_strengths, f"Invalid evidence_strength: {data.get('evidence_strength')}"
        assert data.get("materiality") in valid_materialities, f"Invalid materiality: {data.get('materiality')}"
        assert 0 <= int(data.get("slash_bps", -1)) <= 10000, "slash_bps out of range"
        assert 0 <= int(data.get("confidence", -1)) <= 100, "confidence out of range"
        assert len(str(data.get("short_reason", ""))) <= 200, "short_reason too long"

    @gl.public.write
    def resolve_challenge(self, challenge_id: str):
        raw = self.challenges.get(challenge_id, "")
        assert raw, "Challenge not found"
        challenge = json.loads(raw)
        assert challenge["status"] == "verdict_pending", "Challenge not in verdict_pending state"

        verdict_raw = self.verdicts.get(challenge["verdict_id"], "")
        assert verdict_raw, "Verdict not found"
        verdict = json.loads(verdict_raw)

        capsule = self._get_capsule_dict(challenge["capsule_id"])

        action = verdict["action"]
        action_to_status = {
            "keep_active": "upheld",
            "downgrade": "downgraded",
            "suspend": "suspended",
            "slash_partial": "slashed",
            "slash_full": "slashed",
            "expire_without_slash": "expired",
            "dismiss_challenge": "active",
        }
        new_status = action_to_status.get(action, "active")
        capsule["status"] = new_status

        # Apply slash
        slash_bps = int(verdict["slash_bps"])
        if slash_bps > 0 and capsule["active_bond"] > 0:
            slash_amount = (capsule["active_bond"] * slash_bps) // 10000
            capsule["active_bond"] = max(0, capsule["active_bond"] - slash_amount)
            self.protocol_reserve = u256(int(self.protocol_reserve) + slash_amount)

        now = self._now_iso()
        capsule["updated_at"] = now
        self._save_capsule(challenge["capsule_id"], capsule)

        verdict["resolved"] = True
        verdict["resolved_at"] = now
        self.verdicts[challenge["verdict_id"]] = json.dumps(verdict)

        challenge["status"] = "resolved"
        challenge["updated_at"] = now
        self.challenges[challenge_id] = json.dumps(challenge)

        self._log_activity(gl.message.sender_account, {
            "type": "resolve_challenge",
            "challenge_id": challenge_id,
            "capsule_id": challenge["capsule_id"],
            "action": action,
            "timestamp": now,
            "tx_hash": "",
        })

    @gl.public.write
    def claim_challenge_reward(self, challenge_id: str):
        raw = self.challenges.get(challenge_id, "")
        assert raw, "Challenge not found"
        challenge = json.loads(raw)
        assert challenge["challenger"] == gl.message.sender_account, "Not challenger"
        assert challenge["status"] == "resolved", "Challenge not resolved"
        assert not challenge.get("reward_claimed", False), "Reward already claimed"

        verdict_raw = self.verdicts.get(challenge.get("verdict_id", ""), "")
        assert verdict_raw, "Verdict not found"
        verdict = json.loads(verdict_raw)
        assert verdict["action"] in ["downgrade", "suspend", "slash_partial", "slash_full"], "Challenge was not upheld"

        challenge["reward_claimed"] = True
        challenge["updated_at"] = self._now_iso()
        self.challenges[challenge_id] = json.dumps(challenge)

        self._log_activity(gl.message.sender_account, {
            "type": "claim_challenge_reward",
            "challenge_id": challenge_id,
            "amount_wei": challenge["bond_amount_wei"],
            "timestamp": self._now_iso(),
            "tx_hash": "",
        })

    # --- Read Views ---

    @gl.public.view
    def get_capsule(self, capsule_id: str) -> str:
        raw = self.capsules.get(capsule_id, "")
        if not raw:
            return json.dumps({"error": "not_found"})
        capsule = json.loads(raw)
        # Remove private field from public view
        public_capsule = {k: v for k, v in capsule.items() if k != "private_evidence_commitment_hash"}
        return json.dumps(public_capsule)

    @gl.public.view
    def get_capsule_owner_view(self, capsule_id: str) -> str:
        raw = self.capsules.get(capsule_id, "")
        if not raw:
            return json.dumps({"error": "not_found"})
        capsule = json.loads(raw)
        assert capsule["owner"] == gl.message.sender_account, "Not capsule owner"
        return raw

    @gl.public.view
    def get_public_capsules(self, offset: int, limit: int) -> str:
        pub_ids = list(self._load_json(self.public_capsule_ids))
        sliced = pub_ids[offset: offset + limit]
        result = []
        for cid in sliced:
            raw = self.capsules.get(cid, "")
            if raw:
                cap = json.loads(raw)
                result.append({
                    "capsule_id": cap["capsule_id"],
                    "claim_title": cap["claim_title"],
                    "category": cap["category"],
                    "status": cap["status"],
                    "bond_tier": cap["bond_tier"],
                    "active_bond": cap["active_bond"],
                    "endorsement_count": cap["endorsement_count"],
                    "challenge_count": cap["challenge_count"],
                    "expires_at": cap["expires_at"],
                    "created_at": cap["created_at"],
                    "latest_verdict_id": cap.get("latest_verdict_id", ""),
                    "owner": cap["owner"],
                })
        return json.dumps({"items": result, "total": len(pub_ids), "offset": offset, "limit": limit})

    @gl.public.view
    def get_capsules_by_owner(self, address: str) -> str:
        ids = list(self._load_json(self.owner_capsules.get(address, "[]")))
        capsules = []
        for cid in ids:
            raw = self.capsules.get(cid, "")
            if raw:
                cap = json.loads(raw)
                if cap["owner"] == address:
                    if address == gl.message.sender_account:
                        capsules.append(cap)
                    else:
                        pub = {k: v for k, v in cap.items() if k != "private_evidence_commitment_hash"}
                        capsules.append(pub)
        return json.dumps(capsules)

    @gl.public.view
    def get_capsule_challenges(self, capsule_id: str) -> str:
        ids = list(self._load_json(self.capsule_challenges.get(capsule_id, "[]")))
        result = []
        for cid in ids:
            raw = self.challenges.get(cid, "")
            if raw:
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_capsule_endorsements(self, capsule_id: str) -> str:
        ids = list(self._load_json(self.capsule_endorsements.get(capsule_id, "[]")))
        result = []
        for eid in ids:
            raw = self.endorsements.get(eid, "")
            if raw:
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_verdict(self, verdict_id: str) -> str:
        raw = self.verdicts.get(verdict_id, "")
        if not raw:
            return json.dumps({"error": "not_found"})
        return raw

    @gl.public.view
    def get_endorser_dashboard(self, address: str) -> str:
        ids = list(self._load_json(self.endorser_index.get(address, "[]")))
        endorsements = []
        total_locked = 0
        for eid in ids:
            raw = self.endorsements.get(eid, "")
            if raw:
                e = json.loads(raw)
                if e["endorser"] == address and e["status"] == "active":
                    total_locked += e["bond_amount_wei"]
                    cap_raw = self.capsules.get(e["capsule_id"], "")
                    if cap_raw:
                        cap = json.loads(cap_raw)
                        e["capsule_status"] = cap["status"]
                        e["capsule_title"] = cap["claim_title"]
                        e["challenge_exposure"] = cap["status"] in ["challenged", "under_review"]
                endorsements.append(e)
        return json.dumps({"endorsements": endorsements, "total_locked_wei": total_locked})

    @gl.public.view
    def get_challenger_dashboard(self, address: str) -> str:
        ids = list(self._load_json(self.challenger_index.get(address, "[]")))
        challenges = []
        for cid in ids:
            raw = self.challenges.get(cid, "")
            if raw:
                c = json.loads(raw)
                if c["challenger"] == address:
                    if c.get("verdict_id"):
                        v_raw = self.verdicts.get(c["verdict_id"], "")
                        if v_raw:
                            c["verdict"] = json.loads(v_raw)
                    challenges.append(c)
        return json.dumps({"challenges": challenges})

    @gl.public.view
    def get_wallet_activity(self, address: str, limit: int) -> str:
        activities = list(self._load_json(self.wallet_activity.get(address, "[]")))
        return json.dumps(activities[:limit])

    @gl.public.view
    def get_admin_monitor_stats(self) -> str:
        pub_ids = list(self._load_json(self.public_capsule_ids))
        total_capsules = len(pub_ids)
        active_capsules = 0
        total_bonded_wei = 0
        total_challenge_bonds_wei = 0
        active_disputes = 0
        pending_verdicts = 0
        stuck_withdrawals = 0

        for cid in pub_ids:
            raw = self.capsules.get(cid, "")
            if raw:
                cap = json.loads(raw)
                if cap["status"] in ["active", "upheld"]:
                    active_capsules += 1
                total_bonded_wei += cap.get("active_bond", 0)
                if cap["status"] in ["challenged", "under_review"]:
                    active_disputes += 1
                if cap["status"] in ["retired", "expired", "slashed"] and cap.get("active_bond", 0) > 0:
                    stuck_withdrawals += 1

        chall_count = 0
        # Sum challenge bonds from known challenges (iterate via public capsules)
        for cid in pub_ids:
            ids = list(self._load_json(self.capsule_challenges.get(cid, "[]")))
            for chid in ids:
                raw = self.challenges.get(chid, "")
                if raw:
                    c = json.loads(raw)
                    if c["status"] not in ["resolved"]:
                        total_challenge_bonds_wei += c.get("bond_amount_wei", 0)
                    if c["status"] == "verdict_pending":
                        pending_verdicts += 1

        return json.dumps({
            "total_capsules": total_capsules,
            "active_capsules": active_capsules,
            "total_bonded_wei": total_bonded_wei,
            "total_challenge_bonds_wei": total_challenge_bonds_wei,
            "active_disputes": active_disputes,
            "pending_verdicts": pending_verdicts,
            "stuck_withdrawals": stuck_withdrawals,
            "protocol_reserve_wei": int(self.protocol_reserve),
            "contract_version": self.CONTRACT_VERSION,
            "owner": gl.message.sender_account,
        })
