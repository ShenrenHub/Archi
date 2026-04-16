import type { ReactNode } from "react";
import type { LatestTelemetryItem, TelemetryOverviewItem } from "@/api/telemetry";
import type { CameraItem } from "@/api/vision";

export type SmartDataBlockType = "light" | "climate" | "camera";
export type SmartSocketState = "connecting" | "online" | "offline";

export interface SmartDataCardItem {
  id: string;
  blockTypes: SmartDataBlockType[];
}

export interface SmartDataCardTemplate {
  key: string;
  label: string;
  blockTypes: SmartDataBlockType[];
}

export interface SmartDataRuntime {
  farmId: number | null;
  farmName: string;
  loading: boolean;
  telemetryOverview: TelemetryOverviewItem[];
  latestTelemetry: LatestTelemetryItem[];
  cameras: CameraItem[];
  socketState: SmartSocketState;
  socketLatency: number;
}

export interface SmartDataBrickDefinition {
  type: SmartDataBlockType;
  label: string;
  icon: ReactNode;
  shellClassName: string;
  iconClassName: string;
  render: (runtime: SmartDataRuntime) => ReactNode;
}

const createCardId = () =>
  `smart-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const SMART_DATA_BLOCK_ORDER: SmartDataBlockType[] = ["light", "climate", "camera"];
export const DEFAULT_CUSTOM_BLOCKS: SmartDataBlockType[] = ["climate", "light"];

export const SMART_DATA_CARD_TEMPLATES: SmartDataCardTemplate[] = [
  {
    key: "light-observer",
    label: "光照",
    blockTypes: ["light"]
  },
  {
    key: "climate-pod",
    label: "温湿度",
    blockTypes: ["climate"]
  },
  {
    key: "vision-station",
    label: "摄像头",
    blockTypes: ["camera"]
  },
  {
    key: "fusion-watch",
    label: "环境",
    blockTypes: ["light", "climate"]
  },
  {
    key: "full-inspection",
    label: "总览",
    blockTypes: ["light", "climate", "camera"]
  }
];

export const sortBlockTypes = (blockTypes: SmartDataBlockType[]) =>
  SMART_DATA_BLOCK_ORDER.filter((type) => blockTypes.includes(type));

export const buildCard = (blockTypes: SmartDataBlockType[]): SmartDataCardItem => ({
  id: createCardId(),
  blockTypes: sortBlockTypes([...new Set(blockTypes)])
});

export const buildInitialCards = (): SmartDataCardItem[] => [
  buildCard(["light", "climate", "camera"]),
  buildCard(["light", "climate"]),
  buildCard(["camera"])
];

export const normalizeMetricCode = (metricCode: string) =>
  metricCode.trim().toLowerCase().replace(/-/g, "_");

export const patchOverviewWithTelemetry = (
  item: TelemetryOverviewItem,
  lastMessage: LatestTelemetryItem
) => {
  if (item.greenhouseId !== lastMessage.greenhouseId) {
    return item;
  }

  const metricCode = normalizeMetricCode(lastMessage.metricCode);

  if (metricCode === "temperature") {
    return {
      ...item,
      temperature: lastMessage.metricValue
    };
  }

  if (metricCode === "humidity") {
    return {
      ...item,
      humidity: lastMessage.metricValue
    };
  }

  if (metricCode === "light" || metricCode === "light_lux" || metricCode === "brightness") {
    return {
      ...item,
      lightLux: lastMessage.metricValue
    };
  }

  return item;
};

export const resolveSocketTagColor = (state: SmartSocketState) => {
  if (state === "online") {
    return "green";
  }

  if (state === "connecting") {
    return "gold";
  }

  return "red";
};
