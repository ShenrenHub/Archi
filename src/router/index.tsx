import type { JSX } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Result } from "antd";
import { useUserStore } from "@/store/user";
import { appRoutes, getDefaultRoute } from "@/router/route-map";
import { AppLayout } from "@/layout/AppLayout";
import LoginPage from "@/views/login";
import type { Role } from "@/types/common";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const RoleGuard = ({ roles, children }: { roles: Role[]; children: JSX.Element }) => {
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
        title="当前账号没有访问该页面的权限"
        subTitle={`访问路径：${location.state?.from ?? location.pathname}`}
      />
    </div>
  );
};

const RoleHomeRedirect = () => {
  const role = useUserStore((state) => state.role);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRoute(role)} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      }
    >
      <Route path="/" element={<RoleHomeRedirect />} />
      {appRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<RoleGuard roles={route.roles}>{route.element as JSX.Element}</RoleGuard>}
        />
      ))}
      <Route path="/403" element={<ForbiddenPage />} />
    </Route>
    <Route path="*" element={<RoleHomeRedirect />} />
  </Routes>
);
