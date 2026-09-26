/**
 * Experts page — redesigned as Agents Management Centre.
 *
 * Tab A: user's experts, shown as a card grid with start/stop/edit/delete.
 * Tab B: built-in expert templates, shown as a card grid with create-from-template drawer.
 * Tab C: SkillHub expert market, shown as remote skillset cards.
 *
 * API (all via request() which already prefixes /api):
 *   GET  /experts                         → ExpertSummary[]
 *   GET  /experts/hub                     → SkillHub market cards (+ scenes)
 *   GET  /experts/hub/{slug}              → market detail + quick prompts
 *   POST /experts/hub/{slug}/install      → create agent from market
 *   GET  /agents                          → via AgentContext
 *   POST /agents/from-expert/{id}         → create agent (via CreateFromExpertDrawer)
 *   POST /agents/{id}/start|stop          → lifecycle (via AgentCard)
 *   PATCH /agents/{id}                    → edit (via EditAgentDrawer)
 *   DELETE /agents/{id}                   → delete (via AgentCard)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spin, Tabs, Segmented, Tooltip } from "antd";
import { message } from "@/utils/antdMessage";
import { modal } from "@/utils/antdModal";

import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import PageShell from "../../layouts/PageShell";
import TabLabel from "../../components/TabLabel";
import StreamSetupGuide from "../../components/StreamSetupGuide/StreamSetupGuide";
import { useIsMobile } from "../../hooks/useIsMobile";
import { request } from "../../api/request";
import {
  publishedExpertsApi,
  type PublishedExpert,
} from "../../api/modules/publishedExperts";
import { useAgent } from "../../context/AgentContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useCardTableView } from "../../hooks/useCardTableView";
import type { OctopAgent } from "../../context/AgentContext";
import { AgentCard } from "./components/AgentCard";
import { ExpertCard } from "./components/ExpertCard";
import type { ExpertSummary } from "./components/ExpertCard";
import EditAgentDrawer from "./components/EditAgentDrawer";
import CreateFromExpertDrawer, {
  type CreateFromTemplateSource,
} from "./components/CreateFromExpertDrawer";
import TeamDrawer from "./components/TeamDrawer";
import TeamTemplateDrawer from "./components/TeamTemplateDrawer";
import SortableTeamItem from "./components/SortableTeamItem";
import { sortTeams } from "./teamOrder";
import { teamsApi, type TeamRecord } from "../../api/modules/teams";
import { preferencesApi } from "../../api/modules/preferences";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { TeamCard } from "./components/TeamCard";
import { PublishedExpertCard } from "./components/PublishedExpertCard";
import AgentExpertsTable from "./components/AgentExpertsTable";
import ExpertMarketTab from "./components/ExpertMarketTab";
import { OctopEmptyMascot } from "../../components/EmptyState";
import { isOwnedExpert, ownedExperts } from "../../utils/sharedExpert";
import { apiErrorMessage } from "../../utils/apiError";
import styles from "./index.module.less";

type TabKey = "my" | "teams" | "library" | "market";
type ViewMode = "card" | "table";
const VIEW_STORAGE_KEY = "octop:experts-view";

function loadViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "table" ? "table" : "card";
}

async function fetchExpertLibrary(): Promise<ExpertSummary[]> {
  return request<ExpertSummary[]>("/experts");
}

async function fetchPublishedExperts(): Promise<PublishedExpert[]> {
  return publishedExpertsApi.list();
}

function installedExpertIdsFromAgents(
  agents: Pick<OctopAgent, "template_name" | "config">[],
): Set<string> {
  const ids = new Set<string>();
  for (const agent of agents) {
    const fromTemplate = agent.template_name?.trim();
    if (fromTemplate) {
      ids.add(fromTemplate);
      continue;
    }
    const legacy = agent.config?.expert_id;
    if (typeof legacy === "string" && legacy.trim()) {
      ids.add(legacy.trim());
    }
  }
  return ids;
}

export default function ExpertsPage() {
  const { t, i18n } = useTranslation();
  const lang: "zh" | "en" = i18n.language?.startsWith("zh") ? "zh" : "en";
  const isMobile = useIsMobile();
  const { agents, refresh: refreshAgents } = useAgent();
  const currentUser = useCurrentUser();

  const canManagePublished = useCallback(
    (expert: PublishedExpert) =>
      currentUser?.role === "admin" ||
      String(currentUser?.id) === expert.created_by,
    [currentUser],
  );

  // ── Tab state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("my");
  const { viewMode, setViewMode, showCardView } = useCardTableView(
    loadViewMode(),
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [agentList, expertList, publishedList] = await Promise.all([
        request<OctopAgent[]>("/agents"),
        fetchExpertLibrary(),
        fetchPublishedExperts(),
      ]);
      setLocalAgents(ownedExperts(agentList));
      setExperts(expertList);
      setPublishedExperts(publishedList);
      await refreshAgents({ silent: true, force: true });
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : t("experts.loadFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshAgents, t]);

  const onViewChange = (value: string | number) => {
    const mode = value === "table" ? "table" : "card";
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  // ── Built-in expert library ────────────────────────────────────
  const [experts, setExperts] = useState<ExpertSummary[]>([]);
  const [expertLoading, setExpertLoading] = useState(false);
  const [publishedExperts, setPublishedExperts] = useState<PublishedExpert[]>(
    [],
  );
  const [publishedExpertLoading, setPublishedExpertLoading] = useState(false);

  const publishedByAgentId = useMemo(() => {
    const map: Record<string, PublishedExpert> = {};
    for (const item of publishedExperts) {
      if (item.source_agent_id) {
        map[item.source_agent_id] = item;
      }
    }
    return map;
  }, [publishedExperts]);

  const refreshPublishedExperts = useCallback(async () => {
    try {
      setPublishedExperts(await fetchPublishedExperts());
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : t("experts.loadFailed"),
      );
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    setExpertLoading(true);
    setPublishedExpertLoading(true);
    Promise.all([fetchExpertLibrary(), fetchPublishedExperts()])
      .then(([expertData, publishedData]) => {
        if (!cancelled) {
          setExperts(expertData);
          setPublishedExperts(publishedData);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        message.error(
          err instanceof Error ? err.message : t("experts.loadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setExpertLoading(false);
          setPublishedExpertLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ── Local agent state (extends AgentContext for optimistic updates) ──
  const ownedAgents = useMemo(() => ownedExperts(agents), [agents]);
  const [localAgents, setLocalAgents] = useState<OctopAgent[]>(ownedAgents);
  const expertAgents = useMemo(
    () => localAgents.filter((item) => item.kind !== "team"),
    [localAgents],
  );
  const teamAgents = useMemo(
    () =>
      localAgents
        .filter((item) => item.kind === "team")
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    [localAgents],
  );

  const [teamOrder, setTeamOrder] = useState<string[]>([]);
  const sortedTeamAgents = useMemo(
    () => sortTeams(teamAgents, teamOrder),
    [teamAgents, teamOrder],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    let cancelled = false;
    preferencesApi
      .get()
      .then((prefs) => {
        if (!cancelled) setTeamOrder(prefs.team_order ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const saveTeamOrder = useCallback(
    (ids: string[]) => {
      setTeamOrder(ids);
      preferencesApi
        .patch({ team_order: ids })
        .catch(() => message.error(t("experts.teams.orderSaveFailed")));
    },
    [t],
  );

  const handleTeamDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = sortedTeamAgents.map((item) => item.agent_id);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from < 0 || to < 0) return;
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveTeamOrder(next);
    },
    [sortedTeamAgents, saveTeamOrder],
  );
  const pickableExperts = useMemo(
    () =>
      agents.filter(
        (item) =>
          item.kind !== "team" && (isOwnedExpert(item) || item.is_shared),
      ),
    [agents],
  );
  const [newAgentId, setNewAgentId] = useState<string | null>(null);

  useEffect(() => {
    setLocalAgents(ownedExperts(agents));
  }, [agents]);

  const handleStateChange = useCallback((agentId: string, newState: string) => {
    setLocalAgents((prev) =>
      prev.map((a) => (a.agent_id === agentId ? { ...a, state: newState } : a)),
    );
  }, []);

  const handleDeleted = useCallback(
    (agentId: string) => {
      setLocalAgents((prev) =>
        prev
          .filter((item) => item.agent_id !== agentId)
          .map((item) =>
            item.kind === "team" && item.member_ids?.includes(agentId)
              ? {
                  ...item,
                  member_ids: item.member_ids.filter((id) => id !== agentId),
                }
              : item,
          ),
      );
      void refreshAgents();
    },
    [refreshAgents],
  );

  // ── Edit Drawer ────────────────────────────────────────────────
  const [editAgent, setEditAgent] = useState<OctopAgent | null>(null);
  const [teamDrawer, setTeamDrawer] = useState<
    { mode: "create" } | { mode: "edit"; team: OctopAgent } | null
  >(null);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);

  const handleSeedDefaults = useCallback(async () => {
    try {
      const created = await teamsApi.seedDefaults();
      if (created.length === 0) {
        message.info(t("experts.teams.seedNone"));
      } else {
        message.success(t("experts.teams.seedDone", { count: created.length }));
      }
      void refreshAgents({ silent: true, force: true });
    } catch (err) {
      message.error(apiErrorMessage(err, t("experts.teams.seedFailed"), t));
    }
  }, [refreshAgents, t]);

  // ── Team batch select / delete ─────────────────────────────────
  const [teamSelectMode, setTeamSelectMode] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [batchDeleting, setBatchDeleting] = useState(false);

  const toggleTeamSelect = useCallback((agentId: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const exitTeamSelectMode = useCallback(() => {
    setTeamSelectMode(false);
    setSelectedTeamIds(new Set());
  }, []);

  const handleTeamBatchDelete = useCallback(() => {
    const ids = [...selectedTeamIds];
    if (ids.length === 0 || batchDeleting) return;
    modal.confirm({
      title: t("experts.teams.batchDeleteTitle", { count: ids.length }),
      content: t("experts.teams.batchDeleteHint"),
      okText: t("common.delete", "Delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: async () => {
        setBatchDeleting(true);
        let success = 0;
        let failed = 0;
        for (const id of ids) {
          try {
            await teamsApi.remove(id);
            success += 1;
          } catch {
            failed += 1;
          }
        }
        setBatchDeleting(false);
        setLocalAgents((prev) => {
          const removed = new Set(ids);
          return prev
            .filter((item) => !removed.has(item.agent_id))
            .map((item) =>
              item.kind === "team" &&
              item.member_ids?.some((id) => removed.has(id))
                ? {
                    ...item,
                    member_ids: item.member_ids.filter(
                      (id) => !removed.has(id),
                    ),
                  }
                : item,
            );
        });
        setSelectedTeamIds(new Set());
        if (failed === 0) {
          message.success(
            t("experts.teams.batchDeleteDone", { count: success }),
          );
          setTeamSelectMode(false);
        } else {
          message.warning(
            t("experts.teams.batchDeletePartial", { success, failed }),
          );
        }
        void refreshAgents({ silent: true, force: true });
      },
    });
  }, [selectedTeamIds, batchDeleting, t, refreshAgents]);

  const handleEditSaved = useCallback(
    (
      updated: Pick<
        OctopAgent,
        | "agent_id"
        | "name"
        | "description"
        | "default_model"
        | "is_shared"
        | "color"
        | "icon_url"
      >,
    ) => {
      setEditAgent(null);
      setLocalAgents((prev) =>
        prev.map((a) =>
          a.agent_id === updated.agent_id
            ? {
                ...a,
                name: updated.name,
                description: updated.description,
                default_model: updated.default_model,
                is_shared: updated.is_shared,
                color: updated.color,
                icon_url: updated.icon_url,
              }
            : a,
        ),
      );
      void refreshAgents({ silent: true });
    },
    [refreshAgents],
  );

  // ── Create-from-expert Drawer / Market create success ──────────
  const [createSource, setCreateSource] =
    useState<CreateFromTemplateSource | null>(null);

  const handleCreated = useCallback(
    (agentId: string, _agentName?: string) => {
      setCreateSource(null);
      void refreshAgents({ silent: true });
      setActiveTab("my");
      setNewAgentId(agentId);
      setTimeout(() => setNewAgentId(null), 1000);
    },
    [refreshAgents],
  );

  const [defaultCreating, setDefaultCreating] = useState(false);

  const openDefaultCreate = useCallback(async () => {
    setDefaultCreating(true);
    try {
      const expert = await request<ExpertSummary>("/experts/default");
      setCreateSource({ kind: "builtin", expert });
    } catch (err: unknown) {
      message.error(apiErrorMessage(err, t("experts.createFailed"), t));
    } finally {
      setDefaultCreating(false);
    }
  }, [t]);

  const openExpertLibrary = useCallback(() => {
    setActiveTab("library");
  }, []);

  // ── "Installed" badge lookup (template_name column; legacy config.expert_id) ──
  const agentExpertIds = useMemo(
    () => installedExpertIdsFromAgents(ownedAgents),
    [ownedAgents],
  );

  const refreshButton = useMemo(
    () => (
      <Tooltip title={t("common.refresh")}>
        <button
          className={styles.toolbarIconBtn}
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          type="button"
        >
          <RefreshCw
            size={14}
            className={refreshing ? styles.spinning : undefined}
          />
        </button>
      </Tooltip>
    ),
    [handleRefresh, refreshing, t],
  );

  // ── Render helpers ─────────────────────────────────────────────

  const myExpertsContent = useMemo(() => {
    if (expertAgents.length === 0) {
      return (
        <div
          className={`${styles.emptyLayout}${
            isMobile ? ` ${styles.emptyLayoutMobile}` : ""
          }`}
        >
          <StreamSetupGuide
            className={styles.emptyGuide}
            wide
            plain
            icon={<OctopEmptyMascot />}
            title={t("experts.emptyGuideTitle")}
            description={t("experts.emptyGuideDesc")}
            steps={[
              {
                label: t("experts.emptyGuideStepWhat"),
                detail: t("experts.emptyGuideStepWhatDetail"),
              },
              {
                label: t("experts.emptyGuideStepHow"),
                detail: t("experts.emptyGuideStepHowDetail"),
              },
              {
                label: t("experts.emptyGuideStepTemplate"),
                detail: t("experts.emptyGuideStepTemplateDetail"),
              },
            ]}
            primaryAction={{
              label: t("experts.newExpert"),
              onClick: () => void openDefaultCreate(),
              icon: <Plus size={14} />,
              loading: defaultCreating,
              disabled: defaultCreating,
            }}
            secondaryAction={{
              label: t("experts.goToLibrary"),
              onClick: openExpertLibrary,
              icon: <BookOpen size={14} />,
              type: "default",
            }}
          />
        </div>
      );
    }

    return (
      <>
        <div className={styles.gridToolbar}>
          <span className={styles.gridCount}>
            {t("experts.totalAgents", { count: expertAgents.length })}
          </span>
          <div className={styles.gridToolbarRight}>
            <Segmented
              size="small"
              value={viewMode}
              onChange={onViewChange}
              options={[
                {
                  value: "card",
                  label: (
                    <span className={styles.viewModeLabel}>
                      <LayoutGrid size={14} />
                      {t("experts.viewCard", "卡片")}
                    </span>
                  ),
                },
                {
                  value: "table",
                  label: (
                    <span className={styles.viewModeLabel}>
                      <List size={14} />
                      {t("experts.viewTable", "表格")}
                    </span>
                  ),
                },
              ]}
            />
            {refreshButton}
            <button
              className={styles.toolbarBtnPrimary}
              type="button"
              disabled={defaultCreating}
              onClick={() => void openDefaultCreate()}
            >
              <Plus size={14} />
              {t("experts.newExpert")}
            </button>
            <button className={styles.toolbarBtn} onClick={openExpertLibrary}>
              {t("experts.addFromLibrary")}
            </button>
          </div>
        </div>
        {showCardView ? (
          <div className={styles.cardGrid}>
            {expertAgents.map((agent) => (
              <div
                key={agent.agent_id}
                className={
                  newAgentId === agent.agent_id
                    ? styles.agentCardNew
                    : undefined
                }
              >
                <AgentCard
                  agent={agent}
                  iconName={agent.icon_name}
                  iconUrl={agent.icon_url}
                  accentColor={agent.color}
                  publishedExpert={publishedByAgentId[agent.agent_id] ?? null}
                  onPublishedChange={() => {
                    void refreshPublishedExperts();
                  }}
                  onEdit={(id) =>
                    setEditAgent(
                      localAgents.find((a) => a.agent_id === id) ?? null,
                    )
                  }
                  onDeleted={handleDeleted}
                  onStateChange={handleStateChange}
                />
              </div>
            ))}
          </div>
        ) : (
          <AgentExpertsTable
            agents={expertAgents}
            publishedByAgentId={publishedByAgentId}
            onPublishedChange={() => {
              void refreshPublishedExperts();
            }}
            onEdit={(id) =>
              setEditAgent(expertAgents.find((a) => a.agent_id === id) ?? null)
            }
            onDeleted={handleDeleted}
            onStateChange={handleStateChange}
          />
        )}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultCreating,
    expertAgents,
    isMobile,
    newAgentId,
    openDefaultCreate,
    openExpertLibrary,
    publishedByAgentId,
    refreshButton,
    refreshPublishedExperts,
    showCardView,
    t,
  ]);

  const teamsContent = useMemo(() => {
    const selectedCount = selectedTeamIds.size;
    const allSelected =
      teamAgents.length > 0 && selectedCount === teamAgents.length;
    const teamToolbar = (
      <div className={styles.gridToolbar}>
        <span className={styles.gridCount}>
          {teamAgents.length > 0
            ? t("experts.teams.total", { count: teamAgents.length })
            : null}
        </span>
        <div className={styles.gridToolbarRight}>
          {refreshButton}
          {teamAgents.length > 0 &&
            (teamSelectMode ? (
              <div className={styles.teamBatchBar}>
                <span className={styles.teamBatchCount}>
                  {t("experts.teams.batchSelected", { count: selectedCount })}
                </span>
                <button
                  className={styles.toolbarBtn}
                  type="button"
                  onClick={() =>
                    setSelectedTeamIds(
                      allSelected
                        ? new Set()
                        : new Set(teamAgents.map((item) => item.agent_id)),
                    )
                  }
                >
                  {allSelected
                    ? t("experts.teams.batchClear")
                    : t("experts.teams.batchSelectAll")}
                </button>
                <button
                  className={styles.toolbarBtnDanger}
                  type="button"
                  disabled={selectedCount === 0 || batchDeleting}
                  onClick={() => void handleTeamBatchDelete()}
                >
                  <Trash2 size={13} />
                  {t("experts.teams.batchDelete", { count: selectedCount })}
                </button>
                <button
                  className={styles.toolbarBtn}
                  type="button"
                  onClick={exitTeamSelectMode}
                >
                  {t("experts.teams.batchExit")}
                </button>
              </div>
            ) : (
              <button
                className={styles.toolbarBtn}
                type="button"
                onClick={() => {
                  setTeamSelectMode(true);
                  setSelectedTeamIds(new Set());
                }}
              >
                {t("experts.teams.batchSelect")}
              </button>
            ))}
          <button
            className={styles.toolbarBtn}
            type="button"
            onClick={() => setTemplateDrawerOpen(true)}
          >
            {t("experts.teams.templates")}
          </button>
          <button
            className={styles.toolbarBtn}
            type="button"
            onClick={() => void handleSeedDefaults()}
          >
            {t("experts.teams.seedDefaults")}
          </button>
          <button
            className={styles.toolbarBtn}
            type="button"
            onClick={() => setTeamDrawer({ mode: "create" })}
          >
            {t("experts.teams.createOne")}
          </button>
        </div>
      </div>
    );
    if (teamAgents.length === 0) {
      return (
        <>
          {teamToolbar}
          <div
            className={`${styles.emptyLayout}${
              isMobile ? ` ${styles.emptyLayoutMobile}` : ""
            }`}
          >
            <StreamSetupGuide
              className={styles.emptyGuide}
              wide
              plain
              icon={<OctopEmptyMascot />}
              title={t("experts.teams.emptyGuideTitle")}
              description={t("experts.teams.emptyGuideDesc")}
              steps={[
                {
                  label: t("experts.teams.emptyGuideStepWhat"),
                  detail: t("experts.teams.emptyGuideStepWhatDetail"),
                },
                {
                  label: t("experts.teams.emptyGuideStepHow"),
                  detail: t("experts.teams.emptyGuideStepHowDetail"),
                },
                {
                  label: t("experts.teams.emptyGuideStepChat"),
                  detail: t("experts.teams.emptyGuideStepChatDetail"),
                },
              ]}
            />
          </div>
        </>
      );
    }
    return (
      <>
        {teamToolbar}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTeamDragEnd}
        >
          <SortableContext
            items={sortedTeamAgents.map((item) => item.agent_id)}
            strategy={rectSortingStrategy}
            disabled={teamSelectMode}
          >
            <div className={styles.cardGrid}>
              {sortedTeamAgents.map((agent) => (
                <SortableTeamItem
                  key={agent.agent_id}
                  id={agent.agent_id}
                  disabled={teamSelectMode}
                >
                  <TeamCard
                    agent={agent}
                    experts={pickableExperts}
                    selectMode={teamSelectMode}
                    selected={selectedTeamIds.has(agent.agent_id)}
                    onToggleSelect={toggleTeamSelect}
                    onEdit={(id) => {
                      const row = sortedTeamAgents.find(
                        (item) => item.agent_id === id,
                      );
                      if (row) setTeamDrawer({ mode: "edit", team: row });
                    }}
                    onDeleted={handleDeleted}
                    onStateChange={handleStateChange}
                  />
                </SortableTeamItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </>
    );
  }, [
    batchDeleting,
    exitTeamSelectMode,
    handleDeleted,
    handleSeedDefaults,
    handleStateChange,
    handleTeamBatchDelete,
    handleTeamDragEnd,
    isMobile,
    pickableExperts,
    refreshButton,
    selectedTeamIds,
    sensors,
    sortedTeamAgents,
    t,
    teamAgents,
    teamSelectMode,
    toggleTeamSelect,
  ]);

  const libraryContent = useMemo(() => {
    if (expertLoading || publishedExpertLoading) {
      return (
        <div className={styles.loadingState}>
          <Spin />
        </div>
      );
    }
    if (experts.length === 0 && publishedExperts.length === 0) {
      return (
        <div className={styles.emptyState}>
          <OctopEmptyMascot />
          <div className={styles.emptyTitle}>{t("experts.emptyLibrary")}</div>
          <div className={styles.emptyHint}>
            {t("experts.emptyLibraryHint")}
          </div>
          <div className={styles.emptyActions}>{refreshButton}</div>
        </div>
      );
    }
    return (
      <>
        {publishedExperts.length > 0 && (
          <>
            <div className={styles.gridToolbar}>
              <span className={styles.gridCount}>
                {t("experts.published.listTitle", {
                  count: publishedExperts.length,
                })}
              </span>
            </div>
            <p
              style={{
                color: "var(--fn-text-tertiary)",
                fontSize: 13,
                margin: "0 0 12px",
              }}
            >
              {t("experts.published.listHint")}
            </p>
            <div className={styles.cardGrid}>
              {publishedExperts.map((expert) => (
                <PublishedExpertCard
                  key={expert.id}
                  expert={expert}
                  canManage={canManagePublished(expert)}
                  onInstall={(item) =>
                    setCreateSource({ kind: "published", expert: item })
                  }
                  onChanged={refreshPublishedExperts}
                />
              ))}
            </div>
          </>
        )}
        <div className={styles.gridToolbar}>
          <span className={styles.gridCount}>
            {t("experts.totalLibrary", { count: experts.length })}
          </span>
          <div className={styles.gridToolbarRight}>{refreshButton}</div>
        </div>
        {publishedExperts.length === 0 && (
          <p
            style={{
              color: "var(--fn-text-tertiary)",
              fontSize: 13,
              margin: "0 0 12px",
            }}
          >
            {t("experts.published.emptyHint")}
          </p>
        )}
        <div className={styles.cardGrid}>
          {experts.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              lang={lang}
              isInstalled={agentExpertIds.has(expert.id)}
              onCreate={(item) =>
                setCreateSource({ kind: "builtin", expert: item })
              }
            />
          ))}
        </div>
      </>
    );
  }, [
    agentExpertIds,
    expertLoading,
    experts,
    lang,
    publishedExpertLoading,
    publishedExperts,
    refreshButton,
    t,
  ]);

  const marketContent = useMemo(
    () => (
      <ExpertMarketTab
        lang={lang}
        installedExpertIds={agentExpertIds}
        onRequestCreate={(expert) =>
          setCreateSource({ kind: "market", expert })
        }
      />
    ),
    [agentExpertIds, lang],
  );

  return (
    <PageShell.FillTabs
      title={t("pageShell.experts.title")}
      subtitle={t("pageShell.experts.subtitle")}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={[
          {
            key: "teams",
            label: (
              <TabLabel icon={Users}>
                {t("experts.myTeams")}
                <span className={styles.tabBetaBadge}>
                  {t("experts.teams.betaBadge")}
                </span>
              </TabLabel>
            ),
            children: teamsContent,
          },
          {
            key: "my",
            label: (
              <TabLabel icon={GraduationCap}>{t("experts.myExperts")}</TabLabel>
            ),
            children: myExpertsContent,
          },
          {
            key: "library",
            label: (
              <TabLabel icon={BookOpen}>{t("experts.expertLibrary")}</TabLabel>
            ),
            children: libraryContent,
          },
          {
            key: "market",
            label: (
              <TabLabel icon={Store}>{t("experts.expertMarket")}</TabLabel>
            ),
            children: marketContent,
          },
        ]}
      />

      <EditAgentDrawer
        open={!!editAgent}
        agent={editAgent}
        onClose={() => setEditAgent(null)}
        onSaved={handleEditSaved}
      />

      <CreateFromExpertDrawer
        open={!!createSource}
        source={createSource}
        lang={lang}
        onClose={() => setCreateSource(null)}
        onCreated={handleCreated}
      />

      <TeamTemplateDrawer
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        onCreated={() => {
          setTemplateDrawerOpen(false);
          void refreshAgents({ silent: true, force: true });
        }}
      />

      <TeamDrawer
        open={!!teamDrawer}
        mode={teamDrawer?.mode ?? "create"}
        team={teamDrawer?.mode === "edit" ? teamDrawer.team : null}
        experts={pickableExperts}
        onClose={() => setTeamDrawer(null)}
        onSaved={(saved: TeamRecord) => {
          setTeamDrawer(null);
          setActiveTab("teams");
          setLocalAgents((prev) =>
            prev.map((item) =>
              item.agent_id === saved.agent_id
                ? {
                    ...item,
                    name: saved.name,
                    description: saved.description ?? null,
                    default_model: saved.default_model ?? null,
                    color: saved.color ?? item.color,
                    icon_name: saved.icon_name ?? item.icon_name,
                    welcome_message:
                      saved.welcome_message ?? item.welcome_message,
                    member_ids: saved.member_ids,
                  }
                : item,
            ),
          );
          void refreshAgents({ silent: true, force: true });
        }}
      />
    </PageShell.FillTabs>
  );
}
