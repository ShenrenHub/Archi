import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { requestMascotInteract, type MascotTrigger } from "@/api/mascot";
import spriteUrl from "@/assets/mascot-znm.png";
import { mascotPhrases, type MascotRouteKey } from "./phrases";
import styles from "./mascot-layer.module.css";

type Point = { x: number; y: number };

const SPRITE_WIDTH = 60;
const SPRITE_HEIGHT = 56;
const RIGHT_OFFSET = 18;
const BOTTOM_OFFSET = 18;
const CLIENT_ID_STORAGE_KEY = "archi:mascot-client-id";
const POSITION_STORAGE_KEY = "archi:mascot-position";
const DRAG_THRESHOLD = 6;
const THINKING_PHRASES = [
  "筑泥魔去翻一下温室档案...",
  "等下，我问问后面的脑子...",
  "我看看这页现在在忙什么..."
];
const ROUTE_LABELS: Record<MascotRouteKey, string> = {
  dashboard: "驾驶舱",
  "smart-data-center": "智慧数据中心",
  "device-control": "设备控制",
  "crop-diagnosis": "作物诊断",
  admin: "管理后台",
  community: "耕知社区",
  default: "平台页面"
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items: string[]) {
  return items[randInt(0, items.length - 1)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function routeKey(pathname: string): MascotRouteKey {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/smart-data-center")) return "smart-data-center";
  if (pathname.startsWith("/device-control")) return "device-control";
  if (pathname.startsWith("/crop-diagnosis")) return "crop-diagnosis";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/community")) return "community";
  return "default";
}

function resolveDockedPosition() {
  return {
    x: Math.max(12, window.innerWidth - SPRITE_WIDTH - RIGHT_OFFSET),
    y: Math.max(12, window.innerHeight - SPRITE_HEIGHT - BOTTOM_OFFSET)
  };
}

function clampPosition(position: Point) {
  return {
    x: clamp(position.x, 12, Math.max(12, window.innerWidth - SPRITE_WIDTH - 12)),
    y: clamp(position.y, 12, Math.max(12, window.innerHeight - SPRITE_HEIGHT - 12))
  };
}

function resolveSavedPosition() {
  if (typeof window === "undefined") {
    return { x: 24, y: 120 };
  }

  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) {
      return resolveDockedPosition();
    }

    const parsed = JSON.parse(raw) as Partial<Point>;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return clampPosition(parsed as Point);
    }
  } catch {
    // Ignore malformed storage and fall back to the default docked position.
  }

  return resolveDockedPosition();
}

function persistPosition(position: Point) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage failures and keep the current in-memory position.
  }
}

