"""Setup completion seeds department teams for the admin."""

from __future__ import annotations

from types import SimpleNamespace

import pytest


@pytest.mark.asyncio
async def test_setup_bootstrap_teams_calls_bootstrap(monkeypatch: pytest.MonkeyPatch) -> None:
    from octop.api.routers import setup as setup_mod

    calls: dict[str, object] = {}

    async def fake_bootstrap(
        registry: object,
        catalog: object,
        *,
        user_id: int,
        locale: str | None = None,
        only_if_empty: bool = False,
    ) -> list[object]:
        calls.update(
            registry=registry,
            catalog=catalog,
            user_id=user_id,
            locale=locale,
            only_if_empty=only_if_empty,
        )
        return []

    monkeypatch.setattr(
        "octop.infra.agents.teams.bootstrap.bootstrap_default_teams", fake_bootstrap
    )
    server = SimpleNamespace(app_runtime=SimpleNamespace(agent_registry="REG"), team_catalog="CAT")
    await setup_mod._bootstrap_default_teams(server, user_id=7, locale="en")
    assert calls == {
        "registry": "REG",
        "catalog": "CAT",
        "user_id": 7,
        "locale": "en",
        "only_if_empty": True,
    }
