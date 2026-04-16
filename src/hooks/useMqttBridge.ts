import { useEffect, useState } from "react";
import type { LatestTelemetryItem } from "@/api/telemetry";

type SocketState = "connecting" | "online" | "offline";

const resolveWsUrl = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const url = new URL(configuredBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  return url.toString();
};

const buildFrame = (command: string, headers: Record<string, string>, body = "") =>
  `${command}\n${Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join("\n")}\n\n${body}\0`;

const parseFrames = (raw: string) =>
  raw
    .split("\0")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [headerBlock, ...bodyParts] = segment.split("\n\n");
      const [command, ...headerLines] = headerBlock.split("\n");
      const headers = Object.fromEntries(
        headerLines.map((line) => {
          const separatorIndex = line.indexOf(":");
          return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
        })
      );

      return {
        command,
        headers,
        body: bodyParts.join("\n\n")
      };
    });

export const useMqttBridge = (farmId?: number | null) => {
  const [state, setState] = useState<SocketState>("offline");
  const [latency, setLatency] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<LatestTelemetryItem | null>(null);

  useEffect(() => {
    if (!farmId) {
      setState("offline");
      setLastMessage(null);
      return;
    }

    const startedAt = Date.now();
    const wsUrl = resolveWsUrl();
    const socket = new WebSocket(wsUrl);
    setState("connecting");

    socket.onopen = () => {
      socket.send(
        buildFrame("CONNECT", {
          "accept-version": "1.2",
          host: new URL(wsUrl).host
        })
      );
    };

    socket.onmessage = (event) => {
      const frames = parseFrames(String(event.data));

      frames.forEach((frame) => {
        if (frame.command === "CONNECTED") {
          setState("online");
          setLatency(Date.now() - startedAt);
          socket.send(
            buildFrame("SUBSCRIBE", {
              id: `farm-${farmId}`,
              destination: `/topic/farms/${farmId}/telemetry`
            })
          );
        }

        if (frame.command === "MESSAGE") {
          try {
            setLastMessage(JSON.parse(frame.body) as LatestTelemetryItem);
          } catch {
            setLastMessage(null);
          }
        }
      });
    };

    socket.onerror = () => {
      setState("offline");
    };

    socket.onclose = () => {
      setState("offline");
    };

    return () => {
      socket.close();
    };
  }, [farmId]);

  return {
    state,
    latency,
    lastMessage
  };
};
