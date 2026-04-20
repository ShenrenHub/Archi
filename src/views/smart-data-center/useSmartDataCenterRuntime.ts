import { useCallback, useEffect, useMemo, useState } from "react";
import { createCommand, fetchCommands, type CommandItem } from "@/api/control";
import { fetchDevices, type DeviceItem } from "@/api/device";
import {
  fetchDeviceSnapshots,
  fetchLatestTelemetry,
  type DeviceSnapshotItem,
  type LatestTelemetryItem
} from "@/api/telemetry";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useUserStore } from "@/store/user";
import {
  CONTROL_DEVICE_CATALOG,
  findDeviceAction,
  type DeviceActionState
} from "@/views/device-control/device-catalog";
import {
  LIGHT_METRIC_CODES,
  mergeTelemetryHistory,
  normalizeMetricCode,
  pickLatestMetric,
  type SmartDataRuntime
} from "./model";

const SMART_DATA_POLL_INTERVAL_MS = 8000;
const BOARD_LIGHT_DEVICE = CONTROL_DEVICE_CATALOG[0];

const readLightState = (snapshot: Record<string, unknown> | undefined): DeviceActionState | null => {
  const rawValue = snapshot?.lightStatus ?? snapshot?.LightStatus;
  if (typeof rawValue !== "string") {
    return null;
  }

  if (rawValue.toUpperCase() === "ON") {
    return "ON";
  }

  if (rawValue.toUpperCase() === "OFF") {
    return "OFF";
  }

  return null;
};

interface SmartDataCenterRuntimeResult {
  runtime: SmartDataRuntime;
  refreshRuntime: (options?: { silent?: boolean }) => Promise<boolean>;
  toggleBoardLight: (targetState: DeviceActionState) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

export const useSmartDataCenterRuntime = (
  onLoadFailed?: () => void
): SmartDataCenterRuntimeResult => {
  const farmId = useUserStore((state) => state.farmId);
  const farms = useUserStore((state) => state.farms);
  const [latestTelemetry, setLatestTelemetry] = useState<LatestTelemetryItem[]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<LatestTelemetryItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [snapshots, setSnapshots] = useState<DeviceSnapshotItem[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [pendingLightState, setPendingLightState] = useState<DeviceActionState | null>(null);
  const [submittingLightCommand, setSubmittingLightCommand] = useState(false);
  const { state: socketState, latency: socketLatency, lastMessage } = useMqttBridge(farmId);

  const farmName = useMemo(
    () => farms.find((farm) => farm.id === farmId)?.farmName ?? "当前农场",
    [farmId, farms]
  );

  const refreshRuntime = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!farmId) {
        setLatestTelemetry([]);
        setTelemetryHistory([]);
        setDevices([]);
        setSnapshots([]);
        setCommands([]);
        setLoadingData(false);
        return false;
      }

      setLoadingData(true);

      try {
        const [nextTelemetry, nextDevices, nextSnapshots, nextCommands] = await Promise.all([
          fetchLatestTelemetry(farmId),
          fetchDevices(farmId),
          fetchDeviceSnapshots(farmId),
          fetchCommands(farmId)
        ]);
        setLatestTelemetry(nextTelemetry);
        setTelemetryHistory((current) => mergeTelemetryHistory(current, nextTelemetry));
        setDevices(nextDevices);
        setSnapshots(nextSnapshots);
        setCommands(nextCommands);
        return true;
      } catch {
        if (!silent) {
          onLoadFailed?.();
        }
        return false;
      } finally {
        setLoadingData(false);
      }
    },
    [farmId, onLoadFailed]
  );

  useEffect(() => {
    setTelemetryHistory([]);
    setPendingLightState(null);
    setSubmittingLightCommand(false);
  }, [farmId]);

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

      return next.slice(0, 24);
    });
    setTelemetryHistory((current) => mergeTelemetryHistory(current, [lastMessage]));
  }, [lastMessage]);

  const boardLightRuntime = useMemo(() => {
    const boardDevice = devices.find((item) => item.deviceCode === BOARD_LIGHT_DEVICE.deviceCode);
    const boardSnapshot = boardDevice
      ? snapshots.find((item) => item.deviceId === boardDevice.id)
      : undefined;
    const lastCommand = boardDevice
      ? commands.find((item) => item.deviceId === boardDevice.id)
      : undefined;
    const actualLightState = readLightState(boardSnapshot?.snapshot);
    const state = pendingLightState ?? actualLightState ?? null;

    return {
      available: Boolean(boardDevice),
      pending: submittingLightCommand,
      online: boardDevice?.onlineStatus === "ONLINE",
      state,
      deviceId: boardDevice?.id ?? null,
      deviceName: boardDevice?.deviceName ?? BOARD_LIGHT_DEVICE.name,
      greenhouseId: boardDevice?.greenhouseId ?? null,
      greenhouseName: null,
      lastCommandStatus: lastCommand?.commandStatus ?? null
    };
  }, [commands, devices, pendingLightState, snapshots, submittingLightCommand]);

  useEffect(() => {
    if (!pendingLightState) {
      return;
    }

    if (
      boardLightRuntime.state === pendingLightState ||
      boardLightRuntime.lastCommandStatus === "FAILED"
    ) {
      setPendingLightState(null);
      setSubmittingLightCommand(false);
    }
  }, [boardLightRuntime.lastCommandStatus, boardLightRuntime.state, pendingLightState]);

  const toggleBoardLight = useCallback(
    async (targetState: DeviceActionState) => {
      if (!farmId) {
        return {
          ok: false,
          message: "请先选择农场。"
        };
      }

      const boardDevice = devices.find((item) => item.deviceCode === BOARD_LIGHT_DEVICE.deviceCode);

      if (!boardDevice || !boardDevice.greenhouseId) {
        return {
          ok: false,
          message: "开发板尚未接入或未绑定大棚。"
        };
      }

      const action = findDeviceAction(BOARD_LIGHT_DEVICE, targetState);

      if (!action) {
        return {
          ok: false,
          message: "当前开发板未配置该灯控动作。"
        };
      }

      setPendingLightState(targetState);
      setSubmittingLightCommand(true);

      try {
        await createCommand({
          farmId,
          greenhouseId: boardDevice.greenhouseId,
          deviceId: boardDevice.id,
          idempotencyKey: `smart-data-${boardDevice.id}-${Date.now()}`,
          commandCode: action.commandCode,
          commandPayload: action.buildPayload()
        });
        void refreshRuntime({ silent: true });

        return {
          ok: true,
          message: targetState === "ON" ? "开灯命令已下发。" : "关灯命令已下发。"
        };
      } catch {
        setPendingLightState(null);
        setSubmittingLightCommand(false);

        return {
          ok: false,
          message: "灯控命令下发失败，请稍后重试。"
        };
      }
    },
    [devices, farmId, refreshRuntime]
  );

  const runtime = useMemo<SmartDataRuntime>(
    () => ({
      farmId,
      farmName,
      loading: loadingData,
      latestTelemetry,
      telemetryHistory,
      metrics: {
        temperature: pickLatestMetric(latestTelemetry, ["temperature"]),
        humidity: pickLatestMetric(latestTelemetry, ["humidity"]),
        light: pickLatestMetric(latestTelemetry, LIGHT_METRIC_CODES)
      },
      boardLight: boardLightRuntime,
      socketState,
      socketLatency
    }),
    [
      boardLightRuntime,
      farmId,
      farmName,
      latestTelemetry,
      loadingData,
      socketLatency,
      socketState,
      telemetryHistory
    ]
  );

  return {
    runtime,
    refreshRuntime,
    toggleBoardLight
  };
};
