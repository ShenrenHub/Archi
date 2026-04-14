import { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Drawer, Segmented, Switch, Tag } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MenuOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { appRoutes, getDefaultRoute, getVisibleRoutes } from "@/router/route-map";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import type { Role } from "@/types/common";

const roleLabelMap: Record<Role, string> = {
  farmer: "农户",
  expert: "农业专家",
  admin: "管理员"
};

const roleExperienceMap: Record<
  Role,
  { title: string; subtitle: string; badge: string; summary: string; focus: string }
> = {
  farmer: {
    title: "农户作业台",
    subtitle: "聚焦环境监测、设备控制和农事辅助决策",
    badge: "农户视图",
    summary: "当前重点关注环境波动、设备回执与农事建议。",
    focus: "建议优先查看湿度趋势与视觉告警。"
  },
  expert: {
    title: "专家复核台",
    subtitle: "聚焦视觉复核、异常研判与远程种植建议",
    badge: "专家视图",
    summary: "当前重点关注待复核异常与作物病害研判。",
    focus: "建议优先处理高优先级病斑任务。"
  },
  admin: {
    title: "农场管理台",
    subtitle: "聚焦多棚总览、联动策略和设备资产管理",
    badge: "管理员视图",
    summary: "当前重点关注策略状态、资产设备和全局告警。",
    focus: "建议优先处理待接入设备与高等级告警。"
  }
};

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const role = useUserStore((state) => state.role);
  const setRole = useUserStore((state) => state.setRole);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const visibleRoutes = useMemo(() => getVisibleRoutes(role), [role]);
  const defaultRoute = useMemo(() => getDefaultRoute(role), [role]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    const currentPath = location.pathname;
    const isAllowed = visibleRoutes.some((route) => route.path === currentPath);

    if (currentPath === "/403") {
      navigate(defaultRoute, { replace: true });
      return;
    }

    if (!isAllowed) {
      navigate(defaultRoute, { replace: true });
    }
  }, [defaultRoute, location.pathname, navigate, visibleRoutes]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const selectedKey = location.pathname;

  const breadcrumbItems = useMemo(() => {
    const matched = appRoutes.find((item) => item.path === selectedKey);
    return [
      { title: <Link to={defaultRoute}>智慧温室</Link> },
      { title: matched?.label ?? "权限受限" }
    ];
  }, [defaultRoute, selectedKey]);

  const roleExperience = roleExperienceMap[role];

  const navContent = (
    <div className="flex h-full flex-col px-4 py-5 text-white">
      <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Agri Nexus</p>
        <h1 className="mt-3 text-xl font-semibold leading-8 text-white">
          农业温室大棚
          <br />
          双模态智能管控平台
        </h1>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {visibleRoutes.map((item) => {
          const active = selectedKey === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow"
                  : "bg-white/0 text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p>{roleExperience.badge}</p>
        <p className="mt-2 text-xl font-semibold text-white">{dayjs().format("YYYY-MM-DD HH:mm")}</p>
        <p className="mt-2 text-xs leading-6 text-slate-400">{roleExperience.summary}</p>
        <p className="mt-2 text-xs leading-6 text-emerald-200/80">{roleExperience.focus}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4 lg:p-4">
        <aside className="m-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/90 shadow-panel lg:block">
          {navContent}
        </aside>

        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          width={300}
          className="lg:hidden"
          styles={{
            body: { padding: 0, background: "rgba(2, 6, 23, 0.96)" },
            header: { display: "none" },
            content: { background: "rgba(2, 6, 23, 0.96)" }
          }}
        >
          {navContent}
        </Drawer>

        <main className="flex min-h-screen flex-col lg:min-h-0 lg:overflow-hidden">
          <header className="sticky top-0 z-20 mx-3 mt-3 rounded-[28px] border border-white/15 bg-white/72 px-4 py-4 shadow-panel backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/72 lg:mx-0 lg:mt-4 lg:flex lg:min-h-[110px] lg:items-center lg:justify-between lg:gap-4 lg:px-6 lg:py-5">
            <div className="flex items-start justify-between gap-3 lg:block">
              <div>
                <Breadcrumb items={breadcrumbItems} />
                <div className="mt-2 flex flex-wrap items-center gap-2 lg:gap-3">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white lg:text-2xl">
                    {roleExperience.title}
                  </h2>
                  <Tag color="green">{roleExperience.subtitle}</Tag>
                </div>
              </div>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileNavOpen(true)}
                className="!flex !h-10 !w-10 !items-center !justify-center !rounded-2xl !border !border-slate-200/80 !bg-white/70 !text-slate-700 dark:!border-white/10 dark:!bg-slate-900/80 dark:!text-slate-100 lg:!hidden"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mt-0 lg:justify-end">
              <Segmented<Role>
                block
                options={[
                  { label: roleLabelMap.farmer, value: "farmer" },
                  { label: roleLabelMap.expert, value: "expert" },
                  { label: roleLabelMap.admin, value: "admin" }
                ]}
                value={role}
                onChange={(value) => setRole(value as Role)}
              />
              <Switch
                checked={mode === "dark"}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                onChange={toggleMode}
              />
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-3 pb-6 pt-3 lg:min-h-0 lg:px-0 lg:pb-4">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
};
