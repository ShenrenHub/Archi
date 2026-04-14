import type { ReactNode } from "react";
import {
  AlertOutlined,
  AppstoreOutlined,
  BulbOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  ControlOutlined,
  EyeOutlined,
  RobotOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import type { Role } from "@/types/common";
import DashboardPage from "@/views/dashboard";
import DeviceControlPage from "@/views/device-control";
import StrategyPage from "@/views/strategy";
import VisionPage from "@/views/vision";
import VisionAnalysisPage from "@/views/vision-analysis";
import AgentPage from "@/views/agent";
import AdminPage from "@/views/admin";
import ExpertReviewPage from "@/views/expert-review";

export interface AppRouteItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  element: ReactNode;
}

export const appRoutes: AppRouteItem[] = [
  {
    path: "/dashboard",
    label: "数据驾驶舱",
    icon: <AppstoreOutlined />,
    roles: ["farmer", "admin"],
    element: <DashboardPage />
  },
  {
    path: "/device-control",
    label: "设备控制中心",
    icon: <ControlOutlined />,
    roles: ["farmer"],
    element: <DeviceControlPage />
  },
  {
    path: "/strategy",
    label: "联动策略管理",
    icon: <BulbOutlined />,
    roles: ["farmer", "admin"],
    element: <StrategyPage />
  },
  {
    path: "/vision",
    label: "视觉监测告警",
    icon: <CameraOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <VisionPage />
  },
  {
    path: "/vision-analysis",
    label: "图片健康检测",
    icon: <CloudUploadOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <VisionAnalysisPage />
  },
  {
    path: "/expert-review",
    label: "专家复核",
    icon: <EyeOutlined />,
    roles: ["expert", "admin"],
    element: <ExpertReviewPage />
  },
  {
    path: "/agent",
    label: "农事问答智能体",
    icon: <RobotOutlined />,
    roles: ["farmer", "expert"],
    element: <AgentPage />
  },
  {
    path: "/admin",
    label: "设备管理",
    icon: <SafetyOutlined />,
    roles: ["admin"],
    element: <AdminPage />
  }
];

export const getVisibleRoutes = (role: Role) =>
  appRoutes.filter((route) => route.roles.includes(role));

export const getDefaultRoute = (role: Role) =>
  getVisibleRoutes(role)[0]?.path ?? "/403";

export const fallbackRoute = {
  path: "/403",
  label: "权限受限",
  icon: <AlertOutlined />
};
