import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  Avatar,
  Drawer,
  Form,
  Input,
  Button,
  Tag,
  Divider,
  Segmented,
  Tooltip,
  Popover,
} from "antd";
import { message } from "@/utils/antdMessage";

import {
  LogOut,
  ChevronDown,
  ChevronUp,
  Palette,
  CircleHelp,
  Github,
  RefreshCw,
  KeyRound,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/modules/auth";
import { preferencesApi } from "../api/modules/preferences";
import { clearAuthToken } from "../api/request";
import { applyGuestLocale, applyUserLocale } from "../utils/locale";
import { apiErrorMessage } from "../utils/apiError";
import { isSsoPopupMessage, openSsoPopup } from "../utils/ssoPopup";
import {
  MIN_PASSWORD_LENGTH,
  passwordPolicyIssue,
} from "../utils/passwordPolicy";
import { useUserRole } from "../hooks/useUserRole";
import { useIsMobile } from "../hooks/useIsMobile";
import ThemeSwitcher from "./ThemeSwitcher";
import PaletteSwitcher from "./PaletteSwitcher";
import type { OctopUser } from "../api/modules/auth";
import { useLayoutMode } from "../context/LayoutModeContext";
import type { LayoutMode } from "../layouts/layoutModeStorage";
import { userCan } from "../utils/permissions";
import feishuIcon from "../assets/channels/feishu.svg";
import dingtalkIcon from "../assets/channels/dingtalk.svg";
import wecomIcon from "../assets/channels/wecom.svg";
import styles from "./AvatarDropdown.module.less";

const GITHUB_URL = "https://github.com/TencentCloud/Octop";
const HELP_FEEDBACK_URL = "https://octop.cloud";
const APP_OAUTH_KINDS = new Set(["feishu", "dingtalk", "wecom"]);

function oauthProviderIcon(kind: string): ReactNode {
  const src =
    kind === "feishu"
      ? feishuIcon
      : kind === "dingtalk"
      ? dingtalkIcon
      : kind === "wecom"
      ? wecomIcon
      : null;
  if (!src) return <KeyRound size={18} />;
  return <img src={src} alt="" width={20} height={20} draggable={false} />;
}

interface AvatarDropdownProps {
  user: OctopUser | null;
  onUserChange?: (u: OctopUser) => void;
  /**
   * ``sidebar`` — brand-rail footer trigger (avatar [+ name when expanded]).
   * Default keeps a plain avatar button (legacy header style).
   */
  placement?: "default" | "sidebar";
  /** When placement is sidebar and true, show avatar only (collapsed rail). */
  compact?: boolean;
  /** Called before opening settings (e.g. close mobile nav drawer). */
  onBeforeOpenSettings?: () => void;
}

export default function AvatarDropdown({
  user,
  onUserChange,
  placement = "default",
  compact = false,
  onBeforeOpenSettings,
}: AvatarDropdownProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const role = useUserRole();
  const isMobile = useIsMobile();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"account" | "preferences">(
    "preferences",
  );
  const [saving, setSaving] = useState(false);
  const [ssoProviders, setSsoProviders] = useState<
    { kind: string; display_name: string; enabled: boolean }[]
  >([]);
  const [ssoBindingKind, setSsoBindingKind] = useState<string | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [profileForm] = Form.useForm<{ display_name: string }>();
  const [pwForm] = Form.useForm<{
    old_password: string;
    new_password: string;
    confirm: string;
  }>();

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    await authApi.logout();
    clearAuthToken();
    await applyGuestLocale();
    navigate("/login", { replace: true });
  }, [navigate]);

  const openPanel = useCallback(() => {
    onBeforeOpenSettings?.();
    setSettingsTab("preferences");
    profileForm.setFieldsValue({ display_name: user?.display_name || "" });
    pwForm.resetFields();
    setMenuOpen(true);
  }, [onBeforeOpenSettings, user, profileForm, pwForm]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        onBeforeOpenSettings?.();
        setSettingsTab("preferences");
        profileForm.setFieldsValue({ display_name: user?.display_name || "" });
        pwForm.resetFields();
      }
      setMenuOpen(next);
    },
    [onBeforeOpenSettings, user, profileForm, pwForm],
  );

  const handleSaveProfile = async (values: { display_name: string }) => {
    setSaving(true);
    try {
      const updated = await authApi.updateProfile(
        values.display_name?.trim() || null,
      );
      onUserChange?.(updated);
      message.success(t("account.savedSuccess"));
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async (values: {
    old_password: string;
    new_password: string;
    confirm: string;
  }) => {
    setChangingPw(true);
    try {
      await authApi.changePassword(values.old_password, values.new_password);
      message.success(t("account.passwordChanged"));
      pwForm.resetFields();
    } catch (e) {
      message.error(apiErrorMessage(e, t("account.passwordChangeFailed"), t));
    } finally {
      setChangingPw(false);
    }
  };

  const passwordPolicyMessage = (
    issue: ReturnType<typeof passwordPolicyIssue>,
  ) => {
    switch (issue) {
      case "same_as_old":
        return t("account.passwordSameAsOld");
      case "too_short":
        return t("account.passwordTooShort", { min: MIN_PASSWORD_LENGTH });
      case "need_letter_and_digit":
        return t("account.passwordNeedLetterAndDigit");
      case "too_common":
        return t("account.passwordTooCommon");
      default:
        return t("account.passwordTooWeak");
    }
  };

  const handleLocaleChange = (val: string) => {
    void preferencesApi
      .setLocale(val)
      .then(async (prefs) => {
        await applyUserLocale(prefs.locale);
        if (user) onUserChange?.({ ...user, locale: prefs.locale });
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : String(e));
      });
  };

  const bindableProviders = ssoProviders.filter((item) =>
    APP_OAUTH_KINDS.has(item.kind),
  );
  const linkedKinds = new Set(
    (user?.sso_identities ?? [])
      .map((item) => item.kind)
      .concat(user?.sso_kind ? [user.sso_kind] : []),
  );
  const providerDisplayName = (kind: string, displayName?: string) =>
    displayName?.trim() ||
    t(`login.providerKind.${kind}`, { defaultValue: kind });
  const canUnbindKind = (kind: string) =>
    linkedKinds.has(kind) &&
    (user?.has_password !== false || linkedKinds.size > 1);

  const ssoRows: { kind: string; display_name: string }[] = [];
  const seenSsoKinds = new Set<string>();
  for (const provider of bindableProviders) {
    ssoRows.push({
      kind: provider.kind,
      display_name: provider.display_name,
    });
    seenSsoKinds.add(provider.kind);
  }
  for (const kind of linkedKinds) {
    if (!APP_OAUTH_KINDS.has(kind) || seenSsoKinds.has(kind)) continue;
    ssoRows.push({ kind, display_name: "" });
  }

  const handleBindOauth = async (kind: string) => {
    const popup = openSsoPopup();
    setSsoBindingKind(kind);
    try {
      const { authorization_url } = await authApi.startOauthBind(kind, "/chat");
      if (popup && !popup.closed) {
        popup.location.href = authorization_url;
        const timer = window.setInterval(() => {
          if (!popup || popup.closed) {
            window.clearInterval(timer);
            setSsoBindingKind(null);
          }
        }, 400);
      } else {
        popup?.close();
        message.error(t("account.ssoPopupBlocked"));
        setSsoBindingKind(null);
      }
    } catch (err) {
      popup?.close();
      message.error(apiErrorMessage(err, t("account.ssoBindFailed"), t));
      setSsoBindingKind(null);
    }
  };

  const handleUnbindOauth = async (kind: string) => {
    setSsoBindingKind(kind);
    try {
      const next = await authApi.unbindOauth(kind);
      onUserChange?.(next);
      message.success(t("account.ssoUnbindSuccess"));
    } catch (err) {
      message.error(apiErrorMessage(err, t("account.ssoUnbindFailed"), t));
    } finally {
      setSsoBindingKind(null);
    }
  };

  const currentLang = i18n.language?.startsWith("zh") ? "zh" : "en";
  const roleLabel =
    role === "admin" ? t("account.roleAdmin") : t("account.roleUser");

  const displayName = user?.display_name || user?.username || "—";
  const initials = (user?.display_name || user?.username || "?")
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    void authApi
      .me()
      .then((next) => onUserChange?.(next))
      .catch(() => undefined);
    void authApi
      .getOauthStatus()
      .then((status) =>
        setSsoProviders(status.providers.filter((item) => item.enabled)),
      )
      .catch(() => undefined);
  }, [onUserChange, menuOpen]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isSsoPopupMessage(event, window.location.origin)) return;
      setSsoBindingKind(null);
      if (!event.data.ok) {
        const code = event.data.error || "generic";
        message.error(
          t(`login.oidcError.${code}`, {
            defaultValue: t("login.oidcError.generic"),
          }),
        );
        return;
      }
      void authApi
        .me()
        .then((next) => {
          onUserChange?.(next);
          message.success(t("account.ssoBindSuccess"));
        })
        .catch(() => undefined);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onUserChange, t]);

  const avatar = (
    <Avatar
      size={32}
      style={{
        background: "var(--fn-color-brand)",
        fontSize: 14,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {initials}
    </Avatar>
  );

  const panelHeader = (
    <div className={styles.menuHeader}>
      <div className={styles.menuHeaderTop}>
        <span className={styles.menuDisplayName}>{displayName}</span>
        <Tag
          color={role === "admin" ? "blue" : "default"}
          className={styles.roleTag}
        >
          {roleLabel}
        </Tag>
      </div>
      {user?.username && (
        <span className={styles.menuHandle}>@{user.username}</span>
      )}
    </div>
  );

  const panelFooter = (
    <div className={styles.panelFooter}>
      <a
        className={styles.panelLink}
        href={HELP_FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <CircleHelp size={14} strokeWidth={1.8} />
        <span>{t("account.helpFeedback")}</span>
      </a>
      <a
        className={styles.panelLink}
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Github size={14} strokeWidth={1.8} />
        <span>{t("account.projectUrl")}</span>
      </a>
      {userCan(user, "update") && (
        <button
          type="button"
          className={styles.panelLink}
          onClick={() => {
            setMenuOpen(false);
            navigate("/admin/advanced?tab=updates");
          }}
        >
          <RefreshCw size={14} strokeWidth={1.8} />
          <span>{t("account.checkUpdates")}</span>
        </button>
      )}
      <button
        type="button"
        className={`${styles.panelLink} ${styles.menuItemDanger}`}
        onClick={() => void handleLogout()}
      >
        <LogOut size={14} strokeWidth={1.8} />
        <span>{t("auth.logout")}</span>
      </button>
    </div>
  );

  const triggerButton =
    placement === "sidebar" && !compact ? (
      <button
        type="button"
        className={styles.triggerExpanded}
        onClick={isMobile ? openPanel : undefined}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--fn-sidebar-item-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {avatar}
        <span className={styles.triggerName}>{displayName}</span>
        {menuOpen ? (
          <ChevronUp
            size={14}
            strokeWidth={1.8}
            className={styles.triggerChevron}
          />
        ) : (
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className={styles.triggerChevron}
          />
        )}
      </button>
    ) : (
      <Tooltip
        title={placement === "sidebar" ? displayName : undefined}
        placement="right"
        mouseEnterDelay={0.3}
      >
        <span
          role="button"
          tabIndex={0}
          className={styles.triggerCompact}
          onClick={isMobile ? openPanel : undefined}
          onKeyDown={(e) => {
            if (!isMobile) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPanel();
            }
          }}
        >
          {avatar}
        </span>
      </Tooltip>
    );

  const accountTab = (
    <div className={styles.settingsBody}>
      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.displayName")}
          </h3>
          <p className={styles.settingsSectionDesc}>
            {t("account.displayNameHint")}
          </p>
        </div>
        <Form
          form={profileForm}
          onFinish={handleSaveProfile}
          layout="vertical"
          requiredMark={false}
          initialValues={{ display_name: user?.display_name || "" }}
          className={styles.settingsForm}
        >
          <Form.Item
            name="display_name"
            style={{ marginBottom: 12 }}
            rules={[
              {
                max: 64,
                message: t("account.displayNameTooLong"),
              },
            ]}
          >
            <Input
              placeholder={t("account.displayNamePlaceholder")}
              maxLength={64}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            {t("account.saveDisplayName")}
          </Button>
        </Form>
      </section>

      <Divider className={styles.settingsDivider} />

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.changePassword")}
          </h3>
          <p className={styles.settingsSectionDesc}>
            {t("account.changePasswordHint")}
          </p>
        </div>
        <Form
          form={pwForm}
          onFinish={handleChangePw}
          layout="vertical"
          requiredMark={false}
          className={styles.settingsForm}
        >
          <Form.Item
            name="old_password"
            label={t("account.currentPassword")}
            rules={[
              {
                required: true,
                message: t("account.currentPasswordRequired"),
              },
            ]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label={t("account.newPassword")}
            dependencies={["old_password"]}
            rules={[
              {
                required: true,
                message: t("account.newPasswordRequired"),
              },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value) return Promise.resolve();
                  const issue = passwordPolicyIssue(
                    value,
                    getFieldValue("old_password") as string | undefined,
                  );
                  if (issue) {
                    return Promise.reject(
                      new Error(passwordPolicyMessage(issue)),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label={t("account.confirmPassword")}
            dependencies={["new_password"]}
            rules={[
              {
                required: true,
                message: t("account.confirmPasswordRequired"),
              },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("account.passwordMismatch")),
                  );
                },
              }),
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={changingPw} block>
            {t("account.changePassword")}
          </Button>
        </Form>
      </section>

      {ssoRows.length > 0 && (
        <>
          <Divider className={styles.settingsDivider} />
          <section className={styles.settingsSection}>
            <div className={styles.settingsSectionHead}>
              <h3 className={styles.settingsSectionTitle}>
                {t("account.ssoTitle")}
              </h3>
              <p className={styles.settingsSectionDesc}>
                {t("account.ssoHint")}
              </p>
            </div>
            <ul className={styles.ssoList}>
              {ssoRows.map((provider) => {
                const name = providerDisplayName(
                  provider.kind,
                  provider.display_name,
                );
                const linked = linkedKinds.has(provider.kind);
                const busy = ssoBindingKind === provider.kind;
                return (
                  <li key={provider.kind} className={styles.ssoRow}>
                    <span className={styles.ssoIcon} aria-hidden>
                      {oauthProviderIcon(provider.kind)}
                    </span>
                    <div className={styles.ssoMeta}>
                      <span className={styles.ssoName}>{name}</span>
                      <span className={styles.ssoStatus}>
                        {linked
                          ? t("account.ssoStatusLinked")
                          : t("account.ssoStatusUnlinked")}
                      </span>
                    </div>
                    {linked ? (
                      canUnbindKind(provider.kind) ? (
                        <Button
                          size="small"
                          danger
                          loading={busy}
                          disabled={ssoBindingKind !== null && !busy}
                          onClick={() => void handleUnbindOauth(provider.kind)}
                        >
                          {t("account.ssoDisconnect")}
                        </Button>
                      ) : null
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        loading={busy}
                        disabled={ssoBindingKind !== null && !busy}
                        onClick={() => void handleBindOauth(provider.kind)}
                      >
                        {t("account.ssoConnect")}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );

  const preferencesTab = (
    <div className={styles.settingsBody}>
      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.appearance")}
          </h3>
          <p className={styles.settingsSectionDesc}>{t("account.themeHint")}</p>
        </div>
        <ThemeSwitcher block />
      </section>

      <Divider className={styles.settingsDivider} />

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.layoutMode")}
          </h3>
          <p className={styles.settingsSectionDesc}>
            {t("account.layoutModeHint")}
          </p>
        </div>
        <Segmented
          block
          value={layoutMode}
          options={[
            { label: t("account.layoutClassic"), value: "classic" },
            { label: t("account.layoutMinimal"), value: "minimal" },
          ]}
          onChange={(val) => setLayoutMode(val as LayoutMode)}
        />
      </section>

      <Divider className={styles.settingsDivider} />

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.language")}
          </h3>
          <p className={styles.settingsSectionDesc}>
            {t("account.languageHint")}
          </p>
        </div>
        <Segmented
          block
          value={currentLang}
          options={[
            { label: t("account.langZh"), value: "zh" },
            { label: t("account.langEn"), value: "en" },
          ]}
          onChange={(val) => handleLocaleChange(val as string)}
        />
      </section>

      <Divider className={styles.settingsDivider} />

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHead}>
          <h3 className={styles.settingsSectionTitle}>
            {t("account.palette")}
          </h3>
          <p className={styles.settingsSectionDesc}>
            {t("account.paletteHint")}
          </p>
        </div>
        <PaletteSwitcher />
      </section>
    </div>
  );

  const panelContent = (
    <div className={styles.panel}>
      {panelHeader}
      <Segmented
        block
        className={styles.panelTabs}
        value={settingsTab}
        options={[
          {
            label: (
              <span className={styles.panelTabLabel}>
                <Palette size={14} strokeWidth={1.8} />
                {t("account.tabPreferences")}
              </span>
            ),
            value: "preferences",
          },
          {
            label: (
              <span className={styles.panelTabLabel}>
                <UserRound size={14} strokeWidth={1.8} />
                {t("account.tabAccount")}
              </span>
            ),
            value: "account",
          },
        ]}
        onChange={(val) => setSettingsTab(val as "account" | "preferences")}
      />
      <div className={styles.panelScroll}>
        {settingsTab === "account" ? accountTab : preferencesTab}
      </div>
      <Divider className={styles.menuDivider} />
      {panelFooter}
    </div>
  );

  return isMobile ? (
    <>
      {triggerButton}
      <Drawer
        placement="bottom"
        height="min(92dvh, 100%)"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        destroyOnHidden
        className={styles.settingsDrawer}
        title={t("account.settings")}
        styles={{
          body: {
            paddingTop: 8,
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          },
        }}
      >
        {panelContent}
      </Drawer>
    </>
  ) : (
    <Popover
      content={panelContent}
      trigger="click"
      open={menuOpen}
      onOpenChange={handleOpenChange}
      placement="topLeft"
      arrow={false}
      overlayClassName={styles.menuPopover}
      destroyOnHidden
      getPopupContainer={() => document.body}
    >
      {triggerButton}
    </Popover>
  );
}
