import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button, Input, Segmented, Spin } from "antd";
import { message } from "@/utils/antdMessage";

import { Download, Layers, RefreshCw, Search } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  expertMarketApi,
  type MarketExpert,
} from "../../../api/modules/expertMarket";
import type { PublishedExpert } from "../../../api/modules/publishedExperts";
import { pickLocale } from "../../../utils/localizedText";
import { iconForName } from "./iconForName";
import type { ExpertSummary } from "./ExpertCard";
import type { CreateFromTemplateSource } from "./CreateFromExpertDrawer";
import styles from "../index.module.less";

interface ExpertMarketTabProps {
  lang: "zh" | "en";
  installedExpertIds: Set<string>;
  onRequestCreate: (source: CreateFromTemplateSource) => void;
  /** Local bundled templates shown under the "预设" scene. */
  presetExperts?: ExpertSummary[];
  /** User-published templates, also under "预设". */
  publishedExperts?: PublishedExpert[];
  /** Bump to jump the scene filter to presets (e.g. from "从预设新建"). */
  focusPresetToken?: number;
}

const SCENE_ALL = "";
const SCENE_PRESET = "__preset__";

type CatalogItem = MarketExpert & { createSource: CreateFromTemplateSource };

function builtinToCatalogItem(expert: ExpertSummary): CatalogItem {
  return {
    id: expert.id,
    slug: expert.id,
    label: expert.label,
    description: expert.description,
    icon_url: expert.icon_url,
    icon_name: expert.icon_name,
    color: expert.color,
    quick_prompts: expert.quick_prompts,
    task_examples: expert.task_examples,
    skill_count: expert.files?.length,
    source: "preset",
    createSource: { kind: "builtin", expert },
  };
}

function publishedToCatalogItem(expert: PublishedExpert): CatalogItem {
  return {
    id: expert.id,
    slug: expert.slug,
    label: { zh: expert.name, en: expert.name },
    description: { zh: expert.description, en: expert.description },
    icon_url: expert.icon_url,
    icon_name: expert.icon_name,
    color: expert.color,
    quick_prompts: expert.quick_prompts?.map((p) => ({
      title: p.title ?? {},
      description: p.description ?? {},
      prompt: p.prompt ?? {},
      color: p.color,
      icon_name: p.icon_name,
    })),
    source: "published",
    createSource: { kind: "published", expert },
  };
}

function marketToCatalogItem(expert: MarketExpert): CatalogItem {
  return {
    ...expert,
    createSource: { kind: "market", expert },
  };
}

function descOf(expert: MarketExpert, lang: "zh" | "en"): string {
  return pickLocale(expert.description, lang) || "";
}

function labelOf(expert: MarketExpert, lang: "zh" | "en"): string {
  return pickLocale(expert.label, lang) || expert.slug;
}

function marketErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err || "");
  if (raw.includes("404") || raw.includes("Not Found")) {
    return fallback;
  }
  return raw || fallback;
}

function sceneLabel(scene: string, t: TFunction): string {
  if (scene === SCENE_PRESET) return t("experts.scenePreset", "预设");
  if (!scene) return t("experts.sceneAll", "全部");
  return t(`experts.scenes.${scene}`, { defaultValue: scene });
}

