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

export const fetchAlerts = (farmId: number) =>
  request.get<never, AlertItem[]>(`/api/alerts?farmId=${farmId}`);

export const closeAlert = (payload: CloseAlertPayload) =>
  request.patch<CloseAlertPayload, null>("/api/alerts/close", payload);
