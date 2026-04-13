import MockAdapter from "axios-mock-adapter";
import dayjs from "dayjs";
import { request } from "@/api/request";
import type { AgentChatMessage } from "@/api/agent";
import type { AdminAlertLogItem, AdminDeviceItem } from "@/api/admin";
import type { DashboardOverview, DashboardTrendItem, GreenhouseSnapshot } from "@/api/dashboard";
import type { DeviceControlItem } from "@/api/device";
import type { StrategyLogItem, StrategyRule } from "@/api/strategy";
import type { VisionAlertItem } from "@/api/vision";

const mock = new MockAdapter(request, {
  delayResponse: 700
});

let deviceControls: DeviceControlItem[] = [
  {
    id: "light-01",
    name: "补光灯 A-01",
    type: "switch",
    online: true,
    statusText: "待命中",
    powerOn: true,
    description: "用于阴天和傍晚时段补足光照。"
  },
  {
    id: "fan-01",
    name: "通风电机 B-07",
    type: "switch",
    online: true,
    statusText: "低速巡航",
    powerOn: false,
    description: "用于降温与排湿，支持策略联动。"
  },
  {
    id: "temp-01",
    name: "目标温度设定",
    type: "slider",
    online: true,
    statusText: "自动控制",
    value: 24,
    min: 16,
    max: 35,
    unit: "°C",
    description: "设定环控系统目标温度。"
  }
];

let strategyRules: StrategyRule[] = [
  {
    id: "rule-1",
    name: "午后排湿通风",
    timeRange: ["12:00", "16:00"],
    lowLight: 1800,
    highHumidity: 78,
    action: "开启通风电机",
    enabled: true
  },
  {
    id: "rule-2",
    name: "清晨补光策略",
    timeRange: ["05:30", "08:00"],
    lowLight: 1200,
    highHumidity: 65,
    action: "开启补光灯",
    enabled: true
  }
];

let strategyLogs: StrategyLogItem[] = [
  {
    id: "log-1",
    strategyName: "午后排湿通风",
    result: "success",
    detail: "湿度 82%，已开启 2 号风机 15 分钟。",
    executedAt: dayjs().subtract(35, "minute").toISOString()
  },
  {
    id: "log-2",
    strategyName: "清晨补光策略",
    result: "warning",
    detail: "补光执行成功，但 3 号区域传感器回执延迟。",
    executedAt: dayjs().subtract(4, "hour").toISOString()
  }
];

let visionAlerts: VisionAlertItem[] = [
  {
    id: "alert-1",
    greenhouseName: "一号番茄棚",
    level: "high",
    issue: "叶片疑似霜霉病斑点扩散",
    createdAt: dayjs().subtract(18, "minute").toISOString(),
    pushedToExpert: false
  },
  {
    id: "alert-2",
    greenhouseName: "二号黄瓜棚",
    level: "medium",
    issue: "摄像头识别到持续遮挡，建议复核镜头角度",
    createdAt: dayjs().subtract(2, "hour").toISOString(),
    pushedToExpert: true
  }
];

let adminDevices: AdminDeviceItem[] = [
  {
    id: "admin-device-1",
    deviceCode: "SEN-TEMP-001",
    greenhouseName: "一号番茄棚",
    type: "温湿度传感器",
    status: "bound",
    updatedAt: dayjs().subtract(1, "day").toISOString()
  },
  {
    id: "admin-device-2",
    deviceCode: "CTRL-FAN-007",
    greenhouseName: "二号黄瓜棚",
    type: "通风控制器",
    status: "bound",
    updatedAt: dayjs().subtract(6, "hour").toISOString()
  },
  {
    id: "admin-device-3",
    deviceCode: "CAM-LEAF-010",
    greenhouseName: "未分配",
    type: "视觉摄像头",
    status: "unbound",
    updatedAt: dayjs().subtract(2, "day").toISOString()
  }
];

