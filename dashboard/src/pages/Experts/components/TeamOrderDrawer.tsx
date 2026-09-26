import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer } from "antd";
import { ChevronDown, ChevronUp } from "lucide-react";
import { message } from "@/utils/antdMessage";

import type { OctopAgent } from "../../../context/AgentContext";
import { teamCodeNumber } from "../teamOrder";

interface TeamOrderDrawerProps {
  open: boolean;
  teams: OctopAgent[];
  onClose: () => void;
  onSave: (order: string[]) => void;
}

/** Config panel: reorder teams with up/down buttons (and mirror drag order). */
export default function TeamOrderDrawer({
  open,
  teams,
  onClose,
  onSave,
}: TeamOrderDrawerProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (open) setOrder(teams.map((team) => team.agent_id));
  }, [open, teams]);

  const move = (index: number, delta: number) => {
    const next = [...order];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const byId = new Map(teams.map((team) => [team.agent_id, team]));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      title={t("experts.teams.orderTitle")}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            type="primary"
            onClick={() => {
              onSave(order);
              message.success(t("experts.teams.orderSaved"));
              onClose();
            }}
          >
            {t("common.save", "保存")}
          </Button>
        </div>
      }
    >
      <p style={{ color: "var(--fn-text-secondary)", marginTop: 0 }}>
        {t("experts.teams.orderHint")}
      </p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {order.map((id, index) => {
          const team = byId.get(id);
          if (!team) return null;
          const ordinal = teamCodeNumber(team.team_code);
          return (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 4px",
                borderBottom: "1px solid var(--fn-border-secondary, #eee)",
              }}
            >
              <span
                style={{
                  minWidth: 34,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--fn-text-tertiary, #999)",
                  fontWeight: 600,
                }}
              >
                {ordinal ?? `${index + 1}`}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{team.name}</span>
              <Button
                size="small"
                type="text"
                aria-label={t("experts.teams.moveUp")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                icon={<ChevronUp size={14} />}
              />
              <Button
                size="small"
                type="text"
                aria-label={t("experts.teams.moveDown")}
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                icon={<ChevronDown size={14} />}
              />
            </li>
          );
        })}
      </ol>
    </Drawer>
  );
}
