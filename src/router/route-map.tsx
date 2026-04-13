import type { ReactNode } from "react";
import {
  AlertOutlined,
  AppstoreOutlined,
  BulbOutlined,
  CameraOutlined,
  ControlOutlined,
  RobotOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import type { Role } from "@/types/common";
import DashboardPage from "@/views/dashboard";
import DeviceControlPage from "@/views/device-control";
import StrategyPage from "@/views/strategy";
import VisionPage from "@/views/vision";
import AgentPage from "@/views/agent";
import AdminPage from "@/views/admin";

export interface AppRouteItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  element: ReactNode;
}

export const appRoutes: AppRouteItem[] = [
  {
    path: "/",
    label: "数据驾驶舱",
    icon: <AppstoreOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <DashboardPage />
  },
  {
    path: "/device-control",
    label: "设备控制中心",
    icon: <ControlOutlined />,
    roles: ["farmer", "admin"],
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
    label: "AI 视觉分析",
    icon: <CameraOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <VisionPage />
  },
  {
    path: "/agent",
    label: "农事问答智能体",
    icon: <RobotOutlined />,
    roles: ["farmer", "expert", "admin"],
    element: <AgentPage />
  },
  {
    path: "/admin",
    label: "系统设备管理",
    icon: <SafetyOutlined />,
    roles: ["admin"],
    element: <AdminPage />
  }
];

export const fallbackRoute = {
  path: "/403",
  label: "权限受限",
  icon: <AlertOutlined />
};