function resolveClientId() {
  if (typeof window === "undefined") {
    return "mascot-web";
  }

  try {
    const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    // Ignore storage failures and fall back to an ephemeral id.
  }

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `mascot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
  } catch {
    // Ignore storage failures and keep using the generated id for this session.
  }

  return generated;
}

function collectVisibleText() {
  if (typeof document === "undefined") {
    return "";
  }

  return (document.body?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 420);
}

export function MascotLayer({ dark }: { dark: boolean }) {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Point>({ x: 24, y: 120 });
  const [speech, setSpeech] = useState("");
  const [jumping, setJumping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const speechTimeoutRef = useRef<number | undefined>(undefined);
  const jumpTimeoutRef = useRef<number | undefined>(undefined);
  const lastRouteRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const clientIdRef = useRef("");
  const positionRef = useRef<Point>({ x: 24, y: 120 });
  const suppressClickRef = useRef(false);
  const dragRef = useRef({
    pointerId: null as number | null,
    startClientX: 0,
    startClientY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false
  });

  const phrasePool = useMemo(() => {
    const key = routeKey(location.pathname);
    return [...(mascotPhrases[key] ?? mascotPhrases.default), ...mascotPhrases.default];
  }, [location.pathname]);

  useEffect(() => {
    setMounted(true);
    clientIdRef.current = resolveClientId();
    const initialPosition = resolveSavedPosition();
    positionRef.current = initialPosition;
    setPosition(initialPosition);
  }, []);

  const updatePosition = (nextPosition: Point) => {
    const clampedPosition = clampPosition(nextPosition);
    positionRef.current = clampedPosition;
    setPosition((current) =>
      current.x === clampedPosition.x && current.y === clampedPosition.y ? current : clampedPosition
    );
    return clampedPosition;
  };

  const showSpeech = (nextSpeech: string, durationMs: number) => {
    window.clearTimeout(speechTimeoutRef.current);
    setSpeech(nextSpeech);
    speechTimeoutRef.current = window.setTimeout(() => setSpeech(""), durationMs);
  };

  const triggerHop = () => {
    window.clearTimeout(jumpTimeoutRef.current);
    setJumping(false);
    requestAnimationFrame(() => {
      setJumping(true);
      jumpTimeoutRef.current = window.setTimeout(() => setJumping(false), 580);
    });
  };

  const triggerInteraction = async (trigger: MascotTrigger) => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (trigger === "click") {
      triggerHop();
    }

    showSpeech(randomItem(THINKING_PHRASES), 16000);

    const key = routeKey(location.pathname);

    try {
      const result = await requestMascotInteract(
        {
          clientId: clientIdRef.current || resolveClientId(),
          trigger,
          route: location.pathname,
          routeLabel: ROUTE_LABELS[key],
          pageTitle: document.title,
          pageSummary: `${ROUTE_LABELS[key]} (${location.pathname})`,
          visibleText: collectVisibleText()
        },
        controller.signal
      );

      if (controller.signal.aborted || nextRequestId !== requestIdRef.current) {
        return;
      }

      if (result.action === "hop") {
        triggerHop();
      }

      showSpeech(result.speech, clamp(result.durationMs || 3200, 1800, 9000));
    } catch (error) {
      if (controller.signal.aborted || nextRequestId !== requestIdRef.current) {
        return;
      }

      showSpeech(randomItem(phrasePool), 2600);
    }
  };

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const syncPosition = () => {
      const nextPosition = clampPosition(positionRef.current);
      positionRef.current = nextPosition;
      setPosition((current) =>
        current.x === nextPosition.x && current.y === nextPosition.y ? current : nextPosition
      );
      persistPosition(nextPosition);
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    return () => window.removeEventListener("resize", syncPosition);
  }, [mounted]);

  const finishDrag = () => {
    if (dragRef.current.pointerId === null) {
      return;
    }

    const didMove = dragRef.current.moved;
    dragRef.current.pointerId = null;
    dragRef.current.moved = false;
    setDragging(false);

    if (!didMove) {
      return;
    }

    suppressClickRef.current = true;
    persistPosition(positionRef.current);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current.pointerId = event.pointerId;
    dragRef.current.startClientX = event.clientX;
    dragRef.current.startClientY = event.clientY;
    dragRef.current.offsetX = event.clientX - rect.left;
    dragRef.current.offsetY = event.clientY - rect.top;
    dragRef.current.moved = false;
    suppressClickRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (!dragRef.current.moved) {
      const deltaX = event.clientX - dragRef.current.startClientX;
      const deltaY = event.clientY - dragRef.current.startClientY;
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
        return;
      }

      dragRef.current.moved = true;
    }

    event.preventDefault();
    updatePosition({
      x: event.clientX - dragRef.current.offsetX,
      y: event.clientY - dragRef.current.offsetY
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (lastRouteRef.current === location.pathname) {
      return;
    }

    lastRouteRef.current = location.pathname;
    const timer = window.setTimeout(() => {
      void triggerInteraction("route-change");
    }, 260);

    return () => window.clearTimeout(timer);
  }, [mounted, location.pathname, phrasePool]);

  useEffect(() => {
    return () => {
      finishDrag();
      abortRef.current?.abort();
      window.clearTimeout(speechTimeoutRef.current);
      window.clearTimeout(jumpTimeoutRef.current);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={[styles.layer, dark ? styles.dark : styles.light].join(" ")}
      data-mascot-root="true"
    >
      <button
        type="button"
        className={[styles.actor, dragging ? styles.dragging : ""].join(" ")}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={finishDrag}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }

          void triggerInteraction("click");
        }}
        aria-label="筑泥魔"
      >
        {speech ? <div className={styles.bubble}>{speech}</div> : null}
        <div className={[styles.spriteWrap, styles.idle, jumping ? styles.jump : ""].join(" ")}>
          <div className={styles.shadow} />
          <img src={spriteUrl} alt="" className={styles.image} draggable={false} />
        </div>
      </button>
    </div>
  );
}
