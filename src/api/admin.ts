import { request } from "@/api/request";

export interface AdminDeviceItem {
  id: string;
  deviceCode: string;
  greenhouseName: string;
  type: string;
  status: "bound" | "unbound";
  updatedAt: string;
}

export interface AdminAlertLogItem {
  id: string;
  level: "high" | "medium" | "low";
  source: string;
  message: string;
  createdAt: string;
}

export interface DeviceBindingRequest {
  deviceId: string;
}

export interface AdminOverviewResponse {
  devices: AdminDeviceItem[];
  alertLogs: AdminAlertLogItem[];
}

/**
 * 业务场景 6:
 * 获取设备绑定清单与系统全量告警日志。
 */
export const fetchAdminOverview = () =>
  request.get<never, AdminOverviewResponse>("/admin/overview");

/**
 * 业务场景 6:
 * 执行设备绑定操作。
 */
export const bindDevice = (payload: DeviceBindingRequest) =>
  request.post<DeviceBindingRequest, { success: boolean; deviceId: string }>(
    "/admin/device-bind",
    payload
  );

/**
 * 业务场景 6:
 * 执行设备解绑操作。
 */
export const unbindDevice = (payload: DeviceBindingRequest) =>
  request.post<DeviceBindingRequest, { success: boolean; deviceId: string }>(
    "/admin/device-unbind",
    payload
  );
