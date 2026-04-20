import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import spriteUrl from "@/assets/mascot-znm.png";
import type { MascotInteractResponse, MascotTargetZone } from "@/api/mascot";
import { mascotPhrases, type MascotRouteKey } from "./phrases";
import { useMascotBrain } from "./use-mascot-brain";
import styles from "./mascot-layer.module.css";

type Point = { x: number; y: number };
type Rect = { left: number; top: number; right: number; bottom: number };

const SPRITE_WIDTH = 60;
const SPRITE_HEIGHT = 56;
const EDGE_PADDING = 12;
const ARRIVE_DISTANCE = 8;
const MOVE_SPEED_MIN = 26;
const MOVE_SPEED_MAX = 42;
const MIN_WAIT_MS = 750;
const MAX_WAIT_MS = 2100;
const AUTO_SPEAK_MIN_MS = 11000;
const AUTO_SPEAK_MAX_MS = 18000;
const OBSTACLE_QUERY = [
  "aside",
  "header",
  "nav",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  ".ant-drawer",
  ".ant-modal-root",
  ".ant-select-dropdown",
  ".ant-dropdown",
  ".ant-popover",
  ".ant-picker-dropdown",
  "[role='button']",
  "[data-mascot-avoid]"
].join(",");

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function randomItem(items: string[]) {
  return items[randInt(0, items.length - 1)];
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

function collectObstacles() {
  return Array.from(document.querySelectorAll<HTMLElement>(OBSTACLE_QUERY))
    .filter((node) => !node.closest("[data-mascot-root='true']"))
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 24 && rect.height > 20)
    .map(
      (rect): Rect => ({
        left: rect.left - 10,
        top: rect.top - 10,
        right: rect.right + 10,
        bottom: rect.bottom + 10
      })
    );
}

function spriteRect(x: number, y: number): Rect {
  return { left: x, top: y, right: x + SPRITE_WIDTH, bottom: y + SPRITE_HEIGHT };
}

function intersects(a: Rect, b: Rect) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function collides(x: number, y: number, obstacles: Rect[]) {
  const rect = spriteRect(x, y);
  return obstacles.some((obstacle) => intersects(rect, obstacle));
}

function pickTarget(viewport: Point, obstacles: Rect[]) {
  const maxX = Math.max(EDGE_PADDING, viewport.x - SPRITE_WIDTH - EDGE_PADDING);
  const maxY = Math.max(EDGE_PADDING, viewport.y - SPRITE_HEIGHT - EDGE_PADDING);

  for (let index = 0; index < 40; index += 1) {
    const x = rand(EDGE_PADDING, maxX);
    const y = rand(EDGE_PADDING, maxY);
    if (!collides(x, y, obstacles)) {
      return { x, y };
    }
  }

  return {
    x: clamp(viewport.x * 0.72 - SPRITE_WIDTH * 0.5, EDGE_PADDING, maxX),
    y: clamp(viewport.y * 0.7 - SPRITE_HEIGHT * 0.5, EDGE_PADDING, maxY)
  };
}

function pickTargetForZone(viewport: Point, obstacles: Rect[], zone: MascotTargetZone) {
  if (zone === "none") {
    return pickTarget(viewport, obstacles);
  }

  const zoneCandidates: Record<Exclude<MascotTargetZone, "none">, Array<[number, number]>> = {
    left: [
      [0.16, 0.62],
      [0.2, 0.42]
    ],
    right: [
      [0.78, 0.58],
      [0.72, 0.36]
    ],
    center: [
      [0.5, 0.56],
      [0.52, 0.34]
    ],
    "top-left": [
      [0.16, 0.22],
      [0.22, 0.34]
    ],
    "top-right": [
      [0.78, 0.2],
      [0.72, 0.34]
    ],
    "bottom-left": [
      [0.18, 0.78],
      [0.26, 0.66]
    ],
    "bottom-right": [
      [0.78, 0.78],
      [0.68, 0.66]
    ]
  };

  const maxX = Math.max(EDGE_PADDING, viewport.x - SPRITE_WIDTH - EDGE_PADDING);
  const maxY = Math.max(EDGE_PADDING, viewport.y - SPRITE_HEIGHT - EDGE_PADDING);

  for (const [xRatio, yRatio] of zoneCandidates[zone]) {
    const x = clamp(viewport.x * xRatio - SPRITE_WIDTH * 0.5, EDGE_PADDING, maxX);
    const y = clamp(viewport.y * yRatio - SPRITE_HEIGHT * 0.5, EDGE_PADDING, maxY);
    if (!collides(x, y, obstacles)) {
      return { x, y };
    }
  }

  return pickTarget(viewport, obstacles);
}

