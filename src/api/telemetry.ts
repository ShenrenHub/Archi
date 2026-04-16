import { request } from "@/api/request";

export interface TelemetryIngestPayload {
  farmId: number;
  greenhouseId: number;
  deviceId: number;
  sensorDefinitionId: number;
  metricCode: string;
  metricValue: number;
  unit: string;
  collectedAt: string;
  sourceTraceId: string;
}

export interface LatestTelemetryItem {
  deviceId: number;
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

export const ingestTelemetry = (payload: TelemetryIngestPayload) =>
  request.post<TelemetryIngestPayload, number>("/api/telemetry/ingest", payload);

export const fetchLatestTelemetry = (farmId: number) =>
  request.get<never, LatestTelemetryItem[]>(`/api/telemetry/latest?farmId=${farmId}`);

export const fetchTelemetryOverview = (farmId: number) =>
  request.get<never, TelemetryOverviewItem[]>(`/api/telemetry/overview?farmId=${farmId}`);
