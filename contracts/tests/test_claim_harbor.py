# Tests for Claim Harbor Intelligent Contract
# Run with: genlayer test

import json
import pytest
from genlayer.testing import *

LIQUIDITY = 50_000 * 10**18
COVER_LIMIT = 1_000 * 10**18
PREMIUM = 200 * 10**18  # 2% of 1,000 GEN

POOL_PARAMS = {
    "name": "SaaS Outage Cover",
    "category": "saas_outage",
    "terms_summary": "Covers verified service downtime exceeding 4 hours.",
    "exclusions_summary": "Excludes planned maintenance and outages under 1 hour.",
    "terms_hash": "0xabc123",
    "max_cover_per_policy": 10_000 * 10**18,
    "min_premium_bps": 200,
    "claim_window_days": 30,
    "created_at": "2026-01-01T00:00:00Z",
}

COVER_PARAMS = {
    "cover_limit": COVER_LIMIT,
    "duration_days": 30,
    "claimant_terms_ack": True,
    "start_time": "2026-01-01T00:00:00Z",
    "end_time": "2026-01-31T00:00:00Z",
    "claim_deadline": "2026-03-02T00:00:00Z",
    "purchased_at": "2026-01-01T00:00:00Z",
}

CLAIM_PARAMS = {
    "requested_payout": 500 * 10**18,
    "incident_summary": "Service was down for 6 hours on 2026-01-15.",
    "evidence_urls_csv": "https://status.example.com/incident-001,https://downdetector.com/example",
    "evidence_notes": "Verified via public status page.",
    "submitted_at": "2026-01-15T10:00:00Z",
}


@pytest.fixture
def contract():
    return deploy_contract("contracts/claim_harbor.py", sender=accounts[0])


def _create_pool(contract, value=LIQUIDITY):
    return contract.create_pool(**POOL_PARAMS, value=value, sender=accounts[0])


def _buy_cover(contract, pool_id, value=PREMIUM, sender=None):
    return contract.buy_cover(pool_id=pool_id, **COVER_PARAMS, value=value, sender=sender or accounts[1])


def _submit_claim(contract, policy_id, sender=None):
    return contract.submit_claim(policy_id=policy_id, **CLAIM_PARAMS, sender=sender or accounts[1])


def _pool(contract, pool_id):
    return json.loads(contract.get_pool(pool_id, sender=accounts[0]))


# ------------------------------------------------------------------
# Pool management
# ------------------------------------------------------------------

def test_pool_requires_gen_liquidity(contract):
    with pytest.raises(Exception, match="Pool requires GEN liquidity"):
        contract.create_pool(**POOL_PARAMS, value=0, sender=accounts[0])


def test_create_pool_success(contract):
    pool_id = _create_pool(contract)
    assert pool_id.startswith("pool-")
    pool = _pool(contract, pool_id)
    assert pool["active"] is True
    assert pool["liquidity_total"] == str(LIQUIDITY)
    assert pool["liquidity_available"] == str(LIQUIDITY)
    assert pool["liquidity_reserved"] == "0"


def test_pool_id_increments(contract):
    id1 = _create_pool(contract)
    id2 = _create_pool(contract)
    assert id1 != id2


def test_paused_contract_blocks_pool_creation(contract):
    contract.pause(sender=accounts[0])
    with pytest.raises(Exception, match="Contract is paused"):
        _create_pool(contract)


def test_set_pool_inactive_blocks_cover(contract):
    pool_id = _create_pool(contract)
    contract.set_pool_active(pool_id, False, sender=accounts[0])
    with pytest.raises(Exception, match="Pool is not active"):
        _buy_cover(contract, pool_id)


# ------------------------------------------------------------------
# Cover purchase
# ------------------------------------------------------------------

def test_buy_cover_insufficient_premium(contract):
    pool_id = _create_pool(contract)
    with pytest.raises(Exception, match="Insufficient premium"):
        _buy_cover(contract, pool_id, value=0)


def test_buy_cover_above_pool_capacity(contract):
    pool_id = _create_pool(contract, value=500 * 10**18)
    with pytest.raises(Exception, match="Insufficient pool capacity"):
        contract.buy_cover(pool_id=pool_id, **COVER_PARAMS, value=PREMIUM, sender=accounts[1])


def test_buy_cover_exceeds_max_per_policy(contract):
    pool_id = _create_pool(contract)
    with pytest.raises(Exception, match="Cover limit exceeds pool maximum"):
        contract.buy_cover(
            pool_id=pool_id,
            cover_limit=20_000 * 10**18,
            duration_days=30,
            claimant_terms_ack=True,
            start_time="2026-01-01T00:00:00Z",
            end_time="2026-01-31T00:00:00Z",
            claim_deadline="2026-03-02T00:00:00Z",
            purchased_at="2026-01-01T00:00:00Z",
            value=2_000 * 10**18,
            sender=accounts[1],
        )


def test_terms_ack_required(contract):
    pool_id = _create_pool(contract)
    with pytest.raises(Exception, match="Must acknowledge policy terms"):
        contract.buy_cover(
            pool_id=pool_id,
            cover_limit=COVER_LIMIT,
            duration_days=30,
            claimant_terms_ack=False,
            start_time="2026-01-01T00:00:00Z",
            end_time="2026-01-31T00:00:00Z",
            claim_deadline="2026-03-02T00:00:00Z",
            purchased_at="2026-01-01T00:00:00Z",
            value=PREMIUM,
            sender=accounts[1],
        )


