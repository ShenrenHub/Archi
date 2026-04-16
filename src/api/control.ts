import { request } from "@/api/request";

export interface CreateCommandPayload {
  farmId: number;
  greenhouseId: number;
  deviceId: number;
  idempotencyKey: string;
  commandCode: string;
  commandPayload: string;
}

export interface CommandItem {
  id: number;
  deviceId: number;
  commandCode: string;
  commandStatus: string;
  requestedAt: string;
  completedAt: string | null;
}

export interface ReceiptPayload {
  farmId: number;
  commandId: number;
  deviceId: number;
  resultCode: string;
  resultMessage: string;
  rawPayload: string;
}

export const createCommand = (payload: CreateCommandPayload) =>
  request.post<CreateCommandPayload, number>("/api/control/commands", payload);

export const fetchCommands = (farmId: number) =>
  request.get<never, CommandItem[]>(`/api/control/commands?farmId=${farmId}`);

export const submitReceipt = (payload: ReceiptPayload) =>
  request.patch<ReceiptPayload, null>("/api/control/receipts", payload);
