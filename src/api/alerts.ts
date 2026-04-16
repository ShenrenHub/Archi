import { request } from "@/api/request";

export interface AlertItem {
  id: number;
  greenhouseId: number;
  sourceType: string;
  alertLevel: string;
  alertTitle: string;
  alertStatus: string;
  lastOccurredAt: string;
}

export interface CloseAlertPayload {
  alertId: number;
  farmId: number;
  closeRemark: string;
}

interface FetchAlertsOptions {
  limit?: number;
}

export const fetchAlerts = (farmId: number, options: FetchAlertsOptions = {}) => {
  const searchParams = new URLSearchParams({ farmId: String(farmId) });

  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }

  return request.get<never, AlertItem[]>(`/api/alerts?${searchParams.toString()}`);
};

export const fetchOpenAlertCount = (farmId: number) =>
  request.get<never, number>(`/api/alerts/open-count?farmId=${farmId}`);

export const closeAlert = (payload: CloseAlertPayload) =>
  request.patch<CloseAlertPayload, null>("/api/alerts/close", payload);