export function MascotLayer({ dark }: { dark: boolean }) {
  const location = useLocation();
  const { pending, requestDecision } = useMascotBrain(location.pathname);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Point>({ x: 24, y: 120 });
  const [speech, setSpeech] = useState("");
  const [pose, setPose] = useState<"idle" | "walk">("idle");
  const [jumping, setJumping] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);

  const frameRef = useRef<number | undefined>(undefined);
  const speechTimeoutRef = useRef<number | undefined>(undefined);
  const jumpTimeoutRef = useRef<number | undefined>(undefined);
  const positionRef = useRef<Point>({ x: 24, y: 120 });
  const viewportRef = useRef<Point>({ x: 0, y: 0 });
  const targetRef = useRef<Point | null>(null);
  const waitUntilRef = useRef(0);
  const nextSpeakAtRef = useRef(0);
  const speedRef = useRef(MOVE_SPEED_MIN);
  const obstaclesRef = useRef<Rect[]>([]);
  const lastObstacleRefreshRef = useRef(0);
  const speechRef = useRef("");
  const lastRouteDecisionRef = useRef("");
  const showSpeechRef = useRef<(line: string, durationMs?: number) => void>(() => undefined);
  const triggerHopRef = useRef<() => void>(() => undefined);
  const applyDecisionRef = useRef<(decision: MascotInteractResponse) => void>(() => undefined);

  const phrasePool = useMemo(() => {
    const key = routeKey(location.pathname);
    return [...(mascotPhrases[key] ?? mascotPhrases.default), ...mascotPhrases.default];
  }, [location.pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  const showSpeech = (line: string, durationMs = 3400) => {
    speechRef.current = line;
    setSpeech(line);
    window.clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = window.setTimeout(() => {
      speechRef.current = "";
      setSpeech("");
    }, durationMs);
    nextSpeakAtRef.current = performance.now() + randInt(AUTO_SPEAK_MIN_MS, AUTO_SPEAK_MAX_MS);
  };

  const triggerHop = () => {
    setJumping(false);
    window.clearTimeout(jumpTimeoutRef.current);
    requestAnimationFrame(() => {
      setJumping(true);
      jumpTimeoutRef.current = window.setTimeout(() => setJumping(false), 580);
    });
  };

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const refreshViewport = () => {
      viewportRef.current = { x: window.innerWidth, y: window.innerHeight };

      const maxX = Math.max(EDGE_PADDING, viewportRef.current.x - SPRITE_WIDTH - EDGE_PADDING);
      const maxY = Math.max(EDGE_PADDING, viewportRef.current.y - SPRITE_HEIGHT - EDGE_PADDING);
      positionRef.current = {
        x: clamp(positionRef.current.x, EDGE_PADDING, maxX),
        y: clamp(positionRef.current.y, EDGE_PADDING, maxY)
      };
      setPosition(positionRef.current);
    };

    const refreshObstacles = () => {
      obstaclesRef.current = collectObstacles();
      lastObstacleRefreshRef.current = performance.now();
    };

    const speak = (line?: string, durationMs = 3400) => {
      const nextLine = line ?? randomItem(phrasePool);
      showSpeech(nextLine, durationMs);
    };

    const hop = () => {
      triggerHop();
    };

    const applyDecision = (decision: MascotInteractResponse) => {
      speak(decision.speech, decision.durationMs);

      if (decision.action === "hop") {
        hop();
      }

      speedRef.current =
        decision.mood === "alert"
          ? rand(36, 48)
          : decision.mood === "curious"
            ? rand(30, 44)
            : rand(MOVE_SPEED_MIN, MOVE_SPEED_MAX);

      if (decision.targetZone !== "none") {
        targetRef.current = pickTargetForZone(
          viewportRef.current,
          obstaclesRef.current,
          decision.targetZone
        );
        waitUntilRef.current = performance.now() + 120;
      }
    };

    showSpeechRef.current = speak;
    triggerHopRef.current = hop;
    applyDecisionRef.current = applyDecision;

    refreshViewport();
    refreshObstacles();

    positionRef.current = pickTarget(viewportRef.current, obstaclesRef.current);
    setPosition(positionRef.current);
    targetRef.current = pickTarget(viewportRef.current, obstaclesRef.current);
    speedRef.current = rand(MOVE_SPEED_MIN, MOVE_SPEED_MAX);
    waitUntilRef.current = performance.now() + 600;
    nextSpeakAtRef.current = performance.now() + 1500;

    const loop = (now: number) => {
      if (document.hidden) {
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }

      if (now - lastObstacleRefreshRef.current > 900) {
        refreshObstacles();
      }

      if (now >= nextSpeakAtRef.current && !speechRef.current) {
        speak();
      }

      if (now < waitUntilRef.current) {
        setPose("idle");
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }

      if (!targetRef.current) {
        targetRef.current = pickTarget(viewportRef.current, obstaclesRef.current);
        speedRef.current = rand(MOVE_SPEED_MIN, MOVE_SPEED_MAX);
      }

      const current = positionRef.current;
      const target = targetRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= ARRIVE_DISTANCE) {
        targetRef.current = null;
        waitUntilRef.current = now + randInt(MIN_WAIT_MS, MAX_WAIT_MS);
        setPose("idle");
        if (Math.random() > 0.58) {
          hop();
        }
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }

      const step = Math.min(speedRef.current / 60, distance);
      const nextX = clamp(
        current.x + (dx / distance) * step,
        EDGE_PADDING,
        viewportRef.current.x - SPRITE_WIDTH - EDGE_PADDING
      );
      const nextY = clamp(
        current.y + (dy / distance) * step,
        EDGE_PADDING,
        viewportRef.current.y - SPRITE_HEIGHT - EDGE_PADDING
      );

      if (collides(nextX, nextY, obstaclesRef.current)) {
        targetRef.current = pickTarget(viewportRef.current, obstaclesRef.current);
        waitUntilRef.current = now + randInt(180, 460);
        setPose("idle");
        frameRef.current = window.requestAnimationFrame(loop);
        return;
      }

      positionRef.current = { x: nextX, y: nextY };
      setPosition(positionRef.current);
      setFacing(dx >= 0 ? 1 : -1);
      setPose("walk");
      frameRef.current = window.requestAnimationFrame(loop);
    };

    const handleResize = () => {
      refreshViewport();
      refreshObstacles();
      targetRef.current = pickTarget(viewportRef.current, obstaclesRef.current);
    };

    const handleScroll = () => {
      refreshObstacles();
    };

    speak(randomItem(phrasePool));
    frameRef.current = window.requestAnimationFrame(loop);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.cancelAnimationFrame(frameRef.current ?? 0);
      window.clearTimeout(speechTimeoutRef.current);
      window.clearTimeout(jumpTimeoutRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [mounted, phrasePool]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const routeKeyValue = location.pathname;
    const timer = window.setTimeout(async () => {
      if (lastRouteDecisionRef.current === routeKeyValue) {
        return;
      }

      lastRouteDecisionRef.current = routeKeyValue;
      const decision = await requestDecision("route-change");
      if (decision) {
        applyDecisionRef.current(decision);
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [mounted, location.pathname, requestDecision]);

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
        className={styles.actor}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        onClick={async () => {
          triggerHopRef.current();

          if (pending) {
            showSpeechRef.current("别急，我还在想。", 1600);
            return;
          }

          showSpeechRef.current("让我想一下...", 1500);
          const decision = await requestDecision("click");

          if (decision) {
            applyDecisionRef.current(decision);
            return;
          }

          showSpeechRef.current(randomItem(phrasePool));
        }}
        aria-label="筑泥魔"
      >
        {speech ? <div className={styles.bubble}>{speech}</div> : null}
        <div
          className={[
            styles.spriteWrap,
            pose === "walk" ? styles.walk : styles.idle,
            jumping ? styles.jump : ""
          ].join(" ")}
          style={{ transform: `scaleX(${facing})` }}
        >
          <div className={styles.shadow} />
          <img src={spriteUrl} alt="" className={styles.image} draggable={false} />
        </div>
      </button>
    </div>
  );
}
