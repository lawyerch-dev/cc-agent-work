import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ChatFloatBar.module.less";

const COLLAPSED_KEY = "octop:chat-float-bar:collapsed";

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

interface ChatFloatBarProps {
  children: ReactNode;
}

/**
 * Fixed right-edge control bar for the chat page.
 *
 * Unlike the old hover-revealed float buttons, the bar is always visible.
 * The side tag collapses / expands the icon column and the choice is
 * persisted per browser.
 */
export default function ChatFloatBar({ children }: ChatFloatBarProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const label = collapsed
    ? t("chat.expandFloatBar", "展开控件栏")
    : t("chat.collapseFloatBar", "收起控件栏");

  return (
    <div className={`${styles.bar} ${collapsed ? styles.barCollapsed : ""}`}>
      <div className={styles.items}>{children}</div>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        aria-label={label}
        aria-expanded={!collapsed}
        title={label}
      >
        {collapsed ? (
          <ChevronLeft size={14} strokeWidth={2} aria-hidden />
        ) : (
          <ChevronRight size={14} strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );
}
