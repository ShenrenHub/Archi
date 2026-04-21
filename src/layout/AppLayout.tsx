import { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Select, Switch, Tag } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ExportOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyFarms } from "@/api/farm";
import { appRoutes, getDefaultRoute, getVisibleRoutes } from "@/router/route-map";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";

const consoleExperience = {
  title: "平台联调台",
  subtitle: "公开演示模式下的农场、设备、遥测与视觉联调控制台"
} as const;

const GENGZHI_URL =
  import.meta.env.VITE_GENGZHI_URL || "http://175.178.11.192:6001/community";

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const { farms, farmId, username, displayName, setFarms, setFarmId } = useUserStore();
  const [now, setNow] = useState(() => dayjs());
  const visibleRoutes = useMemo(() => getVisibleRoutes(), []);
  const defaultRoute = useMemo(() => getDefaultRoute(), []);
  const isDark = mode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    void fetchMyFarms()
      .catch(() => [])
      .then((farmsResponse) => {
        if (cancelled) {
          return;
        }

        setFarms(farmsResponse);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [setFarms]);

  useEffect(() => {
    const currentPath = location.pathname;
    const isAllowed = visibleRoutes.some((route) => route.path === currentPath);

    if (!isAllowed) {
      navigate(defaultRoute, { replace: true });
    }
  }, [defaultRoute, location.pathname, navigate, visibleRoutes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const selectedKey = location.pathname;

  const breadcrumbItems = useMemo(() => {
    const matched = appRoutes.find((item) => item.path === selectedKey);
    return [
      { title: <Link to={defaultRoute}>智慧温室</Link> },
      { title: matched?.label ?? "控制台" }
    ];
  }, [defaultRoute, selectedKey]);

  const isSmartDataCenterPage = selectedKey === "/smart-data-center";
  const showTopHeader = !isSmartDataCenterPage;

  return (
    <div className="h-screen overflow-hidden bg-transparent">
      <div className="flex h-screen flex-col">
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {showTopHeader && (
            <header className="sticky top-0 z-20 mx-3 mt-3 rounded-[28px] border border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:mx-4 lg:mt-4 lg:flex lg:min-h-[96px] lg:items-center lg:justify-between lg:gap-4 lg:px-6 lg:py-5">
              <div className="flex items-start justify-between gap-3 lg:block">
                <div>
                  <Breadcrumb items={breadcrumbItems} />
                  <div className="mt-2 flex flex-wrap items-center gap-2 lg:gap-3">
                    <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white lg:text-[1.75rem]">
                      {consoleExperience.title}
                    </h2>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {consoleExperience.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mt-0 lg:justify-end">
                <div className="min-w-[220px]">
                  <Select
                    className="w-full"
                    value={farmId ?? undefined}
                    placeholder="选择农场上下文"
                    options={farms.map((farm) => ({ label: `${farm.farmName} (${farm.id})`, value: farm.id }))}
                    onChange={(value) => setFarmId(value)}
                    allowClear
                  />
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="font-medium text-slate-900 dark:text-white">{displayName || username}</div>
                  <div className="text-slate-500 dark:text-slate-300">演示上下文 · 免登录访问</div>
                </div>
                <Switch
                  checked={mode === "dark"}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  onChange={toggleMode}
                />
              </div>
            </header>
          )}

          <section
            className={`flex-1 min-h-0 overflow-y-auto px-3 lg:px-4 ${
              isSmartDataCenterPage ? "pb-14 pt-4 lg:pb-14" : "pb-36 pt-3 lg:pb-36"
            }`}
          >
            <Outlet />
          </section>
        </main>

        {/* macOS Dock */}
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[720px] -translate-x-1/2 min-[1124px]:w-auto">
          <div className="flex items-center gap-1 rounded-[32px] border bg-white/72 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/72 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]">
            {visibleRoutes
              .filter((item) => item.path !== "/admin")
              .map((item) => {
                const active = selectedKey === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[20px] px-3 py-2.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 min-[1124px]:flex-none min-[1124px]:px-5 min-[1124px]:py-3 ${
                      active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                    title={item.label}
                  >
                    <span className={`text-xl min-[1124px]:text-2xl ${active ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                      {item.icon}
                    </span>
                    <span className="max-w-[4rem] text-center text-[10px] font-medium leading-tight min-[1124px]:max-w-[5rem] min-[1124px]:text-xs">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            <a
              href={GENGZHI_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[20px] px-3 py-2.5 text-slate-500 transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 dark:text-slate-400 dark:hover:bg-white/5 min-[1124px]:flex-none min-[1124px]:px-5 min-[1124px]:py-3"
              title="耕知论坛"
            >
              <span className="text-xl min-[1124px]:text-2xl">
                <ExportOutlined />
              </span>
              <span className="max-w-[4rem] text-center text-[10px] font-medium leading-tight min-[1124px]:max-w-[5rem] min-[1124px]:text-xs">
                耕知论坛
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
