import { request } from "@/api/request";

export interface StrategyRule {
  id: string;
  name: string;
  timeRange: [string, string];
  lowLight: number;
  highHumidity: number;
  action: string;
  enabled: boolean;
}

export interface StrategyLogItem {
  id: string;
  strategyName: string;
  result: "success" | "warning";
  detail: string;
  executedAt: string;
}

export interface StrategyCreateRequest {
  name: string;
  timeRange: [string, string];
  lowLight: number;
  highHumidity: number;
  action: string;
}

export interface ToggleStrategyRequest {
  ruleId: string;
  enabled: boolean;
}

export interface StrategyListResponse {
  rules: StrategyRule[];
  logs: StrategyLogItem[];
}

/**
 * 业务场景 3:
 * 获取联动规则列表与执行日志，渲染策略管理页面的表格区。
 */
export const fetchStrategyOverview = () =>
  request.get<never, StrategyListResponse>("/strategy/overview");

/**
 * 业务场景 3:
 * 提交新的智能联动规则配置。
 */
export const createStrategyRule = (payload: StrategyCreateRequest) =>
  request.post<StrategyCreateRequest, StrategyRule>("/strategy/rules", payload);

/**
 * 业务场景 3:
 * 停用或启用联动策略。常用于任务列表中的即时状态切换，并要求同步追加执行日志。
 */
export const toggleStrategyRule = (payload: ToggleStrategyRequest) =>
  request.post<ToggleStrategyRequest, StrategyRule>("/strategy/toggle", payload);
