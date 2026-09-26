import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer, Empty, Spin, Tag, Typography } from "antd";
import { message } from "@/utils/antdMessage";

import {
  teamsApi,
  type TeamRecord,
  type TeamTemplateSummary,
} from "../../../api/modules/teams";
import { apiErrorMessage } from "../../../utils/apiError";
import { sortTeamTemplates, templateOrdinal } from "../teamOrder";
import styles from "../index.module.less";

interface TeamTemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (team: TeamRecord) => void;
}

export default function TeamTemplateDrawer({
  open,
  onClose,
  onCreated,
}: TeamTemplateDrawerProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TeamTemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    teamsApi
      .listTemplates()
      .then((rows) => {
        if (!cancelled) setTemplates(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          message.error(apiErrorMessage(err, t("experts.teams.seedFailed"), t));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const handleCreate = async (templateId: string) => {
    setCreatingId(templateId);
    try {
      const team = await teamsApi.createFromTemplate(templateId);
      message.success(t("experts.teams.templateCreated"));
      onCreated(team);
    } catch (err) {
      message.error(apiErrorMessage(err, t("experts.teams.seedFailed"), t));
    } finally {
      setCreatingId(null);
    }
  };

  const orderedTemplates = useMemo(
    () => sortTeamTemplates(templates),
    [templates],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={t("experts.teams.templates")}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : orderedTemplates.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orderedTemplates.map((tpl) => {
            const ordinal = templateOrdinal(tpl.id);
            return (
              <div key={tpl.id} className={styles.templateCard}>
                {ordinal ? (
                  <span className={styles.teamCardOrdinal}>{ordinal}</span>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <strong>{tpl.label}</strong>
                  <Button
                    type="primary"
                    size="small"
                    loading={creatingId === tpl.id}
                    onClick={() => void handleCreate(tpl.id)}
                  >
                    {t("experts.teams.create")}
                  </Button>
                </div>
                <Typography.Paragraph
                  type="secondary"
                  style={{ margin: "8px 0" }}
                >
                  {tpl.description}
                </Typography.Paragraph>
                {tpl.suggested_roles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {tpl.suggested_roles.map((role) => (
                      <Tag key={role.name} title={role.description}>
                        {role.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
