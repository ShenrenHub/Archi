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
    roles: ["farmer", "admin", "expert"],
    element: <DashboardPage />
  },
  {
    path: "/device-control",
    label: "控制命令中心",
    icon: <ControlOutlined />,
    roles: ["farmer", "admin"],
    element: <DeviceControlPage />
  },
  {
    path: "/strategy",
    label: "联动规则管理",
    icon: <BulbOutlined />,
    roles: ["farmer", "admin"],
    element: <StrategyPage />
  },
  {
    path: "/vision",
    label: "摄像头与视觉任务",
    icon: <CameraOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <VisionPage />
  },
  {
    path: "/vision-analysis",
    label: "视觉回调写回",
    icon: <CloudUploadOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <VisionAnalysisPage />
  },
  {
    path: "/expert-review",
    label: "专家复核提交",
    icon: <EyeOutlined />,
    roles: ["expert", "admin"],
    element: <ExpertReviewPage />
  },
  {
    path: "/agent",
    label: "农事问答",
    icon: <RobotOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <AgentPage />
  },
  {
    path: "/admin",
    label: "农场与平台管理",
    icon: <SafetyOutlined />,
    roles: ["admin", "farmer"],
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
