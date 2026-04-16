import { request } from "@/api/request";

export interface DashboardOverview {
  temperature: number;
  humidity: number;
  light: number;
  co2: number;
  onlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
  greenhouseCount: number;
}

export interface DashboardTrendItem {
  date: string;
  temperature: number;
  humidity: number;
  light: number;
}

export interface GreenhouseSnapshot {
  id: string;
  name: string;
  status: "healthy" | "warning";
  temperature: number;
  humidity: number;
  light: number;
  crop: string;
}

export interface DashboardTrendResponse {
  trends: DashboardTrendItem[];
  greenhouses: GreenhouseSnapshot[];
}

/**
 * 业务场景 1:
 * 获取多维度数据驾驶舱顶部实时指标卡片数据。
 */
export const fetchDashboardOverview = () =>
  request.get<never, DashboardOverview>("/api/dashboard/overview");

/**
 * 业务场景 1:
 * 获取过去 7 天环境趋势与多大棚监控摘要，用于折线图与侧边监测卡片。
 */
export const fetchDashboardTrends = () =>
  request.get<never, DashboardTrendResponse>("/api/dashboard/trends");
