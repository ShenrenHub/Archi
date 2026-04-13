import { request } from "@/api/request";

export interface DeviceControlItem {
  id: string;
  name: string;
  type: "switch" | "slider";
  online: boolean;
  statusText: string;
  powerOn?: boolean;
  value?: number;
  min?: number;
  max?: number;
  unit?: string;
  description: string;
}

export interface DeviceControlResponse {
  mqttState: "connecting" | "online" | "offline";
  controls: DeviceControlItem[];
}

export interface ToggleDeviceRequest {
  deviceId: string;
  powerOn: boolean;
}

export interface TargetTemperatureRequest {
  deviceId: string;
  targetTemperature: number;
}

export interface DeviceCommandResult {
  deviceId: string;
  success: boolean;
  statusText: string;
  powerOn?: boolean;
  targetTemperature?: number;
}

/**
 * 业务场景 2:
 * 查询远程控制中心中所有设备的当前状态，初始化控制面板与 MQTT 在线状态。
 */
export const fetchDeviceControls = () =>
  request.get<never, DeviceControlResponse>("/device/controls");

/**
 * 业务场景 2:
 * 下发开关类设备 MQTT 指令，前端需等待执行结果反馈后再更新界面。
 */
export const toggleDevicePower = (payload: ToggleDeviceRequest) =>
  request.post<ToggleDeviceRequest, DeviceCommandResult>("/device/toggle", payload);

/**
 * 业务场景 2:
 * 下发目标温度设定指令，常用于滑动条交互的确认提交。
 */
export const setTargetTemperature = (payload: TargetTemperatureRequest) =>
  request.post<TargetTemperatureRequest, DeviceCommandResult>(
    "/device/target-temperature",
    payload
  );
