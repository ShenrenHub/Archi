import { request } from "@/api/request";

export interface PlatformConfigItem {
  id: number;
  configKey: string;
  configValue: string;
  configScope: string;
  configRemark: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformConfigPayload {
  configKey: string;
  configValue: string;
  configScope: string;
  configRemark: string;
}

export const createPlatformConfig = (payload: CreatePlatformConfigPayload) =>
  request.post<CreatePlatformConfigPayload, number>("/api/platform/configs", payload);

export const fetchPlatformConfigs = () =>
  request.get<never, PlatformConfigItem[]>("/api/platform/configs");
