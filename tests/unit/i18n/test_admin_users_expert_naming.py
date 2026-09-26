"""Admin Users UI must call agents 「员工」 / Employees (terminology scheme A)."""

from __future__ import annotations

import json
from pathlib import Path


def test_admin_users_agent_column_uses_employee_terminology() -> None:
    repo = Path(__file__).resolve().parents[3]
    zh = json.loads((repo / "dashboard/src/locales/zh.json").read_text(encoding="utf-8"))
    en = json.loads((repo / "dashboard/src/locales/en.json").read_text(encoding="utf-8"))
    assert zh["adminUsers"]["colAgents"] == "员工"
    assert zh["adminUsers"]["agentsDrawerTitle"] == "{{username}} 的员工"
    assert zh["adminUsers"]["noAgents"] == "该用户暂无员工"
    assert en["adminUsers"]["colAgents"] == "Employees"
    assert en["adminUsers"]["agentsDrawerTitle"] == "{{username}}'s employees"
    assert en["adminUsers"]["noAgents"] == "This user has no employees yet"
