import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Input,
  Segmented,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { message } from "@/utils/antdMessage";

import {
  Download,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { authApi, type OctopUser } from "../../api/modules/auth";
import { skillPackagesApi } from "../../api/modules/skillPackages";
import type {
  SkillPackage,
  SkillPackageDetail,
  SkillPackageSkill,
  SkillPackageSkillDetail,
} from "../../api/types/skillPackage";
import { CardSkeleton } from "../../components/Skeleton";
import { EmptyState, OctopEmptyMascot } from "../../components/EmptyState";
import StreamSetupGuide from "../../components/StreamSetupGuide/StreamSetupGuide";
import { useCardTableView } from "../../hooks/useCardTableView";
import { useIsMobile } from "../../hooks/useIsMobile";
import PageShell from "../../layouts/PageShell";
import {
  apiErrorMessage,
  isNotFoundApiError,
  parseApiError,
} from "../../utils/apiError";
import {
  SkillDrawer,
  type SkillFormValues,
} from "../Agent/Skills/components/SkillDrawer";
import {
  SkillImportModal,
  type ZipImportSummary,
} from "../Agent/Skills/components/SkillImportModal";
import SkillHubTab from "../Agent/Skills/components/SkillHubTab";
import skillStyles from "../Agent/Skills/index.module.less";
import type { ParsedZipSkill } from "../Agent/Skills/components/parseSkillZip";
import {
  EXPERT_ICON_NAMES,
  iconForName,
} from "../Experts/components/iconForName";
import { showConfirmModal } from "../../utils/confirmModal";
import { createDetailRequestGate } from "../../utils/detailRequestGate";
import { PackageIcon } from "./PackageIcon";
import { PackageSkillCard } from "./PackageSkillCard";
import PackageSkillsTable from "./PackageSkillsTable";
import { SkillsetFromHubDrawer } from "./SkillsetFromHubDrawer";
import styles from "./index.module.less";

type PackageFormValues = {
  name: string;
  description?: string;
  icon_name?: string;
  icon_url?: string;
};

const EMPTY_SKILL = "---\nname: \ndescription: \n---\n\n";
/** Default folder used when creating/importing skills from the library root. */
const LOOSE_PACKAGE_NAME = "我的技能";
const SKILL_URL_PREFIXES = [
  "https://skills.sh/",
  "https://clawhub.ai/",
  "https://skillsmp.com/",
  "https://github.com/",
];

function canMutatePackage(
  item: Pick<SkillPackage, "created_by" | "can_write">,
  user: OctopUser | null,
): boolean {
  if (typeof item.can_write === "boolean") {
    return item.can_write;
  }
  return Boolean(
    user && (user.role === "admin" || item.created_by === String(user.id)),
  );
}

function PackageIconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value?: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.iconPicker}>
      {EXPERT_ICON_NAMES.map((name) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            className={`${styles.iconPickerItem}${
              selected ? ` ${styles.iconPickerItemActive}` : ""
            }`}
            onClick={() => onChange?.(selected ? undefined : name)}
            title={t(`experts.iconLabels.${name}`, { defaultValue: name })}
          >
            <span className={styles.iconPickerGlyph}>
              {iconForName(name, 18)}
            </span>
            <span className={styles.iconPickerLabel}>
              {t(`experts.iconLabels.${name}`, { defaultValue: name })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function SkillPackagesPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { viewMode, setViewMode, showCardView } = useCardTableView("card");
  const [packages, setPackages] = useState<SkillPackage[]>([]);
  const [selected, setSelected] = useState<SkillPackageDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Skills flattened for the library root (folder/file view). */
  const [allSkills, setAllSkills] = useState<
    (SkillPackageSkill & { package_name: string })[]
  >([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [user, setUser] = useState<OctopUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [packageDrawerOpen, setPackageDrawerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [skillsetHubOpen, setSkillsetHubOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] =
    useState<SkillPackageSkillDetail | null>(null);
  const [packageForm] = Form.useForm<PackageFormValues>();
  const [skillForm] = Form.useForm<SkillFormValues>();
  const iconName = Form.useWatch("icon_name", packageForm);
  const iconUrl = Form.useWatch("icon_url", packageForm);
  const detailRequestGate = useRef(createDetailRequestGate());
  const initialLoadDone = useRef(false);

  const loadPackages = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent || initialLoadDone.current);
      if (!silent) setLoading(true);
      try {
        const rows = await skillPackagesApi.list();
        setPackages(rows);
        setSelected((current) =>
          current && !rows.some((row) => row.id === current.id)
            ? null
            : current,
        );
        setSelectedId((currentId) =>
          currentId && !rows.some((row) => row.id === currentId)
            ? null
            : currentId,
        );
        initialLoadDone.current = true;
      } catch (error) {
        message.error(apiErrorMessage(error, t("skillPackages.loadFailed"), t));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t],
  );

  /** Flatten skills across packages for the root folder/file view. */
  const loadAllSkills = useCallback(async (rows: SkillPackage[]) => {
    setLibraryLoading(true);
    try {
      const details = await Promise.all(
        rows.map((row) => skillPackagesApi.get(row.id).catch(() => null)),
      );
      const flattened: (SkillPackageSkill & { package_name: string })[] = [];
      for (const detail of details) {
        if (!detail) continue;
        for (const skill of detail.skills) {
          flattened.push({ ...skill, package_name: detail.name });
        }
      }
      setAllSkills(flattened);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (packageId: string) => {
      const requestId = detailRequestGate.current.begin();
      setDetailLoading(true);
      try {
        const detail = await skillPackagesApi.get(packageId);
        if (detailRequestGate.current.isCurrent(requestId)) {
          setSelected(detail);
          setSelectedId(detail.id);
        }
      } catch (error) {
        if (!detailRequestGate.current.isCurrent(requestId)) {
          return;
        }
        if (isNotFoundApiError(error)) {
          setSelected(null);
          setSelectedId(null);
          return;
        }
        message.error(apiErrorMessage(error, t("skillPackages.loadFailed"), t));
      } finally {
        if (detailRequestGate.current.isCurrent(requestId)) {
          setDetailLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    void loadPackages();
    void authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null));
  }, [loadPackages]);

  useEffect(() => {
    if (packages.length === 0) {
      setAllSkills([]);
      return;
    }
    void loadAllSkills(packages);
  }, [packages, loadAllSkills]);

  const canMutate = Boolean(selected && canMutatePackage(selected, user));

  const enterPackage = (item: SkillPackage) => {
    if (item.id !== selectedId) {
      setSelectedId(item.id);
      void loadDetail(item.id);
    }
  };

  const backToLibraryRoot = () => {
    detailRequestGate.current.begin();
    setSelected(null);
    setSelectedId(null);
    setDetailLoading(false);
  };

  /** Resolve/create the default folder used for root-level skill actions. */
  const ensureLoosePackage = async (): Promise<SkillPackageDetail | null> => {
    const existing = packages.find((row) => row.name === LOOSE_PACKAGE_NAME);
    if (existing) {
      return skillPackagesApi.get(existing.id).catch(() => null);
    }
    try {
      const created = await skillPackagesApi.create({
        name: LOOSE_PACKAGE_NAME,
        description: t("skillPackages.loosePackageDesc"),
      });
      await loadPackages({ silent: true });
      return created;
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.saveFailed"), t));
      return null;
    }
  };

  /** Package used for skill create/import when browsing the library root. */
  const resolveSkillTargetPackage =
    async (): Promise<SkillPackageDetail | null> => {
      if (selected) return selected;
      return ensureLoosePackage();
    };

  const refreshSelected = async () => {
    if (!selectedId) {
      await loadPackages({ silent: true });
      return;
    }
    const packageId = selectedId;
    await Promise.all([loadDetail(packageId), loadPackages({ silent: true })]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSelected();
    } finally {
      setRefreshing(false);
    }
  };

  const openCreatePackage = () => {
    setEditingPackageId(null);
    packageForm.setFieldsValue({
      name: "",
      description: "",
      icon_name: undefined,
      icon_url: "",
    });
    setPackageDrawerOpen(true);
  };

  const openEditPackage = (item: SkillPackage) => {
    setEditingPackageId(item.id);
    packageForm.setFieldsValue({
      name: item.name,
      description: item.description,
      icon_name: item.icon_name,
      icon_url: item.icon_url,
    });
    setPackageDrawerOpen(true);
  };

  const savePackage = async () => {
    const values = await packageForm.validateFields();
    const payload = {
      ...values,
      icon_url: values.icon_url?.trim() || undefined,
    };
    try {
      const next = editingPackageId
        ? await skillPackagesApi.update(editingPackageId, payload)
        : await skillPackagesApi.create(payload);
      setPackageDrawerOpen(false);
      await loadPackages({ silent: true });
      setSelected(next);
      setSelectedId(next.id);
      message.success(
        t(editingPackageId ? "skillPackages.updated" : "skillPackages.created"),
      );
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.saveFailed"), t));
    }
  };

  const deletePackage = async (item: SkillPackage) => {
    const deletedId = item.id;
    const deletingSelected = deletedId === selectedId;
    if (deletingSelected) {
      detailRequestGate.current.begin();
      setSelected(null);
      setSelectedId(null);
      setDetailLoading(false);
    }
    try {
      await skillPackagesApi.delete(deletedId);
      const rows = await skillPackagesApi.list();
      setPackages(rows);
      initialLoadDone.current = true;
      if (deletingSelected) {
        if (rows.length > 0) {
          await loadDetail(rows[0].id);
        }
      }
      message.success(t("skillPackages.deleted"));
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.deleteFailed"), t));
    }
  };

  const confirmDeletePackage = (item: SkillPackage) => {
    showConfirmModal({
      title: t("skillPackages.deletePackageConfirm"),
      content: t("skillPackages.deletePackageMountedHint"),
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true },
      onOk: () => deletePackage(item),
    });
  };

  const packageMenuItems = (item: SkillPackage): MenuProps["items"] => [
    {
      key: "edit",
      icon: <Pencil size={14} />,
      label: t("common.edit"),
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        openEditPackage(item);
      },
    },
    {
      key: "delete",
      icon: <Trash2 size={14} />,
      label: t("common.delete"),
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDeletePackage(item);
      },
    },
  ];

  const openCreateSkill = async () => {
    const target = await resolveSkillTargetPackage();
    if (!target) return;
    setSelected(target);
    setSelectedId(target.id);
    setEditingSkill(null);
    skillForm.setFieldsValue({
      name: "",
      description: "",
      body: "",
      content: EMPTY_SKILL,
    });
    setDrawerOpen(true);
  };

  const openEditSkill = async (packageId: string, slug: string) => {
    try {
      const detail = await skillPackagesApi.getSkill(packageId, slug);
      if (detail.package_id && detail.package_id !== selectedId) {
        const pkg = await skillPackagesApi
          .get(detail.package_id)
          .catch(() => null);
        if (pkg) {
          setSelected(pkg);
          setSelectedId(pkg.id);
        }
      }
      setEditingSkill(detail);
      skillForm.setFieldsValue({
        name: detail.slug,
        description: detail.description,
        body: detail.body,
        content: detail.raw,
      });
      setDrawerOpen(true);
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.loadFailed"), t));
    }
  };

  const saveSkill = async (values: SkillFormValues) => {
    const targetId = editingSkill?.package_id || selected?.id;
    if (!targetId) return;
    try {
      if (editingSkill) {
        await skillPackagesApi.updateSkill(targetId, editingSkill.slug, {
          content: values.content,
        });
      } else {
        await skillPackagesApi.createSkill(targetId, {
          name: values.name,
          content: values.content,
        });
      }
      setDrawerOpen(false);
      await refreshSelected();
      message.success(t("skillPackages.skillSaved"));
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.saveFailed"), t));
    }
  };

  const deleteSkill = async (packageId: string, slug: string) => {
    try {
      await skillPackagesApi.deleteSkill(packageId, slug);
      await refreshSelected();
      message.success(t("skillPackages.skillDeleted"));
    } catch (error) {
      message.error(apiErrorMessage(error, t("skillPackages.deleteFailed"), t));
    }
  };

  const confirmImport = async (
    bundleUrl: string,
    options?: { overwrite?: boolean },
  ): Promise<boolean> => {
    if (importing) return false;
    const target = await resolveSkillTargetPackage();
    if (!target) return false;
    setSelected(target);
    setSelectedId(target.id);
    setImporting(true);
    try {
      await skillPackagesApi.importSkill(target.id, {
        bundle_url: bundleUrl,
        overwrite: Boolean(options?.overwrite),
      });
      await refreshSelected();
      message.success(t("skills.importSuccess"));
      return true;
    } catch (error) {
      message.error(apiErrorMessage(error, t("skills.importFailed"), t));
      return false;
    } finally {
      setImporting(false);
    }
  };

  const confirmImportZip = async (
    skillsToImport: ParsedZipSkill[],
    options?: { overwrite?: boolean },
  ): Promise<ZipImportSummary | false> => {
    if (importing) return false;
    const target = await resolveSkillTargetPackage();
    if (!target) return false;
    setSelected(target);
    setSelectedId(target.id);
    const overwrite = Boolean(options?.overwrite);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    setImporting(true);
    try {
      for (const skill of skillsToImport) {
        try {
          await skillPackagesApi.createSkill(target.id, {
            name: skill.slug,
            files: skill.files.map((file) => ({
              path: file.path,
              content_base64: file.contentBase64,
            })),
            overwrite,
          });
          imported += 1;
        } catch (error) {
          const code = parseApiError(error)?.code;
          if (!overwrite && code === "SKILL_ALREADY_EXISTS") {
            skipped += 1;
            continue;
          }
          failed += 1;
        }
      }
      await refreshSelected();
      message.success(
        t("skills.zipImportSummary", { imported, skipped, failed }),
      );
      return { imported, skipped, failed };
    } finally {
      setImporting(false);
    }
  };

  const skills = selected?.skills ?? [];
  const visibleSkills: (SkillPackageSkill & { package_name?: string })[] =
    selected ? skills : allSkills;

  const skillCards = (
    rows: (SkillPackageSkill & { package_name?: string })[],
  ) =>
    showCardView ? (
      <div className={skillStyles.skillsGrid}>
        {rows.map((skill) => (
          <PackageSkillCard
            key={`${skill.package_id}-${skill.slug}`}
            skill={skill}
            canMutate={
              canMutatePackage(
                {
                  created_by: selected?.created_by ?? "",
                  can_write: selected?.can_write,
                },
                user,
              ) || !selected
            }
            onClick={() => void openEditSkill(skill.package_id, skill.slug)}
            onDelete={
              !selected || canMutate
                ? () => void deleteSkill(skill.package_id, skill.slug)
                : undefined
            }
          />
        ))}
      </div>
    ) : (
      <PackageSkillsTable
        skills={rows}
        canMutate={canMutate || !selected}
        onView={(skill) => void openEditSkill(skill.package_id, skill.slug)}
        onDelete={
          !selected || canMutate
            ? (skill) => void deleteSkill(skill.package_id, skill.slug)
            : undefined
        }
      />
    );

  const folderCards = (
    <div className={styles.folderGrid}>
      {packages.map((item) => (
        <div
          key={item.id}
          className={`${styles.folderCard}${
            item.id === selectedId ? ` ${styles.folderCardActive}` : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => enterPackage(item)}
          onKeyDown={(e) => e.key === "Enter" && enterPackage(item)}
        >
          <div className={styles.folderIcon}>
            <PackageIcon
              iconUrl={item.icon_url}
              iconName={item.icon_name}
              size={36}
            />
          </div>
          <div className={styles.folderMeta}>
            <div className={styles.folderName} title={item.name}>
              {item.name}
            </div>
            <div className={styles.folderDesc} title={item.description || ""}>
              {item.description ||
                t("skillPackages.packageFolderHint", {
                  count: item.skill_count,
                })}
            </div>
          </div>
          {canMutatePackage(item, user) ? (
            <Dropdown
              menu={{ items: packageMenuItems(item) }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button
                type="button"
                className={styles.folderMoreBtn}
                aria-label={t("common.more")}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal size={15} />
              </button>
            </Dropdown>
          ) : null}
        </div>
      ))}
    </div>
  );

  const libraryBody = (
    <div className={styles.splitLayout}>
      <aside className={styles.packagesPane}>
        <div className={styles.paneHeader}>
          <div className={styles.paneTitle}>
            {t("skillPackages.rootPackages")}
            <span className={styles.sectionCount}>{packages.length}</span>
          </div>
          <div className={styles.paneActions}>
            <Tooltip title={t("skillPackages.fromSkillHub")}>
              <button
                type="button"
                className={skillStyles.toolbarIconBtn}
                onClick={() => setSkillsetHubOpen(true)}
                aria-label={t("skillPackages.fromSkillHub")}
              >
                <Store size={14} />
              </button>
            </Tooltip>
            <button
              type="button"
              className={skillStyles.toolbarBtnPrimary}
              onClick={openCreatePackage}
            >
              <Plus size={14} />
              {t("skillPackages.createPackage")}
            </button>
          </div>
        </div>
        <div className={styles.paneBody}>
          {loading && packages.length === 0 ? (
            <CardSkeleton count={3} />
          ) : (
            folderCards
          )}
        </div>
      </aside>

      <section className={styles.skillsPane}>
        <div className={styles.paneHeader}>
          <div className={styles.paneTitle}>
            {selected ? selected.name : t("skillPackages.rootSkills")}
            <span className={styles.sectionCount}>{visibleSkills.length}</span>
            {selected ? (
              <button
                type="button"
                className={styles.paneClearBtn}
                onClick={backToLibraryRoot}
              >
                {t("skillPackages.allSkills")}
              </button>
            ) : null}
          </div>
          <div className={styles.paneActions}>
            <Segmented
              size="small"
              value={viewMode}
              onChange={(value) =>
                setViewMode(value === "table" ? "table" : "card")
              }
              options={[
                {
                  value: "card",
                  label: (
                    <span className={skillStyles.viewModeLabel}>
                      <LayoutGrid size={14} />
                      {t("experts.viewCard")}
                    </span>
                  ),
                },
                {
                  value: "table",
                  label: (
                    <span className={skillStyles.viewModeLabel}>
                      <ListIcon size={14} />
                      {t("experts.viewTable")}
                    </span>
                  ),
                },
              ]}
            />
            <Tooltip title={t("common.refresh")}>
              <button
                type="button"
                className={skillStyles.toolbarIconBtn}
                onClick={() => void handleRefresh()}
                disabled={refreshing || detailLoading || libraryLoading}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? skillStyles.spinning : undefined}
                />
              </button>
            </Tooltip>
            <button
              type="button"
              className={skillStyles.toolbarBtn}
              onClick={() => setHubOpen(true)}
            >
              <Store size={14} />
              {t("skills.tencentSkillHub")}
            </button>
            <button
              type="button"
              className={skillStyles.toolbarBtn}
              onClick={() => setImportModalOpen(true)}
            >
              <Download size={14} />
              {t("skills.importSkills")}
            </button>
            <button
              type="button"
              className={skillStyles.toolbarBtnPrimary}
              onClick={() => void openCreateSkill()}
            >
              <Plus size={14} />
              {t("skillPackages.createSkill")}
            </button>
          </div>
        </div>
        <div className={styles.paneBody}>
          {detailLoading || libraryLoading ? (
            <CardSkeleton count={6} />
          ) : visibleSkills.length === 0 ? (
            <EmptyState
              variant="mascot"
              title={t("skillPackages.emptySkills")}
              description={t("skillPackages.subtitle")}
              actionLabel={t("skillPackages.createSkill")}
              onAction={() => void openCreateSkill()}
            />
          ) : (
            skillCards(visibleSkills)
          )}
        </div>
      </section>
    </div>
  );

  const showEmptyGuide = !loading && packages.length === 0;

  return (
    <PageShell
      title={t("skillPackages.title")}
      subtitle={isMobile ? undefined : t("skillPackages.subtitle")}
      fill
    >
      {loading && packages.length === 0 ? (
        <div className={styles.emptyLayout}>
          <div className={styles.centered}>
            <Spin />
          </div>
        </div>
      ) : showEmptyGuide ? (
        <div className={styles.emptyLayout}>
          <StreamSetupGuide
            className={styles.emptyGuide}
            wide
            plain
            icon={<OctopEmptyMascot />}
            title={t("skillPackages.emptyGuideTitle")}
            description={t("skillPackages.emptyGuideDesc")}
            steps={[
              {
                label: t("skillPackages.emptyGuideStepWhat"),
                detail: t("skillPackages.emptyGuideStepWhatDetail"),
              },
              {
                label: t("skillPackages.emptyGuideStepHow"),
                detail: t("skillPackages.emptyGuideStepHowDetail"),
              },
              {
                label: t("skillPackages.emptyGuideStepShare"),
                detail: t("skillPackages.emptyGuideStepShareDetail"),
              },
            ]}
            primaryAction={{
              label: t("skillPackages.createPackage"),
              onClick: openCreatePackage,
              icon: <Plus size={14} />,
            }}
            secondaryAction={{
              label: t("skillPackages.fromSkillHub"),
              onClick: () => setSkillsetHubOpen(true),
              icon: <Store size={14} />,
              type: "default",
            }}
          />
        </div>
      ) : (
        <div className={styles.libraryLayout}>{libraryBody}</div>
      )}

      <Drawer
        title={t(
          editingPackageId
            ? "skillPackages.editPackage"
            : "skillPackages.createPackage",
        )}
        open={packageDrawerOpen}
        onClose={() => setPackageDrawerOpen(false)}
        width={isMobile ? "100%" : 480}
        destroyOnHidden
        className={styles.packageDrawer}
        footer={
          <div className={styles.drawerFooter}>
            <Button onClick={() => setPackageDrawerOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="primary" onClick={() => void savePackage()}>
              {t(editingPackageId ? "common.save" : "common.create")}
            </Button>
          </div>
        }
      >
        {!editingPackageId ? (
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            {t("skillPackages.createPackageHint")}
          </Typography.Paragraph>
        ) : null}
        <Form
          form={packageForm}
          layout="vertical"
          className={styles.packageForm}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={t("skillPackages.packageName")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("skillPackages.packageNameRequired"),
              },
            ]}
          >
            <Input
              autoFocus
              placeholder={t("skillPackages.packageNamePlaceholder")}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={t("skillPackages.packageDescription")}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder={t("skillPackages.packageDescriptionPlaceholder")}
            />
          </Form.Item>
          <Form.Item name="icon_name" label={t("skillPackages.iconName")}>
            <PackageIconPicker />
          </Form.Item>
          <Form.Item name="icon_url" label={t("skillPackages.iconUrl")}>
            <Input
              type="url"
              placeholder={t("skillPackages.iconUrlPlaceholder")}
              suffix={
                <span className={styles.iconPreview}>
                  <PackageIcon
                    iconUrl={iconUrl}
                    iconName={iconName}
                    size={18}
                    className={styles.iconPreviewImage}
                  />
                </span>
              }
            />
          </Form.Item>
        </Form>
      </Drawer>

      <SkillImportModal
        open={importModalOpen}
        importing={importing}
        onClose={() => setImportModalOpen(false)}
        onImportUrl={confirmImport}
        onImportZip={confirmImportZip}
        urlPrefixes={SKILL_URL_PREFIXES}
      />

      <SkillsetFromHubDrawer
        open={skillsetHubOpen}
        onClose={() => setSkillsetHubOpen(false)}
        onCreated={async (pkg) => {
          await loadPackages({ silent: true });
          setSelected(pkg);
          setSelectedId(pkg.id);
          setSkillsetHubOpen(false);
          message.success(t("skillPackages.created"));
        }}
      />

      <SkillDrawer
        open={drawerOpen}
        editingSkill={
          editingSkill
            ? {
                slug: editingSkill.slug,
                name: editingSkill.name,
                description: editingSkill.description,
                enabled: true,
                kind: "workspace",
                frontmatter: editingSkill.frontmatter,
                body: editingSkill.body,
                raw: editingSkill.raw,
              }
            : null
        }
        form={skillForm}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(values) => void saveSkill(values)}
        readOnly={!canMutate}
      />

      <Drawer
        title={t("skills.tencentSkillHub")}
        open={hubOpen}
        onClose={() => setHubOpen(false)}
        width={860}
        destroyOnHidden
      >
        <SkillHubTab
          target={{
            type: "package",
            packageId: selected?.id ?? packages[0]?.id ?? "",
          }}
          onInstalled={() => void refreshSelected()}
        />
      </Drawer>
    </PageShell>
  );
}
