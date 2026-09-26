/**
 * Company Assets hub — one place to browse shared resources
 * (channels, connectors, skill packages, knowledge bases).
 * Tools / prompt libraries are intentionally out of scope for now.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spin, Empty } from "antd";
import {
  ChevronRight,
  Database,
  Link2,
  Package,
  Waypoints,
} from "lucide-react";
import PageShell from "../../layouts/PageShell";
import { channelApi } from "../../api/modules/channel";
import { connectorsApi } from "../../api/modules/connectors";
import { skillPackagesApi } from "../../api/modules/skillPackages";
import { knowledgeBasesApi } from "../../api/modules/knowledgeBases";
import { navAllowed } from "../../utils/permissions";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import styles from "./index.module.less";

type AssetKind =
  | "channels"
  | "connectors"
  | "skill-packages"
  | "knowledge-bases";

interface AssetCardDef {
  kind: AssetKind;
  navKey: "channels" | "connectors" | "skill-packages" | "knowledge-bases";
  path: string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  countKey: string;
}

const CARDS: AssetCardDef[] = [
  {
    kind: "channels",
    navKey: "channels",
    path: "/personalization/channels",
    icon: <Waypoints size={22} strokeWidth={1.8} />,
    titleKey: "nav.channels",
    descKey: "assets.descChannels",
    countKey: "assets.countChannels",
  },
  {
    kind: "connectors",
    navKey: "connectors",
    path: "/connectors",
    icon: <Link2 size={22} strokeWidth={1.8} />,
    titleKey: "nav.connectors",
    descKey: "assets.descConnectors",
    countKey: "assets.countConnectors",
  },
  {
    kind: "skill-packages",
    navKey: "skill-packages",
    path: "/skill-packages",
    icon: <Package size={22} strokeWidth={1.8} />,
    titleKey: "nav.skillPackages",
    descKey: "assets.descSkillPackages",
    countKey: "assets.countSkillPackages",
  },
  {
    kind: "knowledge-bases",
    navKey: "knowledge-bases",
    path: "/knowledge-bases",
    icon: <Database size={22} strokeWidth={1.8} />,
    titleKey: "nav.knowledgeBases",
    descKey: "assets.descKnowledgeBases",
    countKey: "assets.countKnowledgeBases",
  },
];

function countEnabledChannels(config: unknown): number {
  if (!config || typeof config !== "object") return 0;
  return Object.values(config as Record<string, unknown>).filter((row) => {
    if (!row || typeof row !== "object") return false;
    return (row as { enabled?: boolean }).enabled === true;
  }).length;
}

export default function AssetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<AssetKind, number | null>>({
    channels: null,
    connectors: null,
    "skill-packages": null,
    "knowledge-bases": null,
  });

  const visibleCards = useMemo(
    () => CARDS.filter((card) => navAllowed(currentUser, card.navKey)),
    [currentUser],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const next: Record<AssetKind, number | null> = {
        channels: null,
        connectors: null,
        "skill-packages": null,
        "knowledge-bases": null,
      };
      await Promise.all([
        navAllowed(currentUser, "channels")
          ? channelApi
              .listChannels()
              .then((cfg) => {
                next.channels = countEnabledChannels(cfg);
              })
              .catch(() => {})
          : null,
        navAllowed(currentUser, "connectors")
          ? connectorsApi
              .listInstances()
              .then((rows) => {
                next.connectors = rows.length;
              })
              .catch(() => {})
          : null,
        navAllowed(currentUser, "skill-packages")
          ? skillPackagesApi
              .list()
              .then((rows) => {
                next["skill-packages"] = rows.length;
              })
              .catch(() => {})
          : null,
        navAllowed(currentUser, "knowledge-bases")
          ? knowledgeBasesApi
              .list()
              .then((rows) => {
                next["knowledge-bases"] = rows.length;
              })
              .catch(() => {})
          : null,
      ]);
      if (!cancelled) {
        setCounts(next);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <PageShell title={t("assets.title")} subtitle={t("assets.subtitle")}>
      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : visibleCards.length === 0 ? (
        <Empty description={t("assets.empty")} />
      ) : (
        <div className={styles.grid}>
          {visibleCards.map((card) => {
            const count = counts[card.kind];
            return (
              <button
                key={card.kind}
                type="button"
                className={styles.card}
                onClick={() => navigate(card.path)}
              >
                <div className={styles.cardIcon}>{card.icon}</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    <span className={styles.cardTitle}>{t(card.titleKey)}</span>
                    <span className={styles.cardCount}>
                      {count === null
                        ? "—"
                        : t(card.countKey, { count: count ?? 0 })}
                    </span>
                  </div>
                  <p className={styles.cardDesc}>{t(card.descKey)}</p>
                </div>
                <ChevronRight size={16} className={styles.cardArrow} />
              </button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
