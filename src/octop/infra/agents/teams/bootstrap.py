"""Create department teams from the bundled template catalog."""

from __future__ import annotations

from typing import Any

from octop.infra.agents.teams.catalog import TeamCatalog
from octop.infra.agents.teams.service import TEAM_KIND, TEAM_TEMPLATE_NAME
from octop.infra.utils.locale import normalize_locale


async def create_team_from_template(
    registry: Any,
    catalog: TeamCatalog,
    *,
    user_id: int,
    locale: str | None,
    template_id: str,
) -> Any:
    """Create a stopped team host from a department template (empty roster)."""
    from octop.infra.agents.manager import AgentCreateSpec  # noqa: PLC0415

    template = catalog.get(template_id)
    if template is None:
        raise ValueError(f"team template {template_id!r} not found")
    loc = normalize_locale(locale)
    summary = template.summary(loc)
    spec = AgentCreateSpec(
        name=_unique_team_name(registry, user_id, summary.label),
        user_id=user_id,
        description=summary.description,
        icon_name="users",
        color=summary.color,
        template_name=TEAM_TEMPLATE_NAME,
        kind=TEAM_KIND,
        team_template_id=template_id,
        welcome_message=catalog.welcome_message(template_id, loc) or None,
        member_ids=[],
        config={},
    )
    return await registry.create(spec, defer_bootstrap=True)


def _unique_team_name(registry: Any, user_id: int, base: str) -> str:
    """Same-template teams may coexist; suffix the label when the name is taken."""
    names = {row.name for row in registry.list_agents(user_id)}
    if base not in names:
        return base
    suffix = 2
    while f"{base} {suffix}" in names:
        suffix += 1
    return f"{base} {suffix}"


async def bootstrap_default_teams(
    registry: Any,
    catalog: TeamCatalog | None,
    *,
    user_id: int,
    locale: str | None = None,
    only_if_empty: bool = False,
) -> list[dict[str, Any]]:
    """Create any missing department teams for *user_id*; idempotent."""
    if catalog is None:
        return []
    teams = getattr(registry, "teams", None)
    existing: set[str] = set()
    has_team = False
    for row in registry.list_agents(user_id):
        if getattr(row, "kind", "expert") != TEAM_KIND:
            continue
        has_team = True
        tid = teams.template_id(row.agent_id) if teams is not None else None
        if tid:
            existing.add(tid)
    if only_if_empty and has_team:
        return []
    created: list[dict[str, Any]] = []
    for summary in catalog.ordered_summaries(locale or "zh"):
        if summary.id in existing:
            continue
        row = await create_team_from_template(
            registry, catalog, user_id=user_id, locale=locale, template_id=summary.id
        )
        created.append(
            teams.team_payload(row) if teams is not None else {"template_id": summary.id}
        )
    return created
