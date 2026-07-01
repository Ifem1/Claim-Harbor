# v0.2.20
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing


class ClaimHarbor(gl.Contract):
    """
    ClaimHarbor â€” GEN-backed cover purchase and claim settlement.

    Underwriters create liquidity pools. Policyholders buy cover and submit
    claims with evidence URLs. GenLayer validators independently fetch and
    judge evidence via consensus, producing an on-chain verdict and GEN payout.
    """

    owner: Address
    paused: bool

    pool_counter: u256
    policy_counter: u256
    claim_counter: u256

    # All values stored as JSON strings
    pools: TreeMap[str, str]
    pool_index: TreeMap[str, str]

    policies: TreeMap[str, str]
    owner_policy_index: TreeMap[str, str]

    claims: TreeMap[str, str]
    owner_claim_index: TreeMap[str, str]
    pool_claim_index: TreeMap[str, str]

    public_proofs: TreeMap[str, str]

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        self.paused = False

        self.pool_counter = u256(0)
        self.policy_counter = u256(0)
        self.claim_counter = u256(0)

        self.pools = TreeMap()
        self.pool_index = TreeMap()

        self.policies = TreeMap()
        self.owner_policy_index = TreeMap()

        self.claims = TreeMap()
        self.owner_claim_index = TreeMap()
        self.pool_claim_index = TreeMap()

        self.public_proofs = TreeMap()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _sender(self) -> str:
        return gl.message.sender_address.as_hex.lower()

    def _owner(self) -> str:
        return self.owner.as_hex.lower()

    def _json(self, value: typing.Any) -> str:
        return json.dumps(value, sort_keys=True)

    def _load(self, raw: str) -> typing.Any:
        if not raw:
            return {}
        return json.loads(raw)

    def _require_owner(self) -> None:
        if self._sender() != self._owner():
            raise gl.vm.UserError("Only contract owner")

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.vm.UserError("Contract is paused")

    def _require_non_empty(self, value: str, field: str) -> None:
        if not value or not value.strip():
            raise gl.vm.UserError(field + " is required")

    def _append(self, existing: str, item: str) -> str:
        if not existing:
            return item
        return existing + "|" + item

    def _to_int(self, value: typing.Any, fallback: int) -> int:
        try:
            return int(value)
        except Exception:
            return fallback

    def _bounded_bps(self, value: typing.Any) -> int:
        v = self._to_int(value, 0)
        return max(0, min(10000, v))

    def _bounded_score(self, value: typing.Any) -> int:
        v = self._to_int(value, 0)
        return max(0, min(100, v))

    def _next_pool_id(self) -> str:
        self.pool_counter = self.pool_counter + u256(1)
        return "pool-" + str(self.pool_counter)

    def _next_policy_id(self) -> str:
        self.policy_counter = self.policy_counter + u256(1)
        return "policy-" + str(self.policy_counter)

    def _next_claim_id(self) -> str:
        self.claim_counter = self.claim_counter + u256(1)
        return "claim-" + str(self.claim_counter)

    def _require_pool(self, pool_id: str) -> typing.Any:
        raw = self.pools.get(pool_id, "")
        if not raw:
            raise gl.vm.UserError("Pool not found")
        return self._load(raw)

    def _require_policy(self, policy_id: str) -> typing.Any:
        raw = self.policies.get(policy_id, "")
        if not raw:
            raise gl.vm.UserError("Policy not found")
        return self._load(raw)

    def _require_claim(self, claim_id: str) -> typing.Any:
        raw = self.claims.get(claim_id, "")
        if not raw:
            raise gl.vm.UserError("Claim not found")
        return self._load(raw)

    def _normalise_verdict(self, value: typing.Any) -> str:
        valid = {
            "approved_full",
            "approved_partial",
            "rejected_not_covered",
            "rejected_exclusion_applies",
            "rejected_late_claim",
            "rejected_insufficient_evidence",
            "rejected_fraud_risk",
            "manual_review_required",
            "invalid_policy",
        }
        v = str(value).strip().lower()
        return v if v in valid else "manual_review_required"

    def _run_claim_consensus(
        self,
        claim_record: typing.Any,
        policy_record: typing.Any,
        pool_record: typing.Any,
    ) -> typing.Any:
        evidence_urls: typing.List[str] = claim_record.get("evidence_urls", [])
        primary_url: str = evidence_urls[0] if evidence_urls else ""

        context = self._json(
            {
                "pool_name": pool_record.get("name", ""),
                "pool_category": pool_record.get("category", ""),
                "terms_summary": pool_record.get("terms_summary", ""),
                "exclusions_summary": pool_record.get("exclusions_summary", ""),
                "max_cover_per_policy": pool_record.get("max_cover_per_policy", "0"),
                "policy_start": policy_record.get("start_time", ""),
                "policy_end": policy_record.get("end_time", ""),
                "claim_deadline": policy_record.get("claim_deadline", ""),
                "cover_limit": policy_record.get("cover_limit", "0"),
                "incident_summary": claim_record.get("incident_summary", ""),
                "evidence_notes": claim_record.get("evidence_notes", ""),
                "requested_payout": claim_record.get("requested_payout", "0"),
                "submitted_at": claim_record.get("submitted_at", ""),
                "evidence_urls": evidence_urls,
            }
        )

        verdict_task = (
            "You are an expert insurance claim validator for Claim Harbor, a GEN-backed on-chain cover protocol. "
            "Review the claim context and evidence page content below. "
            "Return ONLY valid JSON with no markdown and no explanation outside the JSON.\n\n"
            "Return exactly this structure:\n"
            '{"verdict":"approved_full","payout_bps":10000,"confidence":80,'
            '"covered_event":true,"exclusion_applies":false,'
            '"short_reason":"One sentence max 200 chars."}\n\n'
            "verdict options:\n"
            "  approved_full              â€” fully covered event, payout_bps=10000\n"
            "  approved_partial           â€” partially covered, payout_bps=1-9999\n"
            "  rejected_not_covered       â€” event not within policy scope, payout_bps=0\n"
            "  rejected_exclusion_applies â€” an explicit exclusion applies, payout_bps=0\n"
            "  rejected_late_claim        â€” claim filed after deadline, payout_bps=0\n"
            "  rejected_insufficient_evidence â€” evidence does not support the claim, payout_bps=0\n"
            "  rejected_fraud_risk        â€” evidence appears fabricated, payout_bps=0\n"
            "  manual_review_required     â€” genuinely ambiguous, payout_bps=0\n"
            "  invalid_policy             â€” policy terms cannot be established, payout_bps=0\n\n"
            "payout_bps is an integer 0-10000 representing the fraction of requested_payout to pay out.\n"
            "confidence is an integer 0-100.\n\n"
            "CLAIM CONTEXT:\n" + context
        )

        def get_verdict() -> str:
            evidence_content = ""
            if primary_url:
                evidence_content = str(gl.nondet.web.get(primary_url))
            prompt = verdict_task + "\n\nEVIDENCE PAGE CONTENT:\n" + evidence_content
            result = gl.nondet.exec_prompt(prompt)
            return result.replace("```json", "").replace("```", "").strip()

        verdict_criteria = (
            "The verdict must be exactly one of the nine defined labels.\n"
            "approved_full is only valid if the evidence clearly demonstrates a covered event with no exclusions.\n"
            "approved_partial is only valid if the evidence supports a covered event but loss is less than full amount.\n"
            "payout_bps must be 0 for all rejected and manual_review verdicts.\n"
            "The verdict must be reasonable given the policy terms, exclusions, and evidence provided.\n"
            "The response must be valid JSON."
        )

        verdict_json = gl.eq_principle.prompt_comparative(get_verdict, verdict_criteria)

        parsed = json.loads(
            verdict_json.replace("```json", "").replace("```", "").strip()
        )

        return {
            "verdict": self._normalise_verdict(parsed.get("verdict", "manual_review_required")),
            "payout_bps": self._bounded_bps(parsed.get("payout_bps", 0)),
            "confidence": self._bounded_score(parsed.get("confidence", 0)),
            "covered_event": bool(parsed.get("covered_event", False)),
            "exclusion_applies": bool(parsed.get("exclusion_applies", False)),
            "short_reason": str(parsed.get("short_reason", ""))[:300],
        }

    # ------------------------------------------------------------------
    # Owner and contract status
    # ------------------------------------------------------------------

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.view
    def get_contract_summary(self) -> str:
        return self._json(
            {
                "owner": self.owner.as_hex,
                "paused": self.paused,
                "pool_counter": str(self.pool_counter),
                "policy_counter": str(self.policy_counter),
                "claim_counter": str(self.claim_counter),
            }
        )

    @gl.public.write
    def transfer_ownership(self, new_owner: str) -> None:
        self._require_owner()
        self._require_non_empty(new_owner, "new_owner")
        self.owner = Address(new_owner)

    @gl.public.write
    def pause(self) -> None:
        self._require_owner()
        self.paused = True

    @gl.public.write
    def unpause(self) -> None:
        self._require_owner()
        self.paused = False

    # ------------------------------------------------------------------
    # Pool management
    # ------------------------------------------------------------------

    @gl.public.write.payable
    def create_pool(
        self,
        name: str,
        category: str,
        terms_summary: str,
        exclusions_summary: str,
        terms_hash: str,
        max_cover_per_policy: u256,
        min_premium_bps: u256,
        claim_window_days: u256,
        created_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(name, "name")
        self._require_non_empty(terms_summary, "terms_summary")
        self._require_non_empty(created_at, "created_at")

        if gl.message.value == u256(0):
            raise gl.vm.UserError("Pool requires GEN liquidity to activate")
        if int(min_premium_bps) > 10000:
            raise gl.vm.UserError("min_premium_bps cannot exceed 10000")
        if int(claim_window_days) == 0:
            raise gl.vm.UserError("claim_window_days must be at least 1")

        pool_id = self._next_pool_id()
        liq = str(int(gl.message.value))

        record = {
            "id": pool_id,
            "owner": self._sender(),
            "name": name[:200],
            "category": category[:80],
            "terms_summary": terms_summary[:2000],
            "exclusions_summary": exclusions_summary[:2000],
            "terms_hash": terms_hash,
            "liquidity_total": liq,
            "liquidity_available": liq,
            "liquidity_reserved": "0",
            "premium_collected": "0",
            "max_cover_per_policy": str(int(max_cover_per_policy)),
            "min_premium_bps": str(int(min_premium_bps)),
            "claim_window_days": str(int(claim_window_days)),
            "active": True,
            "created_at": created_at,
        }

        self.pools[pool_id] = self._json(record)
        self.pool_index["all"] = self._append(self.pool_index.get("all", ""), pool_id)

        return pool_id

    @gl.public.write.payable
    def add_pool_liquidity(self, pool_id: str) -> None:
        self._require_not_paused()
        pool = self._require_pool(pool_id)

        if pool.get("owner", "") != self._sender():
            raise gl.vm.UserError("Only pool owner can add liquidity")
        if gl.message.value == u256(0):
            raise gl.vm.UserError("Must send GEN to add liquidity")

        added = int(gl.message.value)
        pool["liquidity_total"] = str(self._to_int(pool["liquidity_total"], 0) + added)
        pool["liquidity_available"] = str(self._to_int(pool["liquidity_available"], 0) + added)
        self.pools[pool_id] = self._json(pool)

    @gl.public.write
    def set_pool_active(self, pool_id: str, active: bool) -> None:
        self._require_not_paused()
        pool = self._require_pool(pool_id)

        is_owner = pool.get("owner", "") == self._sender()
        is_admin = self._sender() == self._owner()
        if not is_owner and not is_admin:
            raise gl.vm.UserError("Only pool owner or contract owner")
        if active and self._to_int(pool.get("liquidity_available", "0"), 0) == 0:
            raise gl.vm.UserError("Cannot activate pool with zero available liquidity")

        pool["active"] = active
        self.pools[pool_id] = self._json(pool)

    # ------------------------------------------------------------------
    # Cover purchase
    # ------------------------------------------------------------------

    @gl.public.write.payable
    def buy_cover(
        self,
        pool_id: str,
        cover_limit: u256,
        duration_days: u256,
        claimant_terms_ack: bool,
        start_time: str,
        end_time: str,
        claim_deadline: str,
        purchased_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(start_time, "start_time")
        self._require_non_empty(end_time, "end_time")
        self._require_non_empty(claim_deadline, "claim_deadline")

        if not claimant_terms_ack:
            raise gl.vm.UserError("Must acknowledge policy terms")

        pool = self._require_pool(pool_id)
        if not pool.get("active", False):
            raise gl.vm.UserError("Pool is not active")

        max_cover = self._to_int(pool.get("max_cover_per_policy", "0"), 0)
        avail = self._to_int(pool.get("liquidity_available", "0"), 0)
        min_bps = self._to_int(pool.get("min_premium_bps", "0"), 0)

        if int(cover_limit) > max_cover:
            raise gl.vm.UserError("Cover limit exceeds pool maximum")
        if int(cover_limit) > avail:
            raise gl.vm.UserError("Insufficient pool capacity")
        if int(duration_days) == 0 or int(duration_days) > 365:
            raise gl.vm.UserError("Duration must be 1-365 days")

        min_premium = (int(cover_limit) * min_bps) // 10000
        if int(gl.message.value) < min_premium:
            raise gl.vm.UserError("Insufficient premium paid")

        policy_id = self._next_policy_id()

        record = {
            "id": policy_id,
            "pool_id": pool_id,
            "buyer": self._sender(),
            "premium_paid": str(int(gl.message.value)),
            "cover_limit": str(int(cover_limit)),
            "duration_days": str(int(duration_days)),
            "start_time": start_time,
            "end_time": end_time,
            "claim_deadline": claim_deadline,
            "terms_hash": pool.get("terms_hash", ""),
            "terms_summary": pool.get("terms_summary", ""),
            "status": "active",
            "purchased_at": purchased_at,
        }

        self.policies[policy_id] = self._json(record)
        self.owner_policy_index[self._sender()] = self._append(
            self.owner_policy_index.get(self._sender(), ""),
            policy_id,
        )

        pool["liquidity_available"] = str(avail - int(cover_limit))
        pool["liquidity_reserved"] = str(self._to_int(pool.get("liquidity_reserved", "0"), 0) + int(cover_limit))
        pool["premium_collected"] = str(self._to_int(pool.get("premium_collected", "0"), 0) + int(gl.message.value))
        self.pools[pool_id] = self._json(pool)

        return policy_id

    # ------------------------------------------------------------------
    # Claim submission
    # ------------------------------------------------------------------

    @gl.public.write
    def submit_claim(
        self,
        policy_id: str,
        requested_payout: u256,
        incident_summary: str,
        evidence_urls_csv: str,
        evidence_notes: str,
        submitted_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(incident_summary, "incident_summary")
        self._require_non_empty(evidence_urls_csv, "evidence_urls_csv")
        self._require_non_empty(submitted_at, "submitted_at")

        policy = self._require_policy(policy_id)

        if policy.get("buyer", "") != self._sender():
            raise gl.vm.UserError("Only policy holder can submit claim")
        if policy.get("status", "") != "active":
            raise gl.vm.UserError("Policy is not active")
        if int(requested_payout) > self._to_int(policy.get("cover_limit", "0"), 0):
            raise gl.vm.UserError("Requested payout exceeds cover limit")

        urls: typing.List[str] = [u.strip() for u in evidence_urls_csv.split(",") if u.strip()]
        if not urls:
            raise gl.vm.UserError("At least one evidence URL is required")

        claim_id = self._next_claim_id()
        pool_id = policy.get("pool_id", "")

        record = {
            "id": claim_id,
            "policy_id": policy_id,
            "pool_id": pool_id,
            "claimant": self._sender(),
            "requested_payout": str(int(requested_payout)),
            "incident_summary": incident_summary[:1000],
            "evidence_notes": evidence_notes[:800],
            "evidence_urls": urls,
            "submitted_at": submitted_at,
            "verdict": None,
            "payout_amount": "0",
            "payout_claimed": False,
            "public_proof_enabled": False,
            "status": "submitted",
        }

        self.claims[claim_id] = self._json(record)
        self.owner_claim_index[self._sender()] = self._append(
            self.owner_claim_index.get(self._sender(), ""),
            claim_id,
        )
        self.pool_claim_index[pool_id] = self._append(
            self.pool_claim_index.get(pool_id, ""),
            claim_id,
        )

        policy["status"] = "claimed"
        self.policies[policy_id] = self._json(policy)

        return claim_id

    # ------------------------------------------------------------------
    # Claim verdict â€” GenLayer consensus (non-deterministic)
    # ------------------------------------------------------------------

    @gl.public.write
    def request_claim_verdict(self, claim_id: str) -> str:
        self._require_not_paused()

        claim = self._require_claim(claim_id)
        if claim.get("status", "") != "submitted":
            raise gl.vm.UserError("Claim is not in submitted state")

        policy = self._require_policy(claim.get("policy_id", ""))
        pool = self._require_pool(claim.get("pool_id", ""))

        review = self._run_claim_consensus(claim, policy, pool)

        verdict_label = review["verdict"]
        payout_bps = review["payout_bps"]
        requested = self._to_int(claim.get("requested_payout", "0"), 0)
        cover_limit = self._to_int(policy.get("cover_limit", "0"), 0)

        if verdict_label == "approved_full":
            payout_amount = requested
        elif verdict_label == "approved_partial":
            payout_amount = (requested * payout_bps) // 10000
        else:
            payout_amount = 0

        payout_amount = min(payout_amount, cover_limit)

        claim["verdict"] = review
        claim["payout_amount"] = str(payout_amount)

        approved_labels = {"approved_full", "approved_partial"}
        rejected_labels = {
            "rejected_not_covered",
            "rejected_exclusion_applies",
            "rejected_late_claim",
            "rejected_insufficient_evidence",
            "rejected_fraud_risk",
            "invalid_policy",
        }

        if verdict_label in approved_labels:
            claim["status"] = "payout_open"
        elif verdict_label in rejected_labels:
            claim["status"] = "rejected"
            pool_id = claim.get("pool_id", "")
            pool_rec = self._load(self.pools.get(pool_id, ""))
            reserved = self._to_int(pool_rec.get("liquidity_reserved", "0"), 0)
            avail = self._to_int(pool_rec.get("liquidity_available", "0"), 0)
            release = min(cover_limit, reserved)
            pool_rec["liquidity_reserved"] = str(reserved - release)
            pool_rec["liquidity_available"] = str(avail + release)
            self.pools[pool_id] = self._json(pool_rec)
        else:
            claim["status"] = "manual_review"

        self.claims[claim_id] = self._json(claim)
        return self._json(review)

    # ------------------------------------------------------------------
    # Claim payout
    # ------------------------------------------------------------------

    @gl.public.write
    def claim_payout(self, claim_id: str) -> None:
        self._require_not_paused()

        claim = self._require_claim(claim_id)
        if claim.get("claimant", "") != self._sender():
            raise gl.vm.UserError("Only claimant can collect payout")
        if claim.get("status", "") != "payout_open":
            raise gl.vm.UserError("Payout is not open")
        if claim.get("payout_claimed", False):
            raise gl.vm.UserError("Payout already collected")

        payout = self._to_int(claim.get("payout_amount", "0"), 0)
        if payout == 0:
            raise gl.vm.UserError("No payout available")

        policy = self._require_policy(claim.get("policy_id", ""))
        pool_id = claim.get("pool_id", "")
        pool = self._load(self.pools.get(pool_id, ""))

        cover_limit = self._to_int(policy.get("cover_limit", "0"), 0)
        reserved = self._to_int(pool.get("liquidity_reserved", "0"), 0)
        avail = self._to_int(pool.get("liquidity_available", "0"), 0)
        total = self._to_int(pool.get("liquidity_total", "0"), 0)

        release = min(cover_limit, reserved)
        excess = release - payout
        pool["liquidity_reserved"] = str(reserved - release)
        pool["liquidity_available"] = str(avail + (excess if excess > 0 else 0))
        pool["liquidity_total"] = str(total - payout)
        self.pools[pool_id] = self._json(pool)

        claim["payout_claimed"] = True
        claim["status"] = "paid"
        self.claims[claim_id] = self._json(claim)

        gl.message.sender_address.transfer(u256(payout))

    # ------------------------------------------------------------------
    # Underwriter withdrawal
    # ------------------------------------------------------------------

    @gl.public.write
    def withdraw_unlocked_liquidity(self, pool_id: str, amount: u256, withdrawn_at: str) -> None:
        self._require_not_paused()
        pool = self._require_pool(pool_id)

        if pool.get("owner", "") != self._sender():
            raise gl.vm.UserError("Only pool owner can withdraw")
        if int(amount) == 0:
            raise gl.vm.UserError("Amount must be greater than zero")

        avail = self._to_int(pool.get("liquidity_available", "0"), 0)
        if int(amount) > avail:
            raise gl.vm.UserError("Cannot withdraw more than available liquidity")

        pool["liquidity_available"] = str(avail - int(amount))
        pool["liquidity_total"] = str(self._to_int(pool.get("liquidity_total", "0"), 0) - int(amount))
        pool["last_withdrawal_at"] = withdrawn_at
        self.pools[pool_id] = self._json(pool)

        gl.message.sender_address.transfer(amount)

    # ------------------------------------------------------------------
    # Public proof
    # ------------------------------------------------------------------

    @gl.public.write
    def publish_claim_proof(self, claim_id: str) -> None:
        self._require_not_paused()

        claim = self._require_claim(claim_id)
        if claim.get("claimant", "") != self._sender():
            raise gl.vm.UserError("Only claimant can publish proof")
        if claim.get("verdict") is None:
            raise gl.vm.UserError("No verdict to publish")

        policy = self._require_policy(claim.get("policy_id", ""))
        pool = self._require_pool(claim.get("pool_id", ""))

        verdict_data = claim.get("verdict", {})
        verdict_label = verdict_data.get("verdict", "") if isinstance(verdict_data, dict) else ""

        proof = {
            "claim_id": claim_id,
            "verdict": verdict_label,
            "payout_amount": claim.get("payout_amount", "0"),
            "payout_claimed": claim.get("payout_claimed", False),
            "pool_name": pool.get("name", ""),
            "policy_terms_summary": policy.get("terms_summary", ""),
        }

        self.public_proofs[claim_id] = self._json(proof)
        claim["public_proof_enabled"] = True
        self.claims[claim_id] = self._json(claim)

    # ------------------------------------------------------------------
    # Admin: manual verdict override
    # ------------------------------------------------------------------

    @gl.public.write
    def admin_set_claim_verdict(
        self,
        claim_id: str,
        verdict: str,
        payout_bps: u256,
        short_reason: str,
        decided_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_owner()

        claim = self._require_claim(claim_id)
        if claim.get("status", "") not in ["manual_review", "submitted"]:
            raise gl.vm.UserError("Claim is not eligible for admin override")

        policy = self._require_policy(claim.get("policy_id", ""))
        pool_id = claim.get("pool_id", "")

        verdict_label = self._normalise_verdict(verdict)
        bps = self._bounded_bps(int(payout_bps))
        requested = self._to_int(claim.get("requested_payout", "0"), 0)
        cover_limit = self._to_int(policy.get("cover_limit", "0"), 0)

        if verdict_label == "approved_full":
            payout_amount = requested
        elif verdict_label == "approved_partial":
            payout_amount = (requested * bps) // 10000
        else:
            payout_amount = 0

        payout_amount = min(payout_amount, cover_limit)

        review = {
            "verdict": verdict_label,
            "payout_bps": bps,
            "confidence": 100,
            "covered_event": verdict_label.startswith("approved"),
            "exclusion_applies": verdict_label == "rejected_exclusion_applies",
            "short_reason": short_reason[:300],
            "decided_by": "admin",
            "decided_at": decided_at,
        }

        claim["verdict"] = review
        claim["payout_amount"] = str(payout_amount)

        approved_labels = {"approved_full", "approved_partial"}
        rejected_labels = {
            "rejected_not_covered",
            "rejected_exclusion_applies",
            "rejected_late_claim",
            "rejected_insufficient_evidence",
            "rejected_fraud_risk",
            "invalid_policy",
        }

        if verdict_label in approved_labels:
            claim["status"] = "payout_open"
        elif verdict_label in rejected_labels:
            claim["status"] = "rejected"
            pool_rec = self._load(self.pools.get(pool_id, ""))
            reserved = self._to_int(pool_rec.get("liquidity_reserved", "0"), 0)
            avail = self._to_int(pool_rec.get("liquidity_available", "0"), 0)
            release = min(cover_limit, reserved)
            pool_rec["liquidity_reserved"] = str(reserved - release)
            pool_rec["liquidity_available"] = str(avail + release)
            self.pools[pool_id] = self._json(pool_rec)
        else:
            claim["status"] = "manual_review"

        self.claims[claim_id] = self._json(claim)

    # ------------------------------------------------------------------
    # Read methods
    # ------------------------------------------------------------------

    @gl.public.view
    def get_pool(self, pool_id: str) -> str:
        return self.pools.get(pool_id, "")

    @gl.public.view
    def get_all_pool_ids(self) -> str:
        return self.pool_index.get("all", "")

    @gl.public.view
    def get_policy(self, policy_id: str) -> str:
        raw = self.policies.get(policy_id, "")
        if not raw:
            raise gl.vm.UserError("Policy not found")
        return raw

    @gl.public.view
    def get_claim(self, claim_id: str) -> str:
        raw = self.claims.get(claim_id, "")
        if not raw:
            raise gl.vm.UserError("Claim not found")
        return raw

    @gl.public.view
    def get_my_policy_ids(self) -> str:
        return self.owner_policy_index.get(self._sender(), "")

    @gl.public.view
    def get_my_claim_ids(self) -> str:
        return self.owner_claim_index.get(self._sender(), "")

    @gl.public.view
    def get_pool_claim_ids(self, pool_id: str) -> str:
        self._require_pool(pool_id)
        return self.pool_claim_index.get(pool_id, "")

    @gl.public.view
    def get_policy_ids_for(self, owner: str) -> str:
        return self.owner_policy_index.get(owner.lower(), "")

    @gl.public.view
    def get_claim_ids_for(self, owner: str) -> str:
        return self.owner_claim_index.get(owner.lower(), "")

    @gl.public.view
    def get_public_proof(self, claim_id: str) -> str:
        raw = self.public_proofs.get(claim_id, "")
        if not raw:
            raise gl.vm.UserError("No public proof published for this claim")
        return raw

    @gl.public.view
    def get_pool_accounting(self, pool_id: str) -> str:
        pool = self._require_pool(pool_id)
        return self._json(
            {
                "pool_id": pool_id,
                "liquidity_total": pool.get("liquidity_total", "0"),
                "liquidity_available": pool.get("liquidity_available", "0"),
                "liquidity_reserved": pool.get("liquidity_reserved", "0"),
                "premium_collected": pool.get("premium_collected", "0"),
            }
        )
