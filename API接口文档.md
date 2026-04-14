# 农业温室大棚平台 API 接口文档

本文档基于以下内容整理：

- `项目2参考.md`
- 前端接口定义：`src/api/*.ts`
- 前端页面实际消费字段：`src/views/**/*.tsx`
- Mock 数据与行为：`src/mock/index.ts`

目标是让后端实现方可以直接按本文档复现接口，保证当前前端可无缝联调。

---

## 1. 接口总约定

### 1.1 Base URL

前端统一通过以下前缀访问业务接口：

```text
/api
```

例如：

```text
GET /api/dashboard/overview
POST /api/device/toggle
```

视觉 AI 外部服务单独使用一套前缀：

```text
/smartjavaai
```

对应完整接口：

```text
POST /smartjavaai/api/vision/analyze/base64
```

### 1.2 请求头

前端会自动附带：

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### 1.3 通用响应包裹格式

除 `SmartJavaAI` 外，所有 `/api` 业务接口都必须返回统一包裹：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 1.4 通用响应 Envelope JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "CommonApiResponse",
  "type": "object",
  "required": ["code", "message", "data"],
  "properties": {
    "code": {
      "type": "integer",
      "description": "0 表示成功，其余表示失败"
    },
    "message": {
      "type": "string"
    },
    "data": {}
  },
  "additionalProperties": true
}
```

### 1.5 时间字段约定

推荐统一返回 ISO 8601 字符串，例如：

```text
2026-04-14T09:30:00.000Z
```

### 1.6 枚举值必须保持一致

后端不要改成中文或大小写变体，前端按字面量判断，例如：

- `healthy`
- `warning`
- `online`
- `offline`
- `pending`
- `high`
- `medium`
- `low`
- `confirmed`
- `needs_recheck`

---

## 2. 接口总览

- `GET /api/dashboard/overview`
- `GET /api/dashboard/trends`
- `GET /api/device/controls`
- `POST /api/device/toggle`
- `POST /api/device/target-temperature`
- `GET /api/strategy/overview`
- `POST /api/strategy/rules`
- `POST /api/strategy/toggle`
- `POST /api/vision/analyze`
- `GET /api/vision/alerts`
- `POST /api/vision/push-review`
- `GET /api/vision/expert-review/tasks`
- `POST /api/vision/expert-review/submit`
- `POST /api/agent/chat`
- `GET /api/admin/overview`
- `POST /api/admin/devices`
- `POST /api/admin/device-delete`
- `POST /smartjavaai/api/vision/analyze/base64`

---

## 3. Dashboard

### 3.1 获取驾驶舱总览

#### URL

```http
GET /api/dashboard/overview
```

#### 功能介绍

返回首页顶部指标卡：温度、湿度、光照、CO2、在线设备数、设备总数、活跃告警数、大棚数。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DashboardOverviewRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DashboardOverview",
  "type": "object",
  "required": [
    "temperature",
    "humidity",
    "light",
    "co2",
    "onlineDevices",
    "totalDevices",
    "activeAlerts",
    "greenhouseCount"
  ],
  "properties": {
    "temperature": { "type": "number" },
    "humidity": { "type": "number" },
    "light": { "type": "number" },
    "co2": { "type": "number" },
    "onlineDevices": { "type": "integer" },
    "totalDevices": { "type": "integer" },
    "activeAlerts": { "type": "integer" },
    "greenhouseCount": { "type": "integer" }
  },
  "additionalProperties": false
}
```

### 3.2 获取 7 天趋势与多棚快照

#### URL

```http
GET /api/dashboard/trends
```

#### 功能介绍

返回折线图所需的 7 天趋势数据，以及右侧多棚快照数据。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DashboardTrendsRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DashboardTrendResponse",
  "type": "object",
  "required": ["trends", "greenhouses"],
  "properties": {
    "trends": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["date", "temperature", "humidity", "light"],
        "properties": {
          "date": { "type": "string" },
          "temperature": { "type": "number" },
          "humidity": { "type": "number" },
          "light": { "type": "number" }
        },
        "additionalProperties": false
      }
    },
    "greenhouses": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "status", "temperature", "humidity", "light", "crop"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "status": { "type": "string", "enum": ["healthy", "warning"] },
          "temperature": { "type": "number" },
          "humidity": { "type": "number" },
          "light": { "type": "number" },
          "crop": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

