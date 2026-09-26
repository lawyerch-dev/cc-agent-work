"""TeamCatalog scans bundled department templates."""

from __future__ import annotations

from octop.infra.agents.teams.catalog import TeamCatalog, default_library_root

EXPECTED = {"general-office", "hr-admin", "finance", "sales", "operations"}


def test_scans_all_templates_localized() -> None:
    cat = TeamCatalog(default_library_root())
    cat.refresh()
    zh = cat.list_summaries("zh")
    assert {s.id for s in zh} == EXPECTED
    office = cat.get("general-office")
    assert office is not None
    assert office.summary("zh").label == "总经办"
    assert office.summary("en").label == "General Office"
    assert cat.template_dir("general-office").name == "general-office"
    assert cat.welcome_message("finance", "zh")


def test_unknown_id_is_none() -> None:
    cat = TeamCatalog(default_library_root())
    cat.refresh()
    assert cat.get("nope") is None


def test_server_exposes_team_catalog() -> None:
    from octop.infra.server import OctopServer

    server = OctopServer()
    assert hasattr(server, "team_catalog")
