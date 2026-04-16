import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  BulbOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  ControlOutlined,
  DatabaseOutlined,
  EyeOutlined,
  RobotOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import SmartDataCenterPage from "@/views/smart-data-center";
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
  element: ReactNode;
}

export const appRoutes: AppRouteItem[] = [
  {
    path: "/smart-data-center",
    label: "智慧数据中心",
    icon: <DatabaseOutlined />,
    element: <SmartDataCenterPage />
  },
  {
    path: "/dashboard",
    label: "数据驾驶舱",
    icon: <AppstoreOutlined />,
    element: <DashboardPage />
  },
  {
    path: "/device-control",
    label: "控制命令中心",
    icon: <ControlOutlined />,
    element: <DeviceControlPage />
  },
  {
    path: "/strategy",
    label: "联动规则管理",
    icon: <BulbOutlined />,
    element: <StrategyPage />
  },
  {
    path: "/vision",
    label: "摄像头与视觉任务",
    icon: <CameraOutlined />,
    element: <VisionPage />
  },
  {
    path: "/vision-analysis",
    label: "视觉回调写回",
    icon: <CloudUploadOutlined />,
    element: <VisionAnalysisPage />
  },
  {
    path: "/expert-review",
    label: "专家复核提交",
    icon: <EyeOutlined />,
    element: <ExpertReviewPage />
  },
  {
    path: "/agent",
    label: "农事问答",
    icon: <RobotOutlined />,
    element: <AgentPage />
  },
  {
    path: "/admin",
    label: "农场与平台管理",
    icon: <SafetyOutlined />,
    element: <AdminPage />
  }
];

export const getVisibleRoutes = () => appRoutes;

export const getDefaultRoute = () => "/dashboard";
