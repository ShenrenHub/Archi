import { request } from "@/api/request";

export interface TelemetryIngestPayload {
  farmId: number;
  greenhouseId: number;
  deviceId: string | number;
  sensorDefinitionId: number;
  metricCode: string;
  metricValue: number;
  unit: string;
  collectedAt: string;
  sourceTraceId: string;
}

export interface LatestTelemetryItem {
  deviceId: string;
  greenhouseId: number;
  metricCode: string;
  metricValue: number;
  unit: string;
  collectedAt: string;
}

export interface TelemetryOverviewItem {
  greenhouseId: number;
  greenhouseName: string;
  temperature: number | null;
  humidity: number | null;
  lightLux: number | null;
}

export interface DeviceSnapshotItem {
  deviceId: string;
  greenhouseId: number | null;
  snapshotType: string;
  lastCollectedAt: string;
  snapshot: Record<string, unknown>;
}

export const ingestTelemetry = (payload: TelemetryIngestPayload) =>
  request.post<TelemetryIngestPayload, number>("/api/telemetry/ingest", payload);

export const fetchLatestTelemetry = (farmId: number) =>
  request.get<never, LatestTelemetryItem[]>(`/api/telemetry/latest?farmId=${farmId}`);

export const fetchTelemetryOverview = (farmId: number) =>
  request.get<never, TelemetryOverviewItem[]>(`/api/telemetry/overview?farmId=${farmId}`);

export const fetchDeviceSnapshots = (farmId: number) =>
  request.get<never, DeviceSnapshotItem[]>(`/api/telemetry/device-snapshots?farmId=${farmId}`);
