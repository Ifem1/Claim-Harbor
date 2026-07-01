# CiteEvidenceCourt — GenLayer Intelligent Contract
# v1.0.0
#
# Cite is a decentralized evidence court.
# Users create public claims, submit public sources, and GenLayer validators
# reach on-chain consensus on whether those sources actually prove the claim.
#
# Core primitive:
#   claim + source + evidence_standard → on-chain verdict
#
# What belongs on-chain:
#   - claim registry
#   - evidence registry
#   - review/verdict registry
#   - challenge log
#   - audit trail
#   - approved/rejected evidence hashes
#
# What should stay off-chain:
#   - full source documents, PDFs, images
#   - private research notes
#   - analytics and aggregation

from genlayer import *

import json
import typing


class CiteEvidenceCourt(gl.Contract):
    """
    CiteEvidenceCourt

    A GenLayer-native on-chain evidence court.

    Anyone can create a claim, anyone can submit public sources as evidence,
    and any user can request GenLayer consensus review. Validators independently
    judge whether each submitted source actually proves the exact claim — not
    just whether it mentions related topics or is from a related project.

    Claim statuses: open | under_review | reviewed | closed
    Verdicts: proven | mostly_supported | weakly_supported | contradicted |
              unsupported | stale_evidence | wrong_scope | source_unreachable |
              insufficient_evidence | mixed | needs_more_sources
    """

    # ------------------------------------------------------------------
    # Contract metadata
    # ------------------------------------------------------------------

    owner: str
    paused: bool

    # ------------------------------------------------------------------
    # Counters
    # ------------------------------------------------------------------

    claim_counter: u256
    evidence_counter: u256
    review_counter: u256
    challenge_counter: u256
    audit_counter: u256

    # ------------------------------------------------------------------
    # Primary registries  (id -> JSON string)
    # ------------------------------------------------------------------

    claims: TreeMap[str, str]
    evidence_items: TreeMap[str, str]
    reviews: TreeMap[str, str]
    challenges: TreeMap[str, str]
    audit_logs: TreeMap[str, str]

    # ------------------------------------------------------------------
    # Index maps  (composite key -> pipe-separated id list or single id)
    # ------------------------------------------------------------------

    claim_evidence_index: TreeMap[str, str]   # claim_id  -> "eid0|eid1|..."
    claim_review_index: TreeMap[str, str]      # claim_id  -> "rid0|rid1|..."
    claim_challenge_index: TreeMap[str, str]   # claim_id  -> "cid0|cid1|..."
    evidence_challenge_index: TreeMap[str, str]# evidence_id -> "cid0|..."
    claim_audit_index: TreeMap[str, str]       # claim_id  -> "aid0|aid1|..."
    creator_claim_index: TreeMap[str, str]     # wallet    -> "clm0|clm1|..."
    submitter_evidence_index: TreeMap[str, str]# wallet    -> "eid0|eid1|..."

    # ------------------------------------------------------------------
    # Hash-level registries for deduplication and blocking
    # ------------------------------------------------------------------

    source_url_claim_index: TreeMap[str, str]  # url_hash  -> claim_id list
    blocked_source_hashes: TreeMap[str, str]   # url_hash  -> reason
    latest_review_by_claim: TreeMap[str, str]  # claim_id  -> review_id

    def __init__(self) -> None:
        self.owner = gl.message.sender_address.as_hex
        self.paused = False

        self.claim_counter = u256(0)
        self.evidence_counter = u256(0)
        self.review_counter = u256(0)
        self.challenge_counter = u256(0)
        self.audit_counter = u256(0)

        self.claims = TreeMap()
        self.evidence_items = TreeMap()
        self.reviews = TreeMap()
        self.challenges = TreeMap()
        self.audit_logs = TreeMap()

        self.claim_evidence_index = TreeMap()
        self.claim_review_index = TreeMap()
        self.claim_challenge_index = TreeMap()
        self.evidence_challenge_index = TreeMap()
        self.claim_audit_index = TreeMap()
        self.creator_claim_index = TreeMap()
        self.submitter_evidence_index = TreeMap()

        self.source_url_claim_index = TreeMap()
        self.blocked_source_hashes = TreeMap()
        self.latest_review_by_claim = TreeMap()

    # ==================================================================
    # Internal helpers
    # ==================================================================

    def _sender(self) -> str:
        return gl.message.sender_address.as_hex.lower()

    def _json(self, value: typing.Any) -> str:
        return json.dumps(value, sort_keys=True)

    def _load(self, raw: str) -> typing.Any:
        if raw is None or raw == "":
            return {}
        return json.loads(raw)

    def _require_owner(self) -> None:
        if self._sender() != self.owner.lower():
            raise gl.vm.UserError("Only contract owner can call this method")

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.vm.UserError("Contract is paused")

    def _require_non_empty(self, value: str, field: str) -> None:
        if value is None or len(value.strip()) == 0:
            raise gl.vm.UserError(field + " is required")

    def _limit(self, value: typing.Any, max_len: int) -> str:
        text = str(value) if value is not None else ""
        return text[:max_len] if len(text) > max_len else text

    def _append(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        return existing + "|" + item

    def _append_unique(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        parts = existing.split("|")
        for part in parts:
            if part == item:
                return existing
        return existing + "|" + item

    def _list_from_pipe(self, value: str) -> typing.List[str]:
        if value is None or value == "":
            return []
        return [p for p in value.split("|") if p != ""]

    def _url_hash(self, url: str) -> str:
        # Simple stable key: strip scheme, lowercase, take first 240 chars
        normalized = url.lower().replace("https://", "").replace("http://", "")
        return normalized[:240]

    def _next_claim_id(self) -> str:
        self.claim_counter = self.claim_counter + u256(1)
        return "CLM-" + str(self.claim_counter)

    def _next_evidence_id(self) -> str:
        self.evidence_counter = self.evidence_counter + u256(1)
        return "EVI-" + str(self.evidence_counter)

    def _next_review_id(self) -> str:
        self.review_counter = self.review_counter + u256(1)
        return "REV-" + str(self.review_counter)

    def _next_challenge_id(self) -> str:
        self.challenge_counter = self.challenge_counter + u256(1)
        return "CHL-" + str(self.challenge_counter)

    def _next_audit_id(self) -> str:
        self.audit_counter = self.audit_counter + u256(1)
        return "AUD-" + str(self.audit_counter)

    def _require_claim_exists(self, claim_id: str) -> typing.Any:
        raw = self.claims.get(claim_id, "")
        if raw == "":
            raise gl.vm.UserError("Claim not found: " + claim_id)
        return self._load(raw)

    def _require_evidence_exists(self, evidence_id: str) -> typing.Any:
        raw = self.evidence_items.get(evidence_id, "")
        if raw == "":
            raise gl.vm.UserError("Evidence not found: " + evidence_id)
        return self._load(raw)

    def _require_review_exists(self, review_id: str) -> typing.Any:
        raw = self.reviews.get(review_id, "")
        if raw == "":
            raise gl.vm.UserError("Review not found: " + review_id)
        return self._load(raw)

    def _require_valid_claim_type(self, claim_type: str) -> None:
        valid = [
            "product_ship", "public_statement", "technical_capability",
            "contribution_proof", "milestone_completion", "incident_claim",
            "policy_change", "identity_link", "market_metric", "general_claim",
        ]
        if claim_type not in valid:
            raise gl.vm.UserError("Invalid claim type: " + claim_type)

    def _require_valid_evidence_standard(self, standard: str) -> None:
        valid = [
            "primary_source_required", "strong_public_evidence",
            "multiple_independent_sources", "official_source_or_repository",
            "reasonable_public_support",
        ]
        if standard not in valid:
            raise gl.vm.UserError("Invalid evidence standard: " + standard)

    def _require_valid_source_type(self, source_type: str) -> None:
        valid = [
            "official_docs", "github_repository", "github_commit",
            "github_issue_or_pr", "explorer_transaction", "social_post",
            "blog_post", "news_article", "forum_thread", "documentation_page",
            "dashboard_or_metric", "other_public_source",
        ]
        if source_type not in valid:
            raise gl.vm.UserError("Invalid source type: " + source_type)

    def _require_valid_support_direction(self, direction: str) -> None:
        valid = ["supports", "contradicts", "contextual", "uncertain"]
        if direction not in valid:
            raise gl.vm.UserError("Invalid support direction: " + direction)

    def _require_valid_url(self, url: str, field: str) -> None:
        if not url.startswith("http://") and not url.startswith("https://"):
            raise gl.vm.UserError(field + " must start with http:// or https://")

    def _normalise_verdict(self, raw: typing.Any) -> str:
        verdict = str(raw).strip().lower()
        valid = [
            "proven", "mostly_supported", "weakly_supported", "contradicted",
            "unsupported", "stale_evidence", "wrong_scope", "source_unreachable",
            "insufficient_evidence", "mixed", "needs_more_sources",
        ]
        if verdict in valid:
            return verdict
        # Fuzzy normalisation
        if "proven" in verdict or "confirmed" in verdict:
            return "proven"
        if "mostly" in verdict or "largely" in verdict:
            return "mostly_supported"
        if "weak" in verdict or "partial" in verdict:
            return "weakly_supported"
        if "contradict" in verdict or "refut" in verdict or "disprove" in verdict:
            return "contradicted"
        if "unsupport" in verdict or "no support" in verdict:
            return "unsupported"
        if "stale" in verdict or "outdated" in verdict or "expired" in verdict:
            return "stale_evidence"
        if "scope" in verdict or "wrong" in verdict or "irrelevant" in verdict:
            return "wrong_scope"
        if "unreachable" in verdict or "unavailable" in verdict or "404" in verdict:
            return "source_unreachable"
        if "insufficient" in verdict or "not enough" in verdict:
            return "insufficient_evidence"
        if "mixed" in verdict or "conflict" in verdict:
            return "mixed"
        if "more" in verdict or "additional" in verdict:
            return "needs_more_sources"
        return "insufficient_evidence"

    def _normalise_confidence(self, raw: typing.Any) -> str:
        conf = str(raw).strip().lower()
        if conf in ["high", "medium", "low"]:
            return conf
        if "high" in conf or "strong" in conf or "very" in conf:
            return "high"
        if "med" in conf or "moderate" in conf or "fair" in conf:
            return "medium"
        return "low"

    def _normalise_source_alignment(self, raw: typing.Any) -> str:
        alignment = str(raw).strip().lower()
        if alignment in ["direct", "indirect", "partial", "conflicting", "none"]:
            return alignment
        if "direct" in alignment:
            return "direct"
        if "indirect" in alignment or "tangential" in alignment:
            return "indirect"
        if "partial" in alignment or "partly" in alignment:
            return "partial"
        if "conflict" in alignment or "contradict" in alignment:
            return "conflicting"
        return "none"

    def _normalise_ai_verdict(self, raw: typing.Any) -> typing.Any:
        if isinstance(raw, str):
            parsed = json.loads(raw)
        else:
            parsed = raw

        # Resolve evidence IDs safely — default to 0 if missing/invalid
        def safe_int(v: typing.Any, default: int) -> int:
            try:
                return int(v)
            except Exception:
                return default

        overall_verdict = self._normalise_verdict(parsed.get("overall_verdict", "insufficient_evidence"))
        confidence = self._normalise_confidence(parsed.get("confidence", "low"))
        source_alignment = self._normalise_source_alignment(parsed.get("source_alignment", "none"))
        strongest_evidence_id = safe_int(parsed.get("strongest_evidence_id", 0), 0)
        weakest_evidence_id = safe_int(parsed.get("weakest_evidence_id", 0), 0)
        contradiction_found = bool(parsed.get("contradiction_found", False))
        short_reason = self._limit(parsed.get("short_reason", ""), 180)

        return {
            "overall_verdict": overall_verdict,
            "confidence": confidence,
            "source_alignment": source_alignment,
            "strongest_evidence_id": strongest_evidence_id,
            "weakest_evidence_id": weakest_evidence_id,
            "contradiction_found": contradiction_found,
            "short_reason": short_reason,
        }

    def _record_audit(
        self,
        claim_id: str,
        event_type: str,
        actor: str,
        summary: str,
        ref_id: str,
        created_at: str,
    ) -> str:
        audit_id = self._next_audit_id()
        entry = {
            "audit_id": audit_id,
            "claim_id": claim_id,
            "event_type": event_type,
            "actor": actor.lower(),
            "summary": self._limit(summary, 600),
            "ref_id": ref_id,
            "created_at": created_at,
        }
        self.audit_logs[audit_id] = self._json(entry)
        if claim_id != "":
            self.claim_audit_index[claim_id] = self._append(
                self.claim_audit_index.get(claim_id, ""),
                audit_id,
            )
        return audit_id

    def _collect_evidence_packet(self, claim_id: str) -> str:
        evidence_ids = self._list_from_pipe(self.claim_evidence_index.get(claim_id, ""))
        collected: typing.List[typing.Any] = []
        for eid in evidence_ids:
            raw = self.evidence_items.get(eid, "")
            if raw == "":
                continue
            ev = self._load(raw)
            collected.append({
                "evidence_id": ev.get("evidence_id", eid),
                "source_url": ev.get("source_url", ""),
                "source_title": ev.get("source_title", ""),
                "source_type": ev.get("source_type", ""),
                "support_direction": ev.get("support_direction", ""),
                "explanation": ev.get("explanation", ""),
                "excerpt": ev.get("excerpt", ""),
                "archived_url": ev.get("archived_url", ""),
                "submitter": ev.get("submitter", ""),
                "review_status": ev.get("review_status", "pending"),
            })
        return self._json(collected)

    def _run_consensus_review(
        self,
        claim: typing.Any,
        evidence_packet: str,
    ) -> typing.Any:

        claim_json = self._json({
            "title": claim.get("title", ""),
            "statement": claim.get("statement", ""),
            "claim_type": claim.get("claim_type", ""),
            "evidence_standard": claim.get("evidence_standard", ""),
            "context": claim.get("context", ""),
            "preferred_sources": claim.get("preferred_sources", ""),
            "excluded_sources": claim.get("excluded_sources", ""),
        })

        def evaluate_once() -> str:
            prompt = f"""You are an independent evidence validator for Cite, a decentralized on-chain evidence court.

Your task is to judge whether the submitted evidence sources actually prove the following claim — not whether they mention related topics or are from a related project.

CLAIM:
{claim_json}

SUBMITTED EVIDENCE:
{evidence_packet}

VALIDATION RULES (follow strictly):
1. Judge only whether each source proves the EXACT claim statement. Do not accept a source that proves a similar or related claim.
2. Do not infer more than the source explicitly states.
3. Do not accept a source because it mentions the same project, company, or person — it must specifically support the claim.
4. Official docs, repositories, commits, explorer transactions, and direct public statements are stronger than secondary commentary, blog posts, or social posts.
5. Treat unreachable, invalid, or 404 URLs as source_unreachable evidence.
6. Treat sources published before the claimed event with a timestamp mismatch as stale_evidence.
7. Treat promotional pages, marketing copy, and press releases as weaker than technical proof.
8. Do not reward a source for using similar words to the claim — it must support the claim's assertion.
9. If submitted evidence contradicts the claim, return "contradicted" and set contradiction_found to true.
10. If evidence supports only part of the claim, prefer "weakly_supported" or "mostly_supported" over "proven".
11. The strongest_evidence_id and weakest_evidence_id must be the numeric portion of the evidence_id (e.g. for EVI-3, return 3).
12. Return only the JSON object. No explanation, no markdown, no prose.

VERDICT OPTIONS (choose exactly one):
proven | mostly_supported | weakly_supported | contradicted | unsupported | stale_evidence | wrong_scope | source_unreachable | insufficient_evidence | mixed | needs_more_sources

CONFIDENCE OPTIONS (choose exactly one):
high | medium | low

SOURCE ALIGNMENT OPTIONS (choose exactly one):
direct | indirect | partial | conflicting | none

Return ONLY this canonical JSON object and nothing else:
{{
  "overall_verdict": "one of the verdict options above",
  "confidence": "high|medium|low",
  "source_alignment": "direct|indirect|partial|conflicting|none",
  "strongest_evidence_id": <integer>,
  "weakest_evidence_id": <integer>,
  "contradiction_found": <true|false>,
  "short_reason": "<max 180 characters explaining the verdict concisely>"
}}"""

            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            normalised = self._normalise_ai_verdict(raw)
            return json.dumps(normalised, sort_keys=True)

        consensus_json = gl.eq_principle.prompt_comparative(
            evaluate_once,
            principle="""
The final evidence court verdict must be equivalent across all validators.

Strict equivalence requirements:
- overall_verdict must match exactly. PROVEN cannot be equivalent to CONTRADICTED, UNSUPPORTED, or INSUFFICIENT_EVIDENCE.
- CONTRADICTED cannot be equivalent to PROVEN, MOSTLY_SUPPORTED, or WEAKLY_SUPPORTED.
- confidence may differ by at most one band (e.g. high vs medium is acceptable; high vs low is not).
- source_alignment must match exactly.
- contradiction_found must match exactly — both true or both false.
- strongest_evidence_id and weakest_evidence_id may differ only if multiple evidence items have equivalent strength.
- short_reason wording may differ so long as the core reasoning is materially the same.
- Validators must not disagree on whether the primary evidence directly supports the claim.
""",
        )

        return self._normalise_ai_verdict(consensus_json)

    # ==================================================================
    # Owner and contract management
    # ==================================================================

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.view
    def get_contract_summary(self) -> str:
        return self._json({
            "owner": self.owner,
            "paused": self.paused,
            "claim_counter": str(self.claim_counter),
            "evidence_counter": str(self.evidence_counter),
            "review_counter": str(self.review_counter),
            "challenge_counter": str(self.challenge_counter),
            "audit_counter": str(self.audit_counter),
        })

    @gl.public.write
    def pause(self) -> None:
        self._require_owner()
        self.paused = True

    @gl.public.write
    def unpause(self) -> None:
        self._require_owner()
        self.paused = False

    @gl.public.write
    def transfer_ownership(self, new_owner: str, transferred_at: str) -> None:
        self._require_owner()
        self._require_non_empty(new_owner, "new_owner")
        previous = self.owner
        self.owner = new_owner
        self._record_audit("", "OWNERSHIP_TRANSFERRED", previous, "Contract ownership transferred to " + new_owner, new_owner, transferred_at)

    # ==================================================================
    # Claim management
    # ==================================================================

    @gl.public.write
    def create_claim(
        self,
        title: str,
        statement: str,
        claim_type: str,
        evidence_standard: str,
        context: str,
        excluded_sources: str,
        preferred_sources: str,
        deadline: u256,
        created_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(title, "title")
        self._require_non_empty(statement, "statement")
        self._require_non_empty(claim_type, "claim_type")
        self._require_non_empty(evidence_standard, "evidence_standard")
        self._require_non_empty(created_at, "created_at")

        if len(title.strip()) < 8:
            raise gl.vm.UserError("Title must be at least 8 characters")
        if len(title) > 120:
            raise gl.vm.UserError("Title must be at most 120 characters")
        if len(statement.strip()) < 30:
            raise gl.vm.UserError("Statement must be at least 30 characters")
        if len(statement) > 600:
            raise gl.vm.UserError("Statement must be at most 600 characters")

        self._require_valid_claim_type(claim_type)
        self._require_valid_evidence_standard(evidence_standard)

        claim_id = self._next_claim_id()

        record = {
            "claim_id": claim_id,
            "creator": self._sender(),
            "title": self._limit(title, 120),
            "statement": self._limit(statement, 600),
            "claim_type": claim_type,
            "evidence_standard": evidence_standard,
            "context": self._limit(context, 1000),
            "excluded_sources": self._limit(excluded_sources, 500),
            "preferred_sources": self._limit(preferred_sources, 500),
            "deadline": str(deadline),
            "status": "open",
            "evidence_count": "0",
            "review_count": "0",
            "final_verdict": "",
            "final_confidence": "",
            "final_reason": "",
            "created_at": created_at,
            "updated_at": created_at,
        }

        self.claims[claim_id] = self._json(record)
        self.claim_evidence_index[claim_id] = ""
        self.claim_review_index[claim_id] = ""
        self.claim_challenge_index[claim_id] = ""

        self.creator_claim_index[self._sender()] = self._append(
            self.creator_claim_index.get(self._sender(), ""),
            claim_id,
        )

        self._record_audit(
            claim_id,
            "CLAIM_CREATED",
            self._sender(),
            "Claim created: " + self._limit(title, 80),
            claim_id,
            created_at,
        )

        return claim_id

    @gl.public.write
    def close_claim(self, claim_id: str, closed_at: str) -> None:
        self._require_not_paused()
        claim = self._require_claim_exists(claim_id)

        if claim.get("creator", "").lower() != self._sender() and self._sender() != self.owner.lower():
            raise gl.vm.UserError("Only claim creator or contract owner can close a claim")

        if claim.get("status", "") == "closed":
            raise gl.vm.UserError("Claim is already closed")

        claim["status"] = "closed"
        claim["updated_at"] = closed_at
        self.claims[claim_id] = self._json(claim)

        self._record_audit(
            claim_id,
            "CLAIM_CLOSED",
            self._sender(),
            "Claim closed",
            claim_id,
            closed_at,
        )

    # ==================================================================
    # Evidence management
    # ==================================================================

    @gl.public.write
    def submit_evidence(
        self,
        claim_id: str,
        source_url: str,
        source_title: str,
        source_type: str,
        support_direction: str,
        explanation: str,
        excerpt: str,
        archived_url: str,
        submitted_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(claim_id, "claim_id")
        self._require_non_empty(source_url, "source_url")
        self._require_non_empty(source_title, "source_title")
        self._require_non_empty(source_type, "source_type")
        self._require_non_empty(support_direction, "support_direction")
        self._require_non_empty(explanation, "explanation")
        self._require_non_empty(submitted_at, "submitted_at")

        self._require_valid_url(source_url, "source_url")
        if archived_url != "" and archived_url is not None:
            self._require_valid_url(archived_url, "archived_url")

        if len(source_title.strip()) < 5:
            raise gl.vm.UserError("Source title must be at least 5 characters")
        if len(source_title) > 160:
            raise gl.vm.UserError("Source title must be at most 160 characters")
        if len(explanation.strip()) < 20:
            raise gl.vm.UserError("Explanation must be at least 20 characters")
        if len(explanation) > 500:
            raise gl.vm.UserError("Explanation must be at most 500 characters")

        self._require_valid_source_type(source_type)
        self._require_valid_support_direction(support_direction)

        claim = self._require_claim_exists(claim_id)
        if claim.get("status", "") == "closed":
            raise gl.vm.UserError("Cannot submit evidence to a closed claim")

        url_hash = self._url_hash(source_url)
        if self.blocked_source_hashes.get(url_hash, "") != "":
            raise gl.vm.UserError("This source URL has been blocked by the court")

        evidence_id = self._next_evidence_id()

        record = {
            "evidence_id": evidence_id,
            "claim_id": claim_id,
            "submitter": self._sender(),
            "source_url": self._limit(source_url, 600),
            "source_title": self._limit(source_title, 160),
            "source_type": source_type,
            "support_direction": support_direction,
            "explanation": self._limit(explanation, 500),
            "excerpt": self._limit(excerpt, 300),
            "archived_url": self._limit(archived_url, 600),
            "review_status": "pending",
            "evidence_verdict": "",
            "evidence_reason": "",
            "submitted_at": submitted_at,
        }

        self.evidence_items[evidence_id] = self._json(record)

        self.claim_evidence_index[claim_id] = self._append(
            self.claim_evidence_index.get(claim_id, ""),
            evidence_id,
        )

        self.submitter_evidence_index[self._sender()] = self._append(
            self.submitter_evidence_index.get(self._sender(), ""),
            evidence_id,
        )

        self.source_url_claim_index[url_hash] = self._append_unique(
            self.source_url_claim_index.get(url_hash, ""),
            claim_id,
        )

        evidence_count = int(claim.get("evidence_count", "0")) + 1
        claim["evidence_count"] = str(evidence_count)
        if claim.get("status", "") == "open":
            claim["status"] = "open"
        claim["updated_at"] = submitted_at
        self.claims[claim_id] = self._json(claim)

        self._record_audit(
            claim_id,
            "EVIDENCE_SUBMITTED",
            self._sender(),
            "Evidence submitted: " + self._limit(source_title, 80) + " (" + source_type + ")",
            evidence_id,
            submitted_at,
        )

        return evidence_id

    @gl.public.write
    def update_evidence_review_status(
        self,
        evidence_id: str,
        review_status: str,
        evidence_verdict: str,
        evidence_reason: str,
        updated_at: str,
    ) -> None:
        self._require_not_paused()
        evidence = self._require_evidence_exists(evidence_id)

        valid_statuses = ["pending", "reviewed", "challenged", "accepted", "rejected"]
        if review_status not in valid_statuses:
            raise gl.vm.UserError("Invalid review_status")

        claim_id = evidence.get("claim_id", "")
        claim = self._require_claim_exists(claim_id)
        if claim.get("creator", "").lower() != self._sender() and self._sender() != self.owner.lower():
            raise gl.vm.UserError("Only claim creator or contract owner can update evidence status")

        evidence["review_status"] = review_status
        evidence["evidence_verdict"] = self._limit(evidence_verdict, 60)
        evidence["evidence_reason"] = self._limit(evidence_reason, 300)
        self.evidence_items[evidence_id] = self._json(evidence)

        self._record_audit(
            claim_id,
            "EVIDENCE_STATUS_UPDATED",
            self._sender(),
            "Evidence " + evidence_id + " status set to " + review_status,
            evidence_id,
            updated_at,
        )

    # ==================================================================
    # GenLayer consensus review
    # ==================================================================

    @gl.public.write
    def request_review(
        self,
        claim_id: str,
        requested_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(claim_id, "claim_id")
        self._require_non_empty(requested_at, "requested_at")

        claim = self._require_claim_exists(claim_id)

        if claim.get("status", "") == "closed":
            raise gl.vm.UserError("Cannot review a closed claim")

        evidence_ids_raw = self.claim_evidence_index.get(claim_id, "")
        evidence_ids = self._list_from_pipe(evidence_ids_raw)
        if len(evidence_ids) == 0:
            raise gl.vm.UserError("At least one evidence item must be submitted before requesting review")

        # Mark claim as under review
        claim["status"] = "under_review"
        claim["updated_at"] = requested_at
        self.claims[claim_id] = self._json(claim)

        self._record_audit(
            claim_id,
            "REVIEW_REQUESTED",
            self._sender(),
            "GenLayer consensus review requested with " + str(len(evidence_ids)) + " evidence item(s)",
            claim_id,
            requested_at,
        )

        # Collect evidence packet
        evidence_packet = self._collect_evidence_packet(claim_id)

        # Run GenLayer nondeterministic consensus
        verdict_result = self._run_consensus_review(claim, evidence_packet)

        # Persist review record
        review_id = self._next_review_id()

        review_record = {
            "review_id": review_id,
            "claim_id": claim_id,
            "requested_by": self._sender(),
            "overall_verdict": verdict_result.get("overall_verdict", "insufficient_evidence"),
            "confidence": verdict_result.get("confidence", "low"),
            "source_alignment": verdict_result.get("source_alignment", "none"),
            "strongest_evidence_id": str(verdict_result.get("strongest_evidence_id", 0)),
            "weakest_evidence_id": str(verdict_result.get("weakest_evidence_id", 0)),
            "contradiction_found": bool(verdict_result.get("contradiction_found", False)),
            "short_reason": verdict_result.get("short_reason", ""),
            "canonical_json": json.dumps(verdict_result, sort_keys=True),
            "adjudicated_by": "GENLAYER_CONSENSUS",
            "requested_at": requested_at,
        }

        self.reviews[review_id] = self._json(review_record)
        self.latest_review_by_claim[claim_id] = review_id

        self.claim_review_index[claim_id] = self._append(
            self.claim_review_index.get(claim_id, ""),
            review_id,
        )

        # Update claim with final verdict
        review_count = int(claim.get("review_count", "0")) + 1
        claim["status"] = "reviewed"
        claim["review_count"] = str(review_count)
        claim["final_verdict"] = verdict_result.get("overall_verdict", "")
        claim["final_confidence"] = verdict_result.get("confidence", "")
        claim["final_reason"] = verdict_result.get("short_reason", "")
        claim["updated_at"] = requested_at
        self.claims[claim_id] = self._json(claim)

        self._record_audit(
            claim_id,
            "GENLAYER_REVIEW_COMPLETED",
            "GENLAYER_CONSENSUS",
            "Verdict: " + verdict_result.get("overall_verdict", "") + " | Confidence: " + verdict_result.get("confidence", "") + " | " + verdict_result.get("short_reason", ""),
            review_id,
            requested_at,
        )

        return review_id

    # ==================================================================
    # Evidence challenges
    # ==================================================================

    @gl.public.write
    def challenge_evidence(
        self,
        claim_id: str,
        evidence_id: str,
        challenge_reason: str,
        counter_source_url: str,
        challenger_notes: str,
        challenged_at: str,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(claim_id, "claim_id")
        self._require_non_empty(evidence_id, "evidence_id")
        self._require_non_empty(challenge_reason, "challenge_reason")
        self._require_non_empty(challenged_at, "challenged_at")

        if len(challenge_reason.strip()) < 10:
            raise gl.vm.UserError("Challenge reason must be at least 10 characters")

        claim = self._require_claim_exists(claim_id)
        evidence = self._require_evidence_exists(evidence_id)

        if evidence.get("claim_id", "") != claim_id:
            raise gl.vm.UserError("Evidence does not belong to this claim")

        if counter_source_url != "" and counter_source_url is not None:
            self._require_valid_url(counter_source_url, "counter_source_url")

        challenge_id = self._next_challenge_id()

        challenge_record = {
            "challenge_id": challenge_id,
            "claim_id": claim_id,
            "evidence_id": evidence_id,
            "challenger": self._sender(),
            "challenge_reason": self._limit(challenge_reason, 500),
            "counter_source_url": self._limit(counter_source_url, 600),
            "challenger_notes": self._limit(challenger_notes, 400),
            "status": "open",
            "challenged_at": challenged_at,
        }

        self.challenges[challenge_id] = self._json(challenge_record)

        self.claim_challenge_index[claim_id] = self._append(
            self.claim_challenge_index.get(claim_id, ""),
            challenge_id,
        )
        self.evidence_challenge_index[evidence_id] = self._append(
            self.evidence_challenge_index.get(evidence_id, ""),
            challenge_id,
        )

        # Mark evidence as challenged
        evidence["review_status"] = "challenged"
        self.evidence_items[evidence_id] = self._json(evidence)

        self._record_audit(
            claim_id,
            "EVIDENCE_CHALLENGED",
            self._sender(),
            "Evidence " + evidence_id + " challenged: " + self._limit(challenge_reason, 100),
            challenge_id,
            challenged_at,
        )

        return challenge_id

    @gl.public.write
    def resolve_challenge(
        self,
        challenge_id: str,
        resolution: str,
        resolution_notes: str,
        resolved_at: str,
    ) -> None:
        self._require_not_paused()
        self._require_non_empty(challenge_id, "challenge_id")
        self._require_non_empty(resolved_at, "resolved_at")

        raw = self.challenges.get(challenge_id, "")
        if raw == "":
            raise gl.vm.UserError("Challenge not found: " + challenge_id)

        challenge = self._load(raw)
        claim_id = challenge.get("claim_id", "")
        claim = self._require_claim_exists(claim_id)

        if claim.get("creator", "").lower() != self._sender() and self._sender() != self.owner.lower():
            raise gl.vm.UserError("Only claim creator or contract owner can resolve a challenge")

        valid_resolutions = ["upheld", "dismissed", "evidence_removed"]
        if resolution not in valid_resolutions:
            raise gl.vm.UserError("Invalid resolution. Must be: upheld | dismissed | evidence_removed")

        challenge["status"] = "resolved"
        challenge["resolution"] = resolution
        challenge["resolution_notes"] = self._limit(resolution_notes, 400)
        challenge["resolved_by"] = self._sender()
        challenge["resolved_at"] = resolved_at
        self.challenges[challenge_id] = self._json(challenge)

        # If evidence is removed, update the evidence record
        if resolution == "evidence_removed":
            evidence_id = challenge.get("evidence_id", "")
            if evidence_id != "":
                ev_raw = self.evidence_items.get(evidence_id, "")
                if ev_raw != "":
                    ev = self._load(ev_raw)
                    ev["review_status"] = "rejected"
                    self.evidence_items[evidence_id] = self._json(ev)

        self._record_audit(
            claim_id,
            "CHALLENGE_RESOLVED",
            self._sender(),
            "Challenge " + challenge_id + " resolved as: " + resolution,
            challenge_id,
            resolved_at,
        )

    # ==================================================================
    # Source blocking (owner only)
    # ==================================================================

    @gl.public.write
    def block_source_url(
        self,
        source_url: str,
        reason: str,
        blocked_at: str,
    ) -> None:
        self._require_owner()
        self._require_not_paused()
        self._require_valid_url(source_url, "source_url")
        self._require_non_empty(reason, "reason")

        url_hash = self._url_hash(source_url)
        self.blocked_source_hashes[url_hash] = self._limit(reason, 400)

        self._record_audit(
            "",
            "SOURCE_URL_BLOCKED",
            self._sender(),
            "Source URL blocked: " + self._limit(source_url, 120) + " | Reason: " + self._limit(reason, 100),
            url_hash,
            blocked_at,
        )

    @gl.public.write
    def unblock_source_url(
        self,
        source_url: str,
        unblocked_at: str,
    ) -> None:
        self._require_owner()
        self._require_not_paused()
        self._require_valid_url(source_url, "source_url")

        url_hash = self._url_hash(source_url)
        self.blocked_source_hashes[url_hash] = ""

        self._record_audit(
            "",
            "SOURCE_URL_UNBLOCKED",
            self._sender(),
            "Source URL unblocked: " + self._limit(source_url, 120),
            url_hash,
            unblocked_at,
        )

    # ==================================================================
    # Read methods
    # ==================================================================

    @gl.public.view
    def get_claim(self, claim_id: str) -> str:
        return self.claims.get(claim_id, "")

    @gl.public.view
    def get_evidence(self, evidence_id: str) -> str:
        return self.evidence_items.get(evidence_id, "")

    @gl.public.view
    def get_review(self, review_id: str) -> str:
        return self.reviews.get(review_id, "")

    @gl.public.view
    def get_challenge(self, challenge_id: str) -> str:
        return self.challenges.get(challenge_id, "")

    @gl.public.view
    def get_audit_log(self, audit_id: str) -> str:
        return self.audit_logs.get(audit_id, "")

    @gl.public.view
    def get_claim_evidence_ids(self, claim_id: str) -> str:
        return self.claim_evidence_index.get(claim_id, "")

    @gl.public.view
    def get_claim_review_ids(self, claim_id: str) -> str:
        return self.claim_review_index.get(claim_id, "")

    @gl.public.view
    def get_claim_challenge_ids(self, claim_id: str) -> str:
        return self.claim_challenge_index.get(claim_id, "")

    @gl.public.view
    def get_claim_audit_ids(self, claim_id: str) -> str:
        return self.claim_audit_index.get(claim_id, "")

    @gl.public.view
    def get_evidence_challenge_ids(self, evidence_id: str) -> str:
        return self.evidence_challenge_index.get(evidence_id, "")

    @gl.public.view
    def get_creator_claim_ids(self, wallet: str) -> str:
        return self.creator_claim_index.get(wallet.lower(), "")

    @gl.public.view
    def get_submitter_evidence_ids(self, wallet: str) -> str:
        return self.submitter_evidence_index.get(wallet.lower(), "")

    @gl.public.view
    def get_latest_review(self, claim_id: str) -> str:
        review_id = self.latest_review_by_claim.get(claim_id, "")
        if review_id == "":
            return ""
        return self.reviews.get(review_id, "")

    @gl.public.view
    def get_latest_review_id(self, claim_id: str) -> str:
        return self.latest_review_by_claim.get(claim_id, "")

    @gl.public.view
    def is_source_blocked(self, source_url: str) -> str:
        url_hash = self._url_hash(source_url)
        return self.blocked_source_hashes.get(url_hash, "")

    @gl.public.view
    def get_claims_by_source_url(self, source_url: str) -> str:
        url_hash = self._url_hash(source_url)
        return self.source_url_claim_index.get(url_hash, "")
