"""Bundled department team-template catalog (library/<id>/manifest.json)."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from octop.infra.utils.locale import DEFAULT_LOCALE, Locale, normalize_locale

logger = logging.getLogger(__name__)

# Department order for the default team set (人财物: 管理/人/财/业务/物).
DEFAULT_TEMPLATE_ORDER: tuple[str, ...] = (
    "general-office",
    "hr-admin",
    "finance",
    "sales",
    "operations",
)


@dataclass(frozen=True)
class TeamTemplateRole:
    name: str
    description: str


@dataclass(frozen=True)
class TeamTemplateSummary:
    id: str
    label: str
    description: str
    suggested_roles: tuple[TeamTemplateRole, ...]
    icon: str | None = None
    color: str | None = None


@dataclass(frozen=True)
class TeamTemplate:
    id: str
    dir: Path
    labels: dict[str, str]
    descriptions: dict[str, str]
    welcome_messages: dict[str, str]
    roles: dict[str, tuple[TeamTemplateRole, ...]]
    icon: str | None = None
    color: str | None = None

    @staticmethod
    def _pick(mapping: dict[str, str], locale: Locale) -> str:
        return (
            mapping.get(locale) or mapping.get(DEFAULT_LOCALE) or next(iter(mapping.values()), "")
        )

    def summary(self, locale: Locale | str) -> TeamTemplateSummary:
        loc = normalize_locale(locale)
        return TeamTemplateSummary(
            id=self.id,
            label=self._pick(self.labels, loc),
            description=self._pick(self.descriptions, loc),
            suggested_roles=self.roles.get(loc) or self.roles.get(DEFAULT_LOCALE) or (),
            icon=self.icon,
            color=self.color,
        )


def default_library_root() -> Path:
    return Path(__file__).resolve().parent / "library"


def _as_locale_map(raw: Any) -> dict[str, str]:
    if not isinstance(raw, dict):
        return {}
    return {str(k): str(v) for k, v in raw.items()}


def _as_roles(raw: Any) -> dict[str, tuple[TeamTemplateRole, ...]]:
    out: dict[str, tuple[TeamTemplateRole, ...]] = {}
    if not isinstance(raw, list):
        return out
    locales: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        for field in ("name", "description"):
            value = item.get(field)
            if isinstance(value, dict):
                locales.update(str(k) for k in value)
    for loc in locales:
        rows: list[TeamTemplateRole] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or {}
            desc = item.get("description") or {}
            name_text = (
                (name.get(loc) or name.get(DEFAULT_LOCALE)) if isinstance(name, dict) else None
            )
            desc_text = (
                (desc.get(loc) or desc.get(DEFAULT_LOCALE)) if isinstance(desc, dict) else None
            )
            if name_text:
                rows.append(TeamTemplateRole(name=str(name_text), description=str(desc_text or "")))
        out[loc] = tuple(rows)
    return out


class TeamCatalog:
    """Loads bundled team templates from ``library/<id>/manifest.json``."""

    def __init__(self, library_root: Path) -> None:
        self._root = library_root
        self._templates: dict[str, TeamTemplate] = {}

    def refresh(self) -> None:
        self._templates = {}
        if not self._root.is_dir():
            return
        for child in sorted(self._root.iterdir()):
            manifest = child / "manifest.json"
            if not child.is_dir() or not manifest.is_file():
                continue
            try:
                data = cast("dict[str, Any]", json.loads(manifest.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError) as exc:
                logger.warning("team template %s unreadable: %s", child.name, exc)
                continue
            self._templates[child.name] = TeamTemplate(
                id=child.name,
                dir=child,
                labels=_as_locale_map(data.get("label")),
                descriptions=_as_locale_map(data.get("description")),
                welcome_messages=_as_locale_map(data.get("welcome_message")),
                roles=_as_roles(data.get("suggested_roles")),
                icon=data.get("icon"),
                color=data.get("color"),
            )

    def get(self, template_id: str) -> TeamTemplate | None:
        return self._templates.get(template_id)

    def list_summaries(self, locale: Locale | str) -> list[TeamTemplateSummary]:
        return [tpl.summary(locale) for tpl in self._templates.values()]

    def ordered_summaries(self, locale: Locale | str) -> list[TeamTemplateSummary]:
        """Summaries in the canonical department order (unknown ids last)."""
        order = {tid: i for i, tid in enumerate(DEFAULT_TEMPLATE_ORDER)}
        return sorted(
            self.list_summaries(locale),
            key=lambda s: (order.get(s.id, len(order)), s.id),
        )

    def template_dir(self, template_id: str) -> Path:
        tpl = self._templates.get(template_id)
        return tpl.dir if tpl is not None else self._root / template_id

    def welcome_message(self, template_id: str, locale: Locale | str) -> str:
        tpl = self._templates.get(template_id)
        if tpl is None:
            return ""
        return TeamTemplate._pick(tpl.welcome_messages, normalize_locale(locale))
