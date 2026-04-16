import { request } from "@/api/request";

export interface DeviceItem {
  id: number;
  farmId: number;
  greenhouseId: number | null;
  deviceCode: string;
  deviceName: string;
  protocolType: string;
  onlineStatus: string;
}

export interface RegisterDevicePayload {
  farmId: number;
  greenhouseId: number;
  deviceTypeId: number;
  deviceCode: string;
  deviceName: string;
  protocolType: string;
  integrationMode: string;
}

export interface BindDevicePayload {
  farmId: number;
  deviceId: number;
  greenhouseId: number;
}

export const registerDevice = (payload: RegisterDevicePayload) =>
  request.post<RegisterDevicePayload, number>("/api/devices/register", payload);

export const bindDevice = (payload: BindDevicePayload) =>
  request.post<BindDevicePayload, number>("/api/devices/bind", payload);

export const fetchDevices = (farmId: number) =>
  request.get<never, DeviceItem[]>(`/api/devices?farmId=${farmId}`);