function promptText(
  prompt: {
    title?: { zh?: string; en?: string };
    description?: { zh?: string; en?: string };
  },
  lang: "zh" | "en",
  field: "title" | "description",
): string {
  return pickLocale(prompt[field], lang) || "";
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function taskExampleTexts(expert: MarketExpert, lang: "zh" | "en"): string[] {
  const raw = expert.task_examples;
  if (!raw) return [];
  const primary = lang === "zh" ? raw.zh : raw.en;
  const fallback = lang === "zh" ? raw.en : raw.zh;
  const picked = primary?.length ? primary : fallback;
  return (picked ?? []).map((item) => item.trim()).filter(Boolean);
}

export default function ExpertMarketTab({
  lang,
  installedExpertIds,
  onRequestCreate,
  presetExperts = [],
  publishedExperts = [],
  focusPresetToken = 0,
}: ExpertMarketTabProps) {
  const { t } = useTranslation();
  const [marketItems, setMarketItems] = useState<MarketExpert[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState(SCENE_ALL);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFlip = useCallback((id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const presetItems = useMemo<CatalogItem[]>(
    () => [
      ...presetExperts.map(builtinToCatalogItem),
      ...publishedExperts.map(publishedToCatalogItem),
    ],
    [presetExperts, publishedExperts],
  );

  const isPresetScene = activeScene === SCENE_PRESET;

  const items = useMemo<CatalogItem[]>(() => {
    const q = keyword.trim().toLowerCase();
    const source = isPresetScene
      ? presetItems
      : marketItems.map(marketToCatalogItem);
    if (!q) return source;
    return source.filter((item) => {
      const label = labelOf(item, lang);
      const desc = descOf(item, lang);
      return label.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }, [isPresetScene, keyword, lang, marketItems, presetItems]);

  const fetchMarket = useCallback(
    async (query = keyword, scene = activeScene, force = false) => {
      if (scene === SCENE_PRESET) {
        setErrorMessage(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (force) setRefreshing(true);
      else setLoading(true);
      try {
        const resp = await expertMarketApi.list(
          query,
          scene === SCENE_PRESET ? "" : scene,
        );
        setMarketItems(resp?.items ?? []);
        if (Array.isArray(resp?.scenes) && resp.scenes.length > 0) {
          setScenes(resp.scenes);
        }
        setErrorMessage(null);
      } catch (err) {
        const msg = marketErrorMessage(err, t("experts.marketBackendMissing"));
        setErrorMessage(msg);
        message.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeScene, keyword, t],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const scene = keyword.trim() ? SCENE_ALL : activeScene;
      void fetchMarket(keyword, scene);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, activeScene, fetchMarket]);

  useEffect(() => {
    if (focusPresetToken > 0) setActiveScene(SCENE_PRESET);
  }, [focusPresetToken]);

  const openCreate = useCallback(
    (item: CatalogItem) => {
      onRequestCreate(item.createSource);
    },
    [onRequestCreate],
  );

  const totalText = useMemo(
    () =>
      isPresetScene
        ? t("experts.totalPresets", { count: items.length })
        : t("experts.totalMarket", { count: items.length }),
    [isPresetScene, items.length, t],
  );

  const sceneOptions = useMemo(
    () => [
      { value: SCENE_ALL, label: sceneLabel(SCENE_ALL, t) },
      { value: SCENE_PRESET, label: sceneLabel(SCENE_PRESET, t) },
      ...scenes.map((scene) => ({
        value: scene,
        label: sceneLabel(scene, t),
      })),
    ],
    [scenes, t],
  );

  if (loading && marketItems.length === 0 && !isPresetScene) {
    return (
      <div className={styles.loadingState}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.marketContainer}>
      <div className={styles.paneHeader}>
        <div className={styles.gridToolbar}>
          <span className={styles.gridCount}>{totalText}</span>
          <div
            className={`${styles.gridToolbarRight} ${styles.marketToolbarRight}`}
          >
            <Input
              className={styles.marketSearch}
              prefix={<Search size={14} />}
              allowClear
              value={keyword}
              placeholder={t("experts.marketSearchPlaceholder")}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              className={styles.toolbarIconBtn}
              disabled={refreshing}
              onClick={() => void fetchMarket(keyword, activeScene, true)}
              type="button"
            >
              <RefreshCw
                size={14}
                className={refreshing ? styles.spinning : undefined}
              />
            </button>
          </div>
        </div>

        {!keyword && sceneOptions.length > 1 && (
          <div className={styles.marketSceneTabsWrap}>
            <Segmented
              size="large"
              value={activeScene}
              onChange={(v) => setActiveScene(String(v))}
              options={sceneOptions}
              className={styles.marketSceneTabs}
            />
          </div>
        )}
      </div>

      <div className={styles.paneScroll}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <Layers size={48} style={{ color: "var(--fn-text-tertiary)" }} />
            <div className={styles.emptyTitle}>
              {errorMessage
                ? t("experts.marketLoadFailed")
                : isPresetScene
                ? t("experts.emptyPresets")
                : t("experts.emptyMarket")}
            </div>
            <div className={styles.emptyHint}>
              {errorMessage ||
                (isPresetScene
                  ? t("experts.emptyPresetsHint")
                  : t("experts.emptyMarketHint"))}
            </div>
            {errorMessage && (
              <div className={styles.emptyActions}>
                <button
                  className={styles.emptyAction}
                  onClick={() => void fetchMarket(keyword, activeScene, true)}
                  type="button"
                >
                  {t("common.refresh")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {items.map((expert) => {
              const installed = installedExpertIds.has(expert.id);
              const label = labelOf(expert, lang);
              const desc = descOf(expert, lang);
              const accent = expert.color || "#6366f1";
              const flipped = flippedIds.has(expert.id);
              const examples = taskExampleTexts(expert, lang);
              const footer = (
                <div className={styles.talentCardFooter}>
                  <Button
                    block
                    type="primary"
                    icon={<Download size={15} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreate(expert);
                    }}
                  >
                    {installed
                      ? t("experts.createAgainFromMarket")
                      : t("experts.createFromMarket")}
                  </Button>
                  <Button
                    block
                    icon={<RefreshCw size={15} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlip(expert.id);
                    }}
                  >
                    {t("experts.flipToResume")}
                  </Button>
                </div>
              );
              return (
                <div
                  key={expert.id}
                  className={`${styles.talentCard}${
                    flipped ? ` ${styles.talentCardFlipped}` : ""
                  }`}
                  style={
                    {
                      "--expert-accent": accent,
                    } as CSSProperties
                  }
                >
                  <div className={styles.talentCardInner}>
                    {/* Front — resume snapshot for the hiring manager */}
                    <div className={styles.talentCardFace}>
                      <div className={styles.talentCardBody}>
                        <div className={styles.talentProfileHead}>
                          <div className={styles.talentAvatar}>
                            {expert.icon_url ? (
                              <img src={expert.icon_url} alt="" />
                            ) : (
                              iconForName(expert.icon_name || "zap", 28)
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3 className={styles.talentName}>{label}</h3>
                            <p className={styles.talentRoleLine}>
                              {expert.sub_scene ||
                                (expert.scene
                                  ? sceneLabel(expert.scene, t)
                                  : t("experts.presetTemplate"))}
                            </p>
                          </div>
                        </div>
                        <p className={styles.talentOneLiner}>
                          {desc || t("experts.noMarketDescription")}
                        </p>
                        <div className={styles.talentCanDoBlock}>
                          <div className={styles.talentCanDoLabel}>
                            {t("experts.resumeSkills")}
                          </div>
                          <div className={styles.talentSkillTags}>
                            {(expert.skill_slugs ?? [])
                              .slice(0, 6)
                              .map((slug) => (
                                <span
                                  key={slug}
                                  className={styles.talentSkillTag}
                                >
                                  {humanizeSlug(slug)}
                                </span>
                              ))}
                            {(expert.skill_slugs ?? []).length === 0 && (
                              <div className={styles.talentCanDoItem}>
                                {t("experts.resumeSkillsEmpty")}
                              </div>
                            )}
                          </div>
                        </div>
                        {expert.quick_prompts &&
                          expert.quick_prompts.length > 0 && (
                            <div className={styles.talentCanDoBlock}>
                              <div className={styles.talentCanDoLabel}>
                                {t("experts.resumeScenarios")}
                              </div>
                              {expert.quick_prompts
                                .slice(0, 2)
                                .map((card, idx) => (
                                  <div
                                    key={`${idx}`}
                                    className={styles.talentCanDoItem}
                                  >
                                    {promptText(card, lang, "title")}
                                    {promptText(card, lang, "description")
                                      ? ` — ${promptText(
                                          card,
                                          lang,
                                          "description",
                                        )}`
                                      : ""}
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                      {footer}
                    </div>

                    {/* Back — fuller CV */}
                    <div
                      className={`${styles.talentCardFace} ${styles.talentCardBack}`}
                    >
                      <div className={styles.talentCardBody}>
                        <div>
                          <div className={styles.talentResumeTitle}>
                            {t("experts.resumeRole")}
                          </div>
                          <p className={styles.talentResumeText}>
                            {desc || t("experts.noMarketDescription")}
                          </p>
                        </div>
                        <div>
                          <div className={styles.talentResumeTitle}>
                            {t("experts.marketTaskExamples")}
                          </div>
                          {examples.length > 0 ? (
                            <ul className={styles.talentResumeList}>
                              {examples.map((text, idx) => (
                                <li
                                  key={`${idx}`}
                                  className={styles.talentResumeItem}
                                >
                                  {text}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={styles.talentResumeText}>
                              {t("experts.marketTaskExamplesEmpty")}
                            </p>
                          )}
                        </div>
                        <div>
                          <div className={styles.talentResumeTitle}>
                            {t("experts.resumeSkills")}
                          </div>
                          <div className={styles.talentSkillTags}>
                            {(expert.skill_slugs ?? []).map((slug) => (
                              <span
                                key={slug}
                                className={styles.talentSkillTag}
                              >
                                {humanizeSlug(slug)}
                              </span>
                            ))}
                            {(expert.skill_slugs ?? []).length === 0 && (
                              <span className={styles.talentResumeText}>
                                {t("experts.resumeSkillsEmpty")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.talentResumeMeta}>
                          {expert.scene && (
                            <span>{sceneLabel(expert.scene, t)}</span>
                          )}
                          {expert.sub_scene && (
                            <span>· {expert.sub_scene}</span>
                          )}
                          {expert.source && <span>· {expert.source}</span>}
                        </div>
                      </div>
                      {footer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
