import type { JSX } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Result } from "antd";
import { useUserStore } from "@/store/user";
import { appRoutes } from "@/router/route-map";
import { AppLayout } from "@/layout/AppLayout";
import type { Role } from "@/types/common";

const RoleGuard = ({
  roles,
  children
}: {
  roles: Role[];
  children: JSX.Element;
}) => {
  const role = useUserStore((state) => state.role);

  if (!roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

const ForbiddenPage = () => {
  const location = useLocation();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        status="403"
        title="当前角色没有访问权限"
        subTitle={`访问路径：${location.state?.from ?? location.pathname}`}
      />
    </div>
  );
};

export const AppRouter = () => (
  <Routes>
    <Route element={<AppLayout />}>
      {appRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<RoleGuard roles={route.roles}>{route.element as JSX.Element}</RoleGuard>}
        />
      ))}
      <Route path="/403" element={<ForbiddenPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
