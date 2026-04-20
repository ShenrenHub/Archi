import { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Drawer, Select, Switch, Tag } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ExportOutlined, MenuOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import gengzhiMark from "@/assets/gengzhi-mark.svg";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    setMobileNavOpen(false);
  }, [location.pathname]);

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
  const navContent = (
    <div className={`flex h-full flex-col px-4 py-5 ${isDark ? "text-white" : "text-slate-900"}`}>
      <div
        className={`rounded-[24px] border p-4 backdrop-blur ${
          isDark
            ? "border-white/10 bg-white/6"
            : "border-slate-200/90 bg-white/88 shadow-[0_18px_38px_rgba(15,23,42,0.06)]"
        }`}
      >
        <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? "text-emerald-300/80" : "text-emerald-700/80"}`}>
          Agri Nexus
        </p>
        <h1 className={`mt-3 text-xl font-semibold leading-8 ${isDark ? "text-white" : "text-slate-950"}`}>
          智慧温室后端联调
          <br />
          前端控制台
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
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                active
                  ? "border-transparent bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow"
                  : isDark
                    ? "border-transparent bg-white/0 text-slate-300 hover:bg-white/8 hover:text-white"
                    : "border-transparent bg-white/0 text-slate-600 hover:border-white/80 hover:bg-white/88 hover:text-slate-950 hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
              }`}
            >
              <span className={`text-lg ${active ? "text-white" : isDark ? "text-slate-300" : "text-slate-500"}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 space-y-3">
        <a
          href={GENGZHI_URL}
          target="_blank"
          rel="noreferrer"
          className={`group block rounded-[24px] border p-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
            isDark
              ? "border-emerald-400/16 bg-[linear-gradient(135deg,rgba(6,95,70,0.34),rgba(15,23,42,0.92)_52%,rgba(4,18,20,0.94))] shadow-[0_18px_48px_rgba(2,6,23,0.26)] hover:-translate-y-0.5 hover:border-emerald-300/30 hover:shadow-[0_22px_54px_rgba(2,6,23,0.34)]"
              : "border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,252,248,0.94)_55%,rgba(236,253,245,0.92))] shadow-[0_20px_44px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-emerald-300/90 hover:shadow-[0_24px_52px_rgba(15,23,42,0.12)]"
          }`}
        >
          <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3">
            <img
              src={gengzhiMark}
              alt="耕知"
              className={`h-10 w-10 rounded-2xl border p-1.5 ${
                isDark
                  ? "border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                  : "border-emerald-100 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_18px_rgba(15,23,42,0.06)]"
              }`}
            />
            <div className="min-w-0 text-center">
              <p className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? "text-emerald-200/68" : "text-emerald-700/72"}`}>Forum</p>
              <p className={`mt-1 text-base font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>耕知</p>
              {/* <p className="mt-1 text-xs text-slate-300">跟大家聊聊吧</p> */}
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-base transition ${
                isDark
                  ? "border-white/10 bg-white/6 text-emerald-200/88 group-hover:border-emerald-300/24 group-hover:bg-emerald-400/10 group-hover:text-white"
                  : "border-emerald-100 bg-white/86 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] group-hover:border-emerald-300/90 group-hover:bg-emerald-50 group-hover:text-emerald-800"
              }`}
            >
              <ExportOutlined />
            </div>
          </div>
        </a>

        {/* <div className="rounded-[24px] border border-white/10 bg-white/5 text-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">当前时间</p>
          <p className="mt-2 text-xl font-semibold text-white">{now.format("YYYY-MM-DD HH:mm")}</p>
        </div> */}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4 lg:p-4">
        <aside
          className={`m-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border backdrop-blur-xl lg:block ${
            isDark
              ? "border-white/10 bg-slate-950/90 shadow-panel"
              : "border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.96)_48%,rgba(240,253,244,0.92))] shadow-[0_28px_68px_rgba(15,23,42,0.10)]"
          }`}
        >
          {navContent}
        </aside>

        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          width={300}
          className="lg:hidden"
          styles={{
            body: {
              padding: 0,
              background: isDark
                ? "rgba(2, 6, 23, 0.96)"
                : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.98) 48%, rgba(240, 253, 244, 0.96))"
            },
            header: { display: "none" },
            content: {
              background: isDark
                ? "rgba(2, 6, 23, 0.96)"
                : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.98) 48%, rgba(240, 253, 244, 0.96))"
            }
          }}
        >
          {navContent}
        </Drawer>

        <main className="relative flex min-h-screen flex-col lg:min-h-0 lg:overflow-hidden">
          {!showTopHeader && (
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="absolute left-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-lg text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.12)] backdrop-blur-md transition active:scale-95 dark:border-white/12 dark:bg-slate-900/80 dark:text-slate-100 lg:hidden"
            >
              <MenuOutlined />
            </button>
          )}

          {showTopHeader && (
            <header className="sticky top-0 z-20 mx-3 mt-3 rounded-[28px] border border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:mx-0 lg:mt-4 lg:flex lg:min-h-[96px] lg:items-center lg:justify-between lg:gap-4 lg:px-6 lg:py-5">
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
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 lg:hidden"
                >
                  <MenuOutlined />
                </button>
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
            className={`flex-1 min-h-0 overflow-y-auto px-3 pb-6 lg:px-0 lg:pb-4 ${
              showTopHeader ? "pt-3" : "pt-16 lg:pt-4"
            }`}
          >
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
};
