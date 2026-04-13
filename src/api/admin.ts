import { request } from "@/api/request";

export type AdminDeviceType =
  | "sensor"
  | "light"
  | "fan"
  | "thermostat"
  | "camera";

export interface AdminDeviceItem {
  id: string;
  deviceCode: string;
  name: string;
  deviceType: AdminDeviceType;
  greenhouseName: string;
  protocol: "MQTT" | "RTSP" | "HTTP";
  status: "online" | "offline" | "pending";
  description: string;
  capabilities: string[];
  updatedAt: string;
}

export interface AdminAlertLogItem {
  id: string;
  level: "high" | "medium" | "low";
  source: string;
  message: string;
  createdAt: string;
}

export interface CreateManagedDeviceRequest {
  deviceCode: string;
  name: string;
  deviceType: AdminDeviceType;
  greenhouseName: string;
  protocol: "MQTT" | "RTSP" | "HTTP";
  description: string;
}

export interface DeleteManagedDeviceRequest {
  deviceId: string;
}

export interface AdminOverviewResponse {
  devices: AdminDeviceItem[];
  alertLogs: AdminAlertLogItem[];
}

/**
 * 业务场景 6:
 * 获取设备管理清单与系统全量告警日志，用于“增减设备 + 告警追溯”页面初始化。
 */
export const fetchAdminOverview = () =>
  request.get<never, AdminOverviewResponse>("/admin/overview");

/**
 * 业务场景 6:
 * 新增设备。添加成功后，系统需动态调整设备资产清单，必要时同步加入控制中心。
 */
export const createManagedDevice = (payload: CreateManagedDeviceRequest) =>
  request.post<CreateManagedDeviceRequest, AdminDeviceItem>(
    "/admin/devices",
    payload
  );

/**
 * 业务场景 6:
 * 删除设备。删除成功后，系统需同步移除相关资产状态与控制入口。
 */
export const deleteManagedDevice = (payload: DeleteManagedDeviceRequest) =>
  request.post<DeleteManagedDeviceRequest, { success: boolean; deviceId: string }>(
    "/admin/device-delete",
    payload
  );