const adminAlertLogs: AdminAlertLogItem[] = [
  {
    id: "sys-alert-1",
    level: "high",
    source: "视觉告警",
    message: "一号番茄棚病斑告警连续触发 3 次。",
    createdAt: dayjs().subtract(20, "minute").toISOString()
  },
  {
    id: "sys-alert-2",
    level: "medium",
    source: "IoT 设备",
    message: "二号黄瓜棚风机回执延迟超过阈值。",
    createdAt: dayjs().subtract(3, "hour").toISOString()
  }
];

const dashboardOverview: DashboardOverview = {
  temperature: 24.8,
  humidity: 71.2,
  light: 2680,
  co2: 502,
  onlineDevices: 46,
  totalDevices: 52,
  activeAlerts: 3,
  greenhouseCount: 6
};

const dashboardTrends: DashboardTrendItem[] = Array.from({ length: 7 }).map((_, index) => ({
  date: dayjs().subtract(6 - index, "day").format("MM-DD"),
  temperature: 21 + Math.round(Math.random() * 5),
  humidity: 64 + Math.round(Math.random() * 16),
  light: 1800 + Math.round(Math.random() * 1200)
}));

const greenhouseSnapshots: GreenhouseSnapshot[] = [
  {
    id: "gh-1",
    name: "一号番茄棚",
    status: "healthy",
    temperature: 24.5,
    humidity: 70,
    light: 2830,
    crop: "樱桃番茄"
  },
  {
    id: "gh-2",
    name: "二号黄瓜棚",
    status: "warning",
    temperature: 27.1,
    humidity: 82,
    light: 1940,
    crop: "秋黄瓜"
  },
  {
    id: "gh-3",
    name: "三号叶菜棚",
    status: "healthy",
    temperature: 22.8,
    humidity: 68,
    light: 2350,
    crop: "奶油生菜"
  }
];

const createSuccess = <T>(data: T) => [200, { code: 0, message: "success", data }];

