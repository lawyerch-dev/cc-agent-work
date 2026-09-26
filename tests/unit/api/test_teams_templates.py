"""Team template HTTP surface (router functions)."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from octop.api.routers import teams as teams_router
from octop.config import OctopConfig
from octop.infra.agents.manager import AgentManager
from octop.infra.agents.teams.catalog import TeamCatalog, default_library_root
from octop.infra.db.migrate import run_migrations
from octop.infra.db.pool import SqlitePool
from octop.infra.db.repos.users import UserRepo
from octop.infra.db.services import build_shared_services
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.utils.paths import PathLayout

EXPECTED = {"general-office", "hr-admin", "finance", "sales", "operations"}
EXPECTED_ORDER = ["general-office", "hr-admin", "finance", "sales", "operations"]


def _server(tmp_path: Path) -> SimpleNamespace:
    paths = PathLayout(tmp_path / ".octop")
    paths.ensure_root()
    db = SqlitePool(paths.db)
    run_migrations(db)
    UserRepo(db).create(username="owner", password_hash="h", role="admin")
    services = build_shared_services(db=db, paths=paths, config=OctopConfig())
    registry = AgentManager(repos=services.repos, paths=services.paths)
    catalog = TeamCatalog(default_library_root())
    catalog.refresh()
    runtime = SimpleNamespace(agent_registry=registry)
    return SimpleNamespace(app_runtime=runtime, team_catalog=catalog)


def _user() -> SimpleNamespace:
    return SimpleNamespace(id=1, locale="zh", is_admin=True)


@pytest.mark.asyncio
async def test_list_create_and_seed(tmp_path: Path) -> None:
    server = _server(tmp_path)
    user = _user()
    rows = await teams_router.list_team_templates(user=user, server=server)
    ids = {t["id"] for t in rows}
    assert ids == EXPECTED
    # Company-structure order (人财物), not directory order.
    assert [t["id"] for t in rows] == EXPECTED_ORDER

    created = await teams_router.create_team_from_template_endpoint(
        "finance", user=user, server=server
    )
    assert created["template_id"] == "finance"
    assert created["member_ids"] == []

    seeded = await teams_router.seed_default_teams(user=user, server=server)
    assert {t["template_id"] for t in seeded} == EXPECTED - {"finance"}
    # idempotent backfill
    assert await teams_router.seed_default_teams(user=user, server=server) == []


@pytest.mark.asyncio
async def test_unknown_template_raises(tmp_path: Path) -> None:
    server = _server(tmp_path)
    with pytest.raises(OctopError) as exc:
        await teams_router.create_team_from_template_endpoint("nope", user=_user(), server=server)
    assert exc.value.code is ErrorCode.TEAM_TEMPLATE_NOT_FOUND


@pytest.mark.asyncio
async def test_second_create_from_same_template_succeeds(tmp_path: Path) -> None:
    server = _server(tmp_path)
    user = _user()
    first = await teams_router.create_team_from_template_endpoint(
        "finance", user=user, server=server
    )
    second = await teams_router.create_team_from_template_endpoint(
        "finance", user=user, server=server
    )
    assert first["name"] == "财务部"
    assert second["name"] == "财务部 2"
    assert first["template_id"] == second["template_id"] == "finance"
