"""bootstrap_default_teams creates/backfills department teams idempotently."""

from __future__ import annotations

from pathlib import Path

import pytest

from octop.config import OctopConfig
from octop.infra.agents.manager import AgentManager
from octop.infra.agents.teams.bootstrap import bootstrap_default_teams
from octop.infra.agents.teams.catalog import TeamCatalog, default_library_root
from octop.infra.db.migrate import run_migrations
from octop.infra.db.pool import SqlitePool
from octop.infra.db.repos.users import UserRepo
from octop.infra.db.services import build_shared_services
from octop.infra.utils.paths import PathLayout

EXPECTED = {"general-office", "hr-admin", "finance", "sales", "operations"}


def _registry(tmp_path: Path) -> AgentManager:
    paths = PathLayout(tmp_path / ".octop")
    paths.ensure_root()
    db = SqlitePool(paths.db)
    run_migrations(db)
    UserRepo(db).create(username="owner", password_hash="h", role="admin")
    services = build_shared_services(db=db, paths=paths, config=OctopConfig())
    return AgentManager(repos=services.repos, paths=services.paths)


@pytest.mark.asyncio
async def test_creates_then_backfills(tmp_path: Path) -> None:
    registry = _registry(tmp_path)
    catalog = TeamCatalog(default_library_root())
    catalog.refresh()
    created = await bootstrap_default_teams(registry, catalog, user_id=1, only_if_empty=True)
    assert {c["template_id"] for c in created} == EXPECTED
    assert all(c["member_ids"] == [] for c in created)
    # only_if_empty → second call no-op
    assert await bootstrap_default_teams(registry, catalog, user_id=1, only_if_empty=True) == []
    # all present → backfill no-op
    assert await bootstrap_default_teams(registry, catalog, user_id=1) == []


async def _manual_team(registry: AgentManager, name: str) -> None:
    from octop.infra.agents.manager import AgentCreateSpec
    from octop.infra.agents.teams.service import TEAM_TEMPLATE_NAME

    await registry.create(
        AgentCreateSpec(
            name=name,
            user_id=1,
            kind="team",
            template_name=TEAM_TEMPLATE_NAME,
            member_ids=[],
        ),
        defer_bootstrap=True,
    )


@pytest.mark.asyncio
async def test_only_if_empty_respects_manual_team(tmp_path: Path) -> None:
    registry = _registry(tmp_path)
    catalog = TeamCatalog(default_library_root())
    catalog.refresh()
    await _manual_team(registry, "财务部")
    assert await bootstrap_default_teams(registry, catalog, user_id=1, only_if_empty=True) == []


@pytest.mark.asyncio
async def test_backfill_suffixes_when_name_taken(tmp_path: Path) -> None:
    registry = _registry(tmp_path)
    catalog = TeamCatalog(default_library_root())
    catalog.refresh()
    await _manual_team(registry, "财务部")
    created = await bootstrap_default_teams(registry, catalog, user_id=1)
    assert {c["template_id"] for c in created} == EXPECTED
    finance = next(c for c in created if c["template_id"] == "finance")
    assert finance["name"] == "财务部 2"
