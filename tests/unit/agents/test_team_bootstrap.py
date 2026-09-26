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
