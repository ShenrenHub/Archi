import { request } from "@/api/request";

export interface CreateCommandPayload {
  farmId: number;
  greenhouseId: number;
  deviceId: string;
  idempotencyKey: string;
  commandCode: string;
  commandPayload: string;
}

export interface CommandItem {
  id: string;
  deviceId: string;
  commandCode: string;
  commandStatus: string;
  requestedAt: string;
  completedAt: string | null;
}

export interface ReceiptPayload {
  farmId: number;
  commandId: string;
  deviceId: string;
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