export const setupMockAPI = () => {
  mock.onGet("/dashboard/overview").reply(() => createSuccess(dashboardOverview));

  mock.onGet("/dashboard/trends").reply(() =>
    createSuccess({
      trends: dashboardTrends,
      greenhouses: greenhouseSnapshots
    })
  );

  mock.onGet("/device/controls").reply(() =>
    createSuccess({
      mqttState: "online",
      controls: deviceControls
    })
  );

  mock.onPost("/device/toggle").reply((config) => {
    const payload = JSON.parse(config.data) as { deviceId: string; powerOn: boolean };
    deviceControls = deviceControls.map((item) =>
      item.id === payload.deviceId
        ? {
            ...item,
            powerOn: payload.powerOn,
            statusText: payload.powerOn ? "执行成功，设备运行中" : "执行成功，设备已关闭"
          }
        : item
    );

    return createSuccess({
      deviceId: payload.deviceId,
      success: true,
      powerOn: payload.powerOn,
      statusText: payload.powerOn ? "MQTT 指令已确认，设备已开启" : "MQTT 指令已确认，设备已关闭"
    });
  });

  mock.onPost("/device/target-temperature").reply((config) => {
    const payload = JSON.parse(config.data) as { deviceId: string; targetTemperature: number };
    deviceControls = deviceControls.map((item) =>
      item.id === payload.deviceId
        ? {
            ...item,
            value: payload.targetTemperature,
            statusText: `目标温度已更新为 ${payload.targetTemperature}°C`
          }
        : item
    );

    return createSuccess({
      deviceId: payload.deviceId,
      success: true,
      targetTemperature: payload.targetTemperature,
      statusText: `温控策略已接收 ${payload.targetTemperature}°C`
    });
  });

  mock.onGet("/strategy/overview").reply(() =>
    createSuccess({
      rules: strategyRules,
      logs: strategyLogs
    })
  );

  mock.onPost("/strategy/rules").reply((config) => {
    const payload = JSON.parse(config.data) as Omit<StrategyRule, "id" | "enabled">;
    const nextRule: StrategyRule = {
      id: `rule-${Date.now()}`,
      enabled: true,
      ...payload
    };
    strategyRules = [nextRule, ...strategyRules];
    strategyLogs = [
      {
        id: `log-${Date.now()}`,
        strategyName: nextRule.name,
        result: "success",
        detail: "新规则已发布并进入待执行状态。",
        executedAt: dayjs().toISOString()
      },
      ...strategyLogs
    ];
    return createSuccess(nextRule);
  });

  mock.onPost("/vision/analyze").reply((config) => {
    const payload = JSON.parse(config.data) as { imageName: string };
    return createSuccess({
      imageUrl:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%230f172a'/><stop offset='1' stop-color='%2312b76a'/></linearGradient></defs><rect width='800' height='500' fill='url(%23g)' rx='36'/><circle cx='230' cy='180' r='110' fill='%2322c55e' fill-opacity='0.35'/><circle cx='530' cy='280' r='150' fill='%23f59e0b' fill-opacity='0.18'/><path d='M180 315c84-116 175-162 273-138 58 14 112 53 166 120' stroke='white' stroke-opacity='0.85' stroke-width='20' fill='none' stroke-linecap='round'/><path d='M280 144c-18 64 5 145 60 201' stroke='%23bbf7d0' stroke-width='12' fill='none' stroke-linecap='round'/><text x='60' y='70' fill='white' font-size='28' font-family='Segoe UI, Arial'>AI Leaf Analysis Mock</text></svg>",
      confidence: 93,
      obstruction: false,
      disease: "疑似早期叶斑病",
      suggestions: [
        `已完成 ${payload.imageName} 的模拟识别`,
        "建议复查叶片背面并结合湿度变化确认病害范围",
        "可优先对高湿区域执行短时通风与局部隔离"
      ]
    });
  });

  mock.onGet("/vision/alerts").reply(() => createSuccess(visionAlerts));

  mock.onPost("/vision/push-review").reply((config) => {
    const payload = JSON.parse(config.data) as { alertId: string };
    visionAlerts = visionAlerts.map((item) =>
      item.id === payload.alertId ? { ...item, pushedToExpert: true } : item
    );
    return createSuccess({
      success: true,
      alertId: payload.alertId
    });
  });

  mock.onPost("/agent/chat").reply((config) => {
    const payload = JSON.parse(config.data) as { question: string; history: AgentChatMessage[] };
    const answer = {
      id: `assistant-${Date.now()}`,
      role: "assistant" as const,
      createdAt: dayjs().toISOString(),
      content: `### 农事建议\n\n针对“${payload.question}”，建议先核查当前棚内 **温湿度** 与 **叶片正反面病斑分布**。\n\n1. 保持上午通风 10-15 分钟，降低持续高湿。\n2. 结合最近 3 天视觉告警，优先处理高风险棚区。\n3. 如果病斑扩展明显，可上传近景叶片图，进一步触发专家复核流程。\n\n> 模拟 RAG 已检索到作物健康、环境策略和设备回执三类知识片段。`
    };

    return createSuccess({
      answer,
      references: [
        "作物病害处置知识库 / 温室番茄叶片病斑识别手册",
        "环境联动规则库 / 高湿排风策略",
        `上下文消息数：${payload.history.length}`
      ]
    });
  });

  mock.onGet("/admin/overview").reply(() =>
    createSuccess({
      devices: adminDevices,
      alertLogs: adminAlertLogs
    })
  );

  mock.onPost("/admin/device-bind").reply((config) => {
    const payload = JSON.parse(config.data) as { deviceId: string };
    adminDevices = adminDevices.map((item) =>
      item.id === payload.deviceId
        ? {
            ...item,
            status: "bound",
            greenhouseName: "一号番茄棚",
            updatedAt: dayjs().toISOString()
          }
        : item
    );
    return createSuccess({
      success: true,
      deviceId: payload.deviceId
    });
  });

  mock.onPost("/admin/device-unbind").reply((config) => {
    const payload = JSON.parse(config.data) as { deviceId: string };
    adminDevices = adminDevices.map((item) =>
      item.id === payload.deviceId
        ? {
            ...item,
            status: "unbound",
            greenhouseName: "未分配",
            updatedAt: dayjs().toISOString()
          }
        : item
    );
    return createSuccess({
      success: true,
      deviceId: payload.deviceId
    });
  });
};
