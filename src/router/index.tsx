import { Navigate, Route, Routes } from "react-router-dom";
import { appRoutes, getDefaultRoute } from "@/router/route-map";
import { AppLayout } from "@/layout/AppLayout";
import CommunityPage from "@/views/community";
import CommunityPostDetailPage from "@/views/community/post-detail";

const RoleHomeRedirect = () => <Navigate to={getDefaultRoute()} replace />;

export const AppRouter = () => (
  <Routes>
    <Route path="/community" element={<CommunityPage />} />
    <Route path="/community/posts/:postId" element={<CommunityPostDetailPage />} />
    <Route element={<AppLayout />}>
      <Route path="/" element={<RoleHomeRedirect />} />
      {appRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Route>
    <Route path="*" element={<RoleHomeRedirect />} />
  </Routes>
);
