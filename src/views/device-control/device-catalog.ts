export type DeviceActionState = "ON" | "OFF";

export interface DeviceActionDefinition {
  key: string;
  label: string;
  commandCode: string;
  targetState: DeviceActionState;
  buildPayload: () => string;
}

export interface ControlDeviceDefinition {
  key: string;
  deviceCode: string;
  name: string;
  model: string;
  description: string;
  protocolType: string;
  reportTopic: string;
  commandTopic: string;
  capabilities: string[];
  actions: DeviceActionDefinition[];
}

export const CONTROL_DEVICE_CATALOG: ControlDeviceDefinition[] = [
  {
    key: "bearpi-hm-nano-d9",
    deviceCode: "bearpi-d9",
    name: "BearPi HM Nano 开发板",
    model: "D9_with_mqtt",
    description: "当前开发板通过 MQTT 直连本地 Broker，支持灯光开关并周期上报光照、温湿度与灯状态。",
    protocolType: "MQTT",
    reportTopic: "bearpi/d9/light/report",
    commandTopic: "bearpi/d9/light/cmd",
    capabilities: ["灯光开关", "光照上报", "温湿度上报", "命令回执"],
    actions: [
      {
        key: "turn-light-on",
        label: "开灯",
        commandCode: "LIGHT_ON",
        targetState: "ON",
        buildPayload: () => JSON.stringify({
          command_name: "Light_Control_Led",
          paras: {
            Led: "ON"
          }
        })
      },
      {
        key: "turn-light-off",
        label: "关灯",
        commandCode: "LIGHT_OFF",
        targetState: "OFF",
        buildPayload: () => JSON.stringify({
          command_name: "Light_Control_Led",
          paras: {
            Led: "OFF"
          }
        })
      }
    ]
  }
];

export const findDeviceAction = (
  device: ControlDeviceDefinition,
  targetState: DeviceActionState
) => device.actions.find((action) => action.targetState === targetState);