def test_buy_cover_success(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    assert policy_id.startswith("policy-")
    pool = _pool(contract, pool_id)
    assert pool["liquidity_reserved"] == str(COVER_LIMIT)
    assert pool["liquidity_available"] == str(LIQUIDITY - COVER_LIMIT)
    assert pool["premium_collected"] == str(PREMIUM)


# ------------------------------------------------------------------
# Claim submission
# ------------------------------------------------------------------

def test_only_policy_owner_can_submit_claim(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    with pytest.raises(Exception, match="Only policy holder"):
        _submit_claim(contract, policy_id, sender=accounts[2])


def test_claim_requires_evidence_url(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    with pytest.raises(Exception, match="At least one evidence URL"):
        contract.submit_claim(
            policy_id=policy_id,
            requested_payout=500 * 10**18,
            incident_summary="Service was down.",
            evidence_urls_csv="",
            evidence_notes="",
            submitted_at="2026-01-15T10:00:00Z",
            sender=accounts[1],
        )


def test_payout_cannot_exceed_cover_limit(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    with pytest.raises(Exception, match="Requested payout exceeds cover limit"):
        contract.submit_claim(
            policy_id=policy_id,
            requested_payout=2_000 * 10**18,
            incident_summary="Down for 8 hours.",
            evidence_urls_csv="https://status.example.com",
            evidence_notes="",
            submitted_at="2026-01-15T10:00:00Z",
            sender=accounts[1],
        )


def test_claim_submission_success(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    assert claim_id.startswith("claim-")
    raw = contract.get_claim(claim_id, sender=accounts[1])
    claim = json.loads(raw)
    assert claim["status"] == "submitted"
    assert claim["payout_claimed"] is False
    assert len(claim["evidence_urls"]) == 2


def test_double_claim_on_same_policy_fails(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="Policy is not active"):
        _submit_claim(contract, policy_id)


# ------------------------------------------------------------------
# Payout
# ------------------------------------------------------------------

def test_payout_cannot_be_claimed_before_verdict(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="Payout is not open"):
        contract.claim_payout(claim_id, sender=accounts[1])


def test_only_claimant_can_collect_payout(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="Only claimant"):
        contract.claim_payout(claim_id, sender=accounts[2])


# ------------------------------------------------------------------
# Underwriter withdrawal
# ------------------------------------------------------------------

def test_underwriter_cannot_withdraw_reserved(contract):
    pool_id = _create_pool(contract)
    _buy_cover(contract, pool_id, value=PREMIUM, sender=accounts[1])
    with pytest.raises(Exception, match="Cannot withdraw more than available"):
        contract.withdraw_unlocked_liquidity(pool_id, LIQUIDITY, "2026-01-20T00:00:00Z", sender=accounts[0])


def test_withdraw_available_liquidity(contract):
    pool_id = _create_pool(contract)
    withdraw_amount = 10_000 * 10**18
    contract.withdraw_unlocked_liquidity(pool_id, withdraw_amount, "2026-01-20T00:00:00Z", sender=accounts[0])
    pool = _pool(contract, pool_id)
    assert pool["liquidity_available"] == str(LIQUIDITY - withdraw_amount)
    assert pool["liquidity_total"] == str(LIQUIDITY - withdraw_amount)


def test_non_owner_cannot_withdraw(contract):
    pool_id = _create_pool(contract)
    with pytest.raises(Exception, match="Only pool owner"):
        contract.withdraw_unlocked_liquidity(pool_id, 1_000 * 10**18, "2026-01-20T00:00:00Z", sender=accounts[1])


# ------------------------------------------------------------------
# Public proof
# ------------------------------------------------------------------

def test_publish_proof_without_verdict_fails(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="No verdict to publish"):
        contract.publish_claim_proof(claim_id, sender=accounts[1])


def test_non_claimant_cannot_publish_proof(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="Only claimant"):
        contract.publish_claim_proof(claim_id, sender=accounts[2])


# ------------------------------------------------------------------
# Admin verdict override
# ------------------------------------------------------------------

def test_admin_can_override_verdict(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)

    raw_before = contract.get_claim(claim_id, sender=accounts[0])
    claim_before = json.loads(raw_before)
    assert claim_before["status"] == "submitted"

    contract.admin_set_claim_verdict(
        claim_id,
        "approved_full",
        10000,
        "Verified via public status page. Full payout approved.",
        "2026-01-16T00:00:00Z",
        sender=accounts[0],
    )

    raw_after = contract.get_claim(claim_id, sender=accounts[0])
    claim_after = json.loads(raw_after)
    assert claim_after["status"] == "payout_open"
    assert claim_after["payout_amount"] == str(500 * 10**18)


def test_non_admin_cannot_override_verdict(contract):
    pool_id = _create_pool(contract)
    policy_id = _buy_cover(contract, pool_id)
    claim_id = _submit_claim(contract, policy_id)
    with pytest.raises(Exception, match="Only contract owner"):
        contract.admin_set_claim_verdict(
            claim_id,
            "approved_full",
            10000,
            "Unauthorized override attempt.",
            "2026-01-16T00:00:00Z",
            sender=accounts[1],
        )


# ------------------------------------------------------------------
# Contract summary
# ------------------------------------------------------------------

def test_contract_summary(contract):
    summary = json.loads(contract.get_contract_summary(sender=accounts[0]))
    assert summary["paused"] is False
    assert summary["pool_counter"] == "0"
    _create_pool(contract)
    summary2 = json.loads(contract.get_contract_summary(sender=accounts[0]))
    assert summary2["pool_counter"] == "1"
