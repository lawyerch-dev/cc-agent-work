"""Bundled team templates exist with localized metadata (scheme: 人财物)."""

from __future__ import annotations

import json
from pathlib import Path

EXPECTED_IDS = {"general-office", "hr-admin", "finance", "sales", "operations"}
LIB = Path(__file__).resolve().parents[3] / "src/octop/infra/agents/teams/library"


def test_all_templates_present_with_bilingual_manifest() -> None:
    dirs = {p.name for p in LIB.iterdir() if p.is_dir()}
    assert dirs >= EXPECTED_IDS
    for tid in EXPECTED_IDS:
        data = json.loads((LIB / tid / "manifest.json").read_text(encoding="utf-8"))
        assert data["kind"] == "team"
        assert data["members"] == []
        assert data["team_template"] == tid
        assert data["label"]["zh"] and data["label"]["en"]
        assert data["description"]["zh"] and data["description"]["en"]
        assert data["welcome_message"]["zh"] and data["welcome_message"]["en"]
        assert isinstance(data["suggested_roles"], list) and data["suggested_roles"]
        for path in ("AGENTS.md", "SOUL.md"):
            assert (LIB / tid / path).is_file()
