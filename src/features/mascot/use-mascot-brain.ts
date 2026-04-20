import { useCallback, useMemo, useRef, useState } from "react";
import { requestMascotInteract, type MascotInteractResponse, type MascotTrigger } from "@/api/mascot";
import { useUserStore } from "@/store/user";

const CLIENT_ID_STORAGE_KEY = "archi-mascot-client-id";

const routeLabelMap: Record<string, string> = {
  "/dashboard": "数据驾驶舱",
  "/smart-data-center": "智慧数据中心",
  "/device-control": "控制命令中心",
  "/crop-diagnosis": "作物智能诊断",
  "/admin": "农场与平台管理",
  "/community": "耕知社区"
};

function isVisible(node: Element) {
  const rect = (node as HTMLElement).getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function collapseText(text: string, limit: number) {
  return text.replace(/\s+/g, " ").trim().slice(0, limit);
}

function collectText(selector: string, itemLimit: number, charLimit: number) {
  const items: string[] = [];

  for (const node of Array.from(document.querySelectorAll(selector))) {
    if (!isVisible(node)) {
      continue;
    }

    const text = collapseText((node.textContent || "").trim(), 80);
    if (!text || items.includes(text)) {
      continue;
    }

    items.push(text);
    if (items.length >= itemLimit) {
      break;
    }
  }

  return collapseText(items.join(" | "), charLimit);
}

function collectPageContext() {
  const headingText = collectText("main h1, main h2, main h3, header h1, header h2, .ant-breadcrumb", 8, 240);
  const actionText = collectText("main button, main .ant-tag, main a[href]", 12, 260);
  const visibleText = collectText("main p, main li, main td, main th, main span", 24, 420);

  const summary = [headingText, actionText].filter(Boolean).join(" || ");

  return {
    pageSummary: summary,
    visibleText
  };
}

function getOrCreateClientId() {
  const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = `mascot-${window.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
  window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, nextId);
  return nextId;
}

export function useMascotBrain(pathname: string) {
  const farmId = useUserStore((state) => state.farmId);
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  const routeLabel = useMemo(() => {
    const matched = Object.entries(routeLabelMap).find(([route]) => pathname.startsWith(route));
    return matched?.[1] ?? "平台页面";
  }, [pathname]);

  const requestDecision = useCallback(
    async (trigger: MascotTrigger): Promise<MascotInteractResponse | null> => {
      if (typeof window === "undefined" || inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;
      setPending(true);

      try {
        const clientId = getOrCreateClientId();
        const context = collectPageContext();
        return await requestMascotInteract({
          clientId,
          trigger,
          route: pathname,
          routeLabel,
          farmId,
          pageTitle: document.title,
          pageSummary: context.pageSummary,
          visibleText: context.visibleText
        });
      } catch {
        return null;
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [farmId, pathname, routeLabel]
  );

  return {
    pending,
    requestDecision,
    routeLabel
  };
}
