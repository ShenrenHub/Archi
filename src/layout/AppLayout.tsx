import { useEffect, useMemo } from "react";
import { Breadcrumb, Layout, Segmented, Switch, Tag } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { appRoutes } from "@/router/route-map";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import type { Role } from "@/types/common";

const { Header, Sider, Content } = Layout;

const roleLabelMap: Record<Role, string> = {
  farmer: "农户",
  expert: "农业专家",
  admin: "管理员"
};

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const role = useUserStore((state) => state.role);
  const setRole = useUserStore((state) => state.setRole);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const selectedKey = location.pathname === "/403" ? "/" : location.pathname;

  const breadcrumbItems = useMemo(() => {
    const matched = appRoutes.find((item) => item.path === selectedKey);
    return [
      { title: <Link to="/">智慧温室</Link> },
      { title: matched?.label ?? "权限受限" }
    ];
  }, [selectedKey]);

  return (
    <Layout className="h-screen overflow-hidden bg-transparent">
      <Sider
        width={260}
        breakpoint="lg"
        collapsedWidth={88}
        className="m-4 h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/85 shadow-panel"
      >
        <div className="flex h-full flex-col px-4 py-5 text-white">
          <div className="rounded-[24px] bg-white/5 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Agri Nexus</p>
            <h1 className="mt-3 text-xl font-semibold leading-8">
              农业温室大棚
              <br />
              双模态智能管控平台
            </h1>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-2">
            {appRoutes.map((item) => {
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
            <p>实时策略执行率</p>
            <p className="mt-2 text-3xl font-semibold text-white">96.4%</p>
            <p className="mt-2 text-xs text-slate-400">视觉告警、IoT 回执与问答服务已接入 Mock 联调链路。</p>
          </div>
        </div>
      </Sider>

      <Layout className="h-screen overflow-hidden bg-transparent">
        <Header className="mx-4 mt-4 flex h-[110px] shrink-0 flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-white/60 px-6 py-5 shadow-panel backdrop-blur-xl dark:bg-slate-900/60">
          <div>
            <Breadcrumb items={breadcrumbItems} />
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">智慧农业态势总览</h2>
              <Tag color="green">6 座大棚在线</Tag>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Segmented<Role>
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
        </Header>
        <Content className="h-[calc(100vh-126px)] overflow-hidden p-4 pt-3">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
