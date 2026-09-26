"""Expert-team hosts and member roster."""

from octop.infra.agents.teams.bootstrap import bootstrap_default_teams, create_team_from_template
from octop.infra.agents.teams.catalog import (
    TeamCatalog,
    TeamTemplate,
    TeamTemplateRole,
    TeamTemplateSummary,
    default_library_root,
)
from octop.infra.agents.teams.jobs import TeamJobTracker
from octop.infra.agents.teams.service import (
    HOST_TOOLS_ALLOWED,
    HOST_TOOLS_DISABLED,
    TEAM_AVATAR_URL,
    TEAM_KIND,
    TEAM_MIN_MEMBERS,
    TEAM_TEMPLATE_NAME,
    TEMPLATE_DIR,
    TeamService,
    agent_kind,
    host_tools_disabled,
    is_team_agent,
    team_icon_url,
)
from octop.infra.agents.teams.team_manager import (
    TeamManager,
    host_system_prompt,
    wire_host_dispatch,
)

__all__ = [
    "HOST_TOOLS_ALLOWED",
    "HOST_TOOLS_DISABLED",
    "TEAM_AVATAR_URL",
    "TEAM_KIND",
    "TEAM_MIN_MEMBERS",
    "TEAM_TEMPLATE_NAME",
    "TEMPLATE_DIR",
    "TeamCatalog",
    "TeamJobTracker",
    "TeamManager",
    "TeamService",
    "TeamTemplate",
    "TeamTemplateRole",
    "TeamTemplateSummary",
    "agent_kind",
    "bootstrap_default_teams",
    "create_team_from_template",
    "default_library_root",
    "host_system_prompt",
    "host_tools_disabled",
    "is_team_agent",
    "team_icon_url",
    "wire_host_dispatch",
]