---

## 4. Device

### 4.1 获取控制面板设备状态

#### URL

```http
GET /api/device/controls
```

#### 功能介绍

初始化远程控制页，返回 MQTT 链路状态和可控设备列表。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DeviceControlsRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DeviceControlResponse",
  "type": "object",
  "required": ["mqttState", "controls"],
  "properties": {
    "mqttState": {
      "type": "string",
      "enum": ["connecting", "online", "offline"]
    },
    "controls": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "type", "online", "statusText", "description"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "type": { "type": "string", "enum": ["switch", "slider"] },
          "controlType": { "type": "string", "enum": ["light", "fan", "thermostat"] },
          "online": { "type": "boolean" },
          "statusText": { "type": "string" },
          "powerOn": { "type": "boolean" },
          "value": { "type": "number" },
          "min": { "type": "number" },
          "max": { "type": "number" },
          "unit": { "type": "string" },
          "description": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

### 4.2 开关类设备控制

#### URL

```http
POST /api/device/toggle
```

#### 功能介绍

用于开启或关闭补光灯、风机等开关型设备。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ToggleDeviceRequest",
  "type": "object",
  "required": ["deviceId", "powerOn"],
  "properties": {
    "deviceId": { "type": "string" },
    "powerOn": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DeviceCommandResult",
  "type": "object",
  "required": ["deviceId", "success", "statusText"],
  "properties": {
    "deviceId": { "type": "string" },
    "success": { "type": "boolean" },
    "statusText": { "type": "string" },
    "powerOn": { "type": "boolean" },
    "targetTemperature": { "type": "number" }
  },
  "additionalProperties": false
}
```

### 4.3 设置目标温度

#### URL

```http
POST /api/device/target-temperature
```

#### 功能介绍

设置温控类设备的目标温度。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "TargetTemperatureRequest",
  "type": "object",
  "required": ["deviceId", "targetTemperature"],
  "properties": {
    "deviceId": { "type": "string" },
    "targetTemperature": { "type": "number" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "TargetTemperatureResponse",
  "type": "object",
  "required": ["deviceId", "success", "statusText", "targetTemperature"],
  "properties": {
    "deviceId": { "type": "string" },
    "success": { "type": "boolean" },
    "statusText": { "type": "string" },
    "targetTemperature": { "type": "number" },
    "powerOn": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

---

## 5. Strategy

### 5.1 获取策略总览

#### URL

```http
GET /api/strategy/overview
```

#### 功能介绍

返回当前联动规则列表和执行日志列表。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "StrategyOverviewRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "StrategyListResponse",
  "type": "object",
  "required": ["rules", "logs"],
  "properties": {
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "timeRange", "lowLight", "highHumidity", "action", "enabled"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "timeRange": {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": { "type": "string" }
          },
          "lowLight": { "type": "number" },
          "highHumidity": { "type": "number" },
          "action": { "type": "string" },
          "enabled": { "type": "boolean" }
        },
        "additionalProperties": false
      }
    },
    "logs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "strategyName", "result", "detail", "executedAt"],
        "properties": {
          "id": { "type": "string" },
          "strategyName": { "type": "string" },
          "result": { "type": "string", "enum": ["success", "warning"] },
          "detail": { "type": "string" },
          "executedAt": { "type": "string", "format": "date-time" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

### 5.2 创建联动策略

#### URL

```http
POST /api/strategy/rules
```

#### 功能介绍

创建新的联动策略。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "StrategyCreateRequest",
  "type": "object",
  "required": ["name", "timeRange", "lowLight", "highHumidity", "action"],
  "properties": {
    "name": { "type": "string" },
    "timeRange": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "string" }
    },
    "lowLight": { "type": "number" },
    "highHumidity": { "type": "number" },
    "action": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "StrategyRule",
  "type": "object",
  "required": ["id", "name", "timeRange", "lowLight", "highHumidity", "action", "enabled"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "timeRange": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "string" }
    },
    "lowLight": { "type": "number" },
    "highHumidity": { "type": "number" },
    "action": { "type": "string" },
    "enabled": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

### 5.3 启用/停用策略

#### URL

```http
POST /api/strategy/toggle
```

#### 功能介绍

切换指定策略的启用状态。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ToggleStrategyRequest",
  "type": "object",
  "required": ["ruleId", "enabled"],
  "properties": {
    "ruleId": { "type": "string" },
    "enabled": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ToggleStrategyResponse",
  "type": "object",
  "required": ["id", "name", "timeRange", "lowLight", "highHumidity", "action", "enabled"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "timeRange": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "string" }
    },
    "lowLight": { "type": "number" },
    "highHumidity": { "type": "number" },
    "action": { "type": "string" },
    "enabled": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

---

## 6. Vision

### 6.1 图片视觉分析

#### URL

```http
POST /api/vision/analyze
```

#### 功能介绍

上传叶片图片的 base64 文本，返回病害、遮挡、建议等结构化结果。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionAnalyzeRequest",
  "type": "object",
  "required": ["imageName", "imageBase64"],
  "properties": {
    "imageName": { "type": "string" },
    "imageBase64": { "type": "string" },
    "source": { "type": "string", "enum": ["mock", "smartjavaai"] }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionAnalyzeResponse",
  "type": "object",
  "required": ["imageUrl", "confidence", "obstruction", "disease", "suggestions"],
  "properties": {
    "imageUrl": { "type": "string" },
    "confidence": { "type": "number" },
    "obstruction": { "type": "boolean" },
    "disease": { "type": "string" },
    "suggestions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "requestId": { "type": "string" },
    "source": { "type": "string", "enum": ["mock", "smartjavaai"] },
    "reviewRecommended": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

### 6.2 获取视觉异常告警列表

#### URL

```http
GET /api/vision/alerts
```

#### 功能介绍

返回视觉异常告警列表。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionAlertsRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionAlertList",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "greenhouseName", "level", "issue", "createdAt", "pushedToExpert"],
    "properties": {
      "id": { "type": "string" },
      "greenhouseName": { "type": "string" },
      "level": { "type": "string", "enum": ["high", "medium", "low"] },
      "issue": { "type": "string" },
      "createdAt": { "type": "string", "format": "date-time" },
      "pushedToExpert": { "type": "boolean" }
    },
    "additionalProperties": false
  }
}
```

### 6.3 推送专家复核

#### URL

```http
POST /api/vision/push-review
```

#### 功能介绍

把某条视觉告警转成专家复核任务。建议幂等处理。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "PushReviewRequest",
  "type": "object",
  "required": ["alertId"],
  "properties": {
    "alertId": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "PushReviewResponse",
  "type": "object",
  "required": ["success", "alertId"],
  "properties": {
    "success": { "type": "boolean" },
    "alertId": { "type": "string" }
  },
  "additionalProperties": false
}
```

### 6.4 获取专家复核任务列表

#### URL

```http
GET /api/vision/expert-review/tasks
```

#### 功能介绍

返回专家工作台任务列表。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ExpertReviewTasksRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ExpertReviewTaskList",
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "id",
      "alertId",
      "greenhouseName",
      "cropName",
      "issue",
      "aiSummary",
      "disease",
      "confidence",
      "createdAt",
      "status",
      "priority",
      "imageUrl"
    ],
    "properties": {
      "id": { "type": "string" },
      "alertId": { "type": "string" },
      "greenhouseName": { "type": "string" },
      "cropName": { "type": "string" },
      "issue": { "type": "string" },
      "aiSummary": { "type": "string" },
      "disease": { "type": "string" },
      "confidence": { "type": "number" },
      "createdAt": { "type": "string", "format": "date-time" },
      "status": { "type": "string", "enum": ["pending", "reviewed"] },
      "priority": { "type": "string", "enum": ["high", "medium", "low"] },
      "imageUrl": { "type": "string" },
      "expertSuggestion": { "type": "string" },
      "reviewedAt": { "type": "string", "format": "date-time" }
    },
    "additionalProperties": false
  }
}
```

### 6.5 提交专家复核结果

#### URL

```http
POST /api/vision/expert-review/submit
```

#### 功能介绍

专家提交复核结论和建议。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "SubmitExpertReviewRequest",
  "type": "object",
  "required": ["taskId", "suggestion", "conclusion"],
  "properties": {
    "taskId": { "type": "string" },
    "suggestion": { "type": "string" },
    "conclusion": { "type": "string", "enum": ["confirmed", "needs_recheck"] }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "SubmitExpertReviewResponse",
  "type": "object",
  "required": [
    "id",
    "alertId",
    "greenhouseName",
    "cropName",
    "issue",
    "aiSummary",
    "disease",
    "confidence",
    "createdAt",
    "status",
    "priority",
    "imageUrl"
  ],
  "properties": {
    "id": { "type": "string" },
    "alertId": { "type": "string" },
    "greenhouseName": { "type": "string" },
    "cropName": { "type": "string" },
    "issue": { "type": "string" },
    "aiSummary": { "type": "string" },
    "disease": { "type": "string" },
    "confidence": { "type": "number" },
    "createdAt": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["pending", "reviewed"] },
    "priority": { "type": "string", "enum": ["high", "medium", "low"] },
    "imageUrl": { "type": "string" },
    "expertSuggestion": { "type": "string" },
    "reviewedAt": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

---

## 7. Agent

### 7.1 农事问答

#### URL

```http
POST /api/agent/chat
```

#### 功能介绍

提交问题和历史对话，上游可对接 RAG + LLM。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "AgentChatRequest",
  "type": "object",
  "required": ["question", "history"],
  "properties": {
    "question": { "type": "string" },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "role", "content", "createdAt"],
        "properties": {
          "id": { "type": "string" },
          "role": { "type": "string", "enum": ["user", "assistant"] },
          "content": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "AgentChatResponse",
  "type": "object",
  "required": ["answer", "references"],
  "properties": {
    "answer": {
      "type": "object",
      "required": ["id", "role", "content", "createdAt"],
      "properties": {
        "id": { "type": "string" },
        "role": { "type": "string", "enum": ["assistant"] },
        "content": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "additionalProperties": false
    },
    "references": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false
}
```

---

## 8. Admin

### 8.1 获取设备管理总览

#### URL

```http
GET /api/admin/overview
```

#### 功能介绍

返回设备资产列表和系统告警日志。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "AdminOverviewRequest",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "AdminOverviewResponse",
  "type": "object",
  "required": ["devices", "alertLogs"],
  "properties": {
    "devices": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "deviceCode",
          "name",
          "deviceType",
          "greenhouseName",
          "protocol",
          "status",
          "description",
          "capabilities",
          "updatedAt"
        ],
        "properties": {
          "id": { "type": "string" },
          "deviceCode": { "type": "string" },
          "name": { "type": "string" },
          "deviceType": { "type": "string", "enum": ["sensor", "light", "fan", "thermostat", "camera"] },
          "greenhouseName": { "type": "string" },
          "protocol": { "type": "string", "enum": ["MQTT", "RTSP", "HTTP"] },
          "status": { "type": "string", "enum": ["online", "offline", "pending"] },
          "description": { "type": "string" },
          "capabilities": {
            "type": "array",
            "items": { "type": "string" }
          },
          "updatedAt": { "type": "string", "format": "date-time" }
        },
        "additionalProperties": false
      }
    },
    "alertLogs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "source", "message", "createdAt"],
        "properties": {
          "id": { "type": "string" },
          "level": { "type": "string", "enum": ["high", "medium", "low"] },
          "source": { "type": "string" },
          "message": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

### 8.2 新增设备

#### URL

```http
POST /api/admin/devices
```

#### 功能介绍

新增设备资产。若新增的是 `light`、`fan`、`thermostat`，建议同步进入设备控制中心。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "CreateManagedDeviceRequest",
  "type": "object",
  "required": ["deviceCode", "name", "deviceType", "greenhouseName", "protocol", "description"],
  "properties": {
    "deviceCode": { "type": "string" },
    "name": { "type": "string" },
    "deviceType": { "type": "string", "enum": ["sensor", "light", "fan", "thermostat", "camera"] },
    "greenhouseName": { "type": "string" },
    "protocol": { "type": "string", "enum": ["MQTT", "RTSP", "HTTP"] },
    "description": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "CreateManagedDeviceResponse",
  "type": "object",
  "required": [
    "id",
    "deviceCode",
    "name",
    "deviceType",
    "greenhouseName",
    "protocol",
    "status",
    "description",
    "capabilities",
    "updatedAt"
  ],
  "properties": {
    "id": { "type": "string" },
    "deviceCode": { "type": "string" },
    "name": { "type": "string" },
    "deviceType": { "type": "string", "enum": ["sensor", "light", "fan", "thermostat", "camera"] },
    "greenhouseName": { "type": "string" },
    "protocol": { "type": "string", "enum": ["MQTT", "RTSP", "HTTP"] },
    "status": { "type": "string", "enum": ["online", "offline", "pending"] },
    "description": { "type": "string" },
    "capabilities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

### 8.3 删除设备

#### URL

```http
POST /api/admin/device-delete
```

#### 功能介绍

删除指定设备。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DeleteManagedDeviceRequest",
  "type": "object",
  "required": ["deviceId"],
  "properties": {
    "deviceId": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "DeleteManagedDeviceResponse",
  "type": "object",
  "required": ["success", "deviceId"],
  "properties": {
    "success": { "type": "boolean" },
    "deviceId": { "type": "string" }
  },
  "additionalProperties": false
}
```

---

## 9. SmartJavaAI 外部接口

### 9.1 Base64 图片分析

#### URL

```http
POST /smartjavaai/api/vision/analyze/base64
```

#### 功能介绍

预留给真实视觉 AI 服务的外部接口，不走 `/api` 通用 envelope。

#### Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "SmartJavaAiAnalyzeRequest",
  "type": "object",
  "required": ["imageName", "imageBase64"],
  "properties": {
    "imageName": { "type": "string" },
    "imageBase64": { "type": "string" },
    "greenhouseName": { "type": "string" },
    "traceId": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### Response JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "SmartJavaAiAnalyzeResponse",
  "type": "object",
  "required": [
    "success",
    "requestId",
    "model",
    "disease",
    "obstruction",
    "confidence",
    "summary",
    "suggestions",
    "regions"
  ],
  "properties": {
    "success": { "type": "boolean" },
    "requestId": { "type": "string" },
    "model": { "type": "string" },
    "disease": { "type": "string" },
    "obstruction": { "type": "boolean" },
    "confidence": { "type": "number" },
    "summary": { "type": "string" },
    "suggestions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "regions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["label", "confidence", "bbox"],
        "properties": {
          "label": { "type": "string" },
          "confidence": { "type": "number" },
          "bbox": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
            "items": { "type": "number" }
          }
        },
        "additionalProperties": false
      }
    },
    "rawPayload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
}
```

---

## 10. 建议补充接口

### 10.1 摄像头实时画面接口

当前前端 `CameraPlayer` 还是占位组件，没有真实请求视频流接口。参考项目 2 明确需要摄像头实况，因此建议后端补这个接口。

#### 建议 URL

```http
GET /api/vision/streams/:greenhouseId
```

#### 建议 Request JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionStreamRequest",
  "type": "object",
  "required": ["greenhouseId"],
  "properties": {
    "greenhouseId": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### 建议 Response `data` JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "VisionStreamInfo",
  "type": "object",
  "required": ["greenhouseId", "greenhouseName", "streamType", "playUrl", "status"],
  "properties": {
    "greenhouseId": { "type": "string" },
    "greenhouseName": { "type": "string" },
    "streamType": { "type": "string", "enum": ["webrtc", "hls", "flv", "rtsp-proxy"] },
    "playUrl": { "type": "string" },
    "status": { "type": "string", "enum": ["online", "offline", "loading"] },
    "snapshotUrl": { "type": "string" },
    "resolution": { "type": "string" },
    "latencyMs": { "type": "integer" }
  },
  "additionalProperties": false
}
```

---

## 11. 后端复现注意事项

1. 所有 `/api/*` 接口都返回 `{ code, message, data }`。
2. 所有枚举值必须和前端代码保持一致。
3. 时间字段统一返回 ISO 8601 字符串。
4. `POST /api/vision/analyze` 的 `confidence` 应返回百分比数值，例如 `93`，不要返回 `0.93`。
5. `GET /api/device/controls` 最好至少有一个 `type = "slider"` 的设备，不然温控区块会是空的。
6. `POST /api/vision/push-review` 建议做幂等。
7. `POST /api/admin/devices` 若新增控制类设备，建议同步纳入 `/api/device/controls`。
