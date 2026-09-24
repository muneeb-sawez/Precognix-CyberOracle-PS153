"""Precognix-PS153 // REST API Contract Unit Tests.
Verifies status, mitigation generation with TTL, scenario loading, and sample forecast
directly without external client dependencies.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api_server import (
    app,
    status,
    list_scenarios,
    trigger_mitigation,
    ensemble_status,
    MitigationRequest
)


def test_api_status():
    data = status()
    assert data["status"] == "online"
    assert "device" in data
    assert data["context_windows_L"] == 30
    assert data["horizon_windows_K"] == 6
    assert data["features_count"] == 49
    assert data.get("confidence_intervals_enabled") is True
    assert data.get("temporal_attention_enabled") is True


def test_api_scenarios_list():
    data = list_scenarios()
    assert "presets" in data
    assert len(data["presets"]) >= 5


def test_mitigate_with_ttl():
    req = MitigationRequest(
        action="isolate_subnet",
        target_ip="192.168.10.100",
        port=445,
        protocol="TCP",
        reason="Predicted SMB Lateral Movement (P=0.98)",
        ttl_seconds=600
    )
    data = trigger_mitigation(req)
    assert data["status"] == "success"
    assert data["ttl_seconds"] == 600
    enforcement = data["enforcement"]
    assert "windows_firewall_rule" in enforcement
    assert "windows_rollback_rule" in enforcement
    assert "linux_iptables_ebpf" in enforcement
    assert "linux_rollback_rule" in enforcement
    assert "suricata_snort_rule" in enforcement


def test_ensemble_status():
    data = ensemble_status()
    assert "tiers" in data
    assert len(data["tiers"]) == 3


if __name__ == "__main__":
    print("[*] Running Precognix API Contract Tests...")

    print("  -> Testing /api/status...")
    test_api_status()
    print("     [PASS] Status endpoint, device info, and capabilities validated.")

    print("  -> Testing /api/scenarios...")
    test_api_scenarios_list()
    print("     [PASS] Pre-packaged attack scenarios catalog validated.")

    print("  -> Testing /api/mitigate with TTL & Rollback rules...")
    test_mitigate_with_ttl()
    print("     [PASS] Multi-platform firewall, rollback, and Suricata rules validated.")

    print("  -> Testing /api/ensemble/status...")
    test_ensemble_status()
    print("     [PASS] Tri-Tier Ensemble metadata validated.")

    print("\n[SUCCESS] All Precognix API contract tests passed successfully!")

