import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchLatestTelemetry,
  fetchTelemetryOverview,
  type LatestTelemetryItem,
  type TelemetryOverviewItem
} from "@/api/telemetry";
import { fetchCameras, type CameraItem } from "@/api/vision";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useUserStore } from "@/store/user";
import {
  normalizeMetricCode,
  patchOverviewWithTelemetry,
  type SmartDataRuntime
} from "./model";

const SMART_DATA_POLL_INTERVAL_MS = 8000;

interface SmartDataCenterRuntimeResult {
  farmId: number | null;
  farmName: string;
  runtime: SmartDataRuntime;
  refreshRuntime: (options?: { silent?: boolean }) => Promise<boolean>;
}

export const useSmartDataCenterRuntime = (
  onLoadFailed: () => void
): SmartDataCenterRuntimeResult => {
  const farmId = useUserStore((state) => state.farmId);
  const farms = useUserStore((state) => state.farms);
  const [telemetryOverview, setTelemetryOverview] = useState<TelemetryOverviewItem[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<LatestTelemetryItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const { state: socketState, latency: socketLatency, lastMessage } = useMqttBridge(farmId);

  const farmName = useMemo(
    () => farms.find((farm) => farm.id === farmId)?.farmName ?? "当前农场",
    [farmId, farms]
  );

  const refreshRuntime = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!farmId) {
        setTelemetryOverview([]);
        setLatestTelemetry([]);
        setCameras([]);
        setLoadingData(false);
        return false;
      }

      setLoadingData(true);

      try {
        const [overviewResponse, latestResponse, cameraResponse] = await Promise.all([
          fetchTelemetryOverview(farmId),
          fetchLatestTelemetry(farmId),
          fetchCameras(farmId)
        ]);

        setTelemetryOverview(overviewResponse);
        setLatestTelemetry(latestResponse);
        setCameras(cameraResponse);
        return true;
      } catch {
        if (!silent) {
          onLoadFailed();
        }
        return false;
      } finally {
        setLoadingData(false);
      }
    },
    [farmId, onLoadFailed]
  );

  useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshRuntime({ silent: true });
    }, SMART_DATA_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [farmId, refreshRuntime]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    setLatestTelemetry((current) => {
      const next = [
        lastMessage,
        ...current.filter(
          (item) =>
            item.deviceId !== lastMessage.deviceId ||
            normalizeMetricCode(item.metricCode) !==
              normalizeMetricCode(lastMessage.metricCode)
        )
      ];

      return next.slice(0, 12);
    });

    setTelemetryOverview((current) =>
      current.map((item) => patchOverviewWithTelemetry(item, lastMessage))
    );
  }, [lastMessage]);

  const runtime = useMemo<SmartDataRuntime>(
    () => ({
      farmId,
      farmName,
      loading: loadingData,
      telemetryOverview,
      latestTelemetry,
      cameras,
      socketState,
      socketLatency
    }),
    [
      cameras,
      farmId,
      farmName,
      latestTelemetry,
      loadingData,
      socketLatency,
      socketState,
      telemetryOverview
    ]
  );

  return {
    farmId,
    farmName,
    runtime,
    refreshRuntime
  };
};
