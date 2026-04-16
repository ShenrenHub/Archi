import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  ControlOutlined,
  DatabaseOutlined,
  MedicineBoxOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import SmartDataCenterPage from "@/views/smart-data-center";
import DashboardPage from "@/views/dashboard";
import DeviceControlPage from "@/views/device-control";
import CropDiagnosisPage from "@/views/crop-diagnosis";
import AdminPage from "@/views/admin";

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
    path: "/crop-diagnosis",
    label: "作物智能诊断",
    icon: <MedicineBoxOutlined />,
    element: <CropDiagnosisPage />
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
