import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  AlertOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { Tag } from "antd";
import { fetchDashboardOverview, fetchDashboardTrends } from "@/api/dashboard";
import type {
  DashboardOverview,
  DashboardTrendResponse
} from "@/api/dashboard";
import { AppCard } from "@/components/common/AppCard";
import { StatCard } from "@/components/common/StatCard";

const defaultOverview: DashboardOverview = {
  temperature: 0,
  humidity: 0,
  light: 0,
  co2: 0,
  onlineDevices: 0,
  totalDevices: 0,
  activeAlerts: 0,
  greenhouseCount: 0
};

const defaultTrends: DashboardTrendResponse = {
  trends: [],
  greenhouses: []
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview>(defaultOverview);
  const [trendData, setTrendData] = useState<DashboardTrendResponse>(defaultTrends);

  useEffect(() => {
    void Promise.all([fetchDashboardOverview(), fetchDashboardTrends()]).then(
      ([overviewResponse, trendResponse]) => {
        setOverview(overviewResponse);
        setTrendData(trendResponse);
      }
    );
  }, []);

  const chartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis"
      },
      legend: {
        top: 0,
        textStyle: {
          color: "#64748b"
        }
      },
      grid: {
        left: 18,
        right: 16,
        bottom: 18,
        top: 48,
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: trendData.trends.map((item) => item.date),
        axisLine: { lineStyle: { color: "#cbd5e1" } }
      },
      yAxis: [
        {
          type: "value",
          name: "温湿度",
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.16)" } }
        },
        {
          type: "value",
          name: "光照",
          axisLine: { show: false },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: "温度",
          type: "line",
          smooth: true,
          data: trendData.trends.map((item) => item.temperature),
          lineStyle: { color: "#12b76a", width: 3 },
          itemStyle: { color: "#12b76a" }
        },
        {
          name: "湿度",
          type: "line",
          smooth: true,
          data: trendData.trends.map((item) => item.humidity),
          lineStyle: { color: "#1fb6ff", width: 3 },
          itemStyle: { color: "#1fb6ff" }
        },
        {
          name: "光照",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: trendData.trends.map((item) => item.light),
          lineStyle: { color: "#f59e0b", width: 3 },
          itemStyle: { color: "#f59e0b" }
        }
      ]
    }),
    [trendData.trends]
  );

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden">
      <div className="grid shrink-0 gap-4 xl:grid-cols-5">
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
          <StatCard
            title="棚内温度"
            value={overview.temperature.toFixed(1)}
            suffix="°C"
            highlight="控制在适宜区间"
            icon={<ExperimentOutlined />}
          />
          <StatCard
            title="空气湿度"
            value={overview.humidity.toFixed(1)}
            suffix="%"
            highlight="建议观察高湿区域"
            icon={<CloudServerOutlined />}
          />
          <StatCard
            title="光照强度"
            value={`${overview.light}`}
            suffix="Lux"
            highlight="补光策略可联动"
            icon={<ThunderboltOutlined />}
          />
        </div>

        <AppCard className="xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">运行总览</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                {overview.greenhouseCount} 座大棚
              </h3>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white dark:bg-white dark:text-slate-900">
              <p className="text-xs opacity-80">在线设备</p>
              <p className="mt-2 text-2xl font-semibold">
                {overview.onlineDevices}/{overview.totalDevices}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">CO2</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{overview.co2} ppm</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-300">活跃告警</p>
              <p className="mt-2 text-2xl font-semibold text-amber-600">{overview.activeAlerts}</p>
            </div>
          </div>
        </AppCard>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <AppCard
          title="过去 7 天环境趋势"
          extra={<Tag color="green">数据持续更新</Tag>}
          className="min-h-0 overflow-hidden"
        >
          <ReactECharts option={chartOption} style={{ height: 280 }} />
        </AppCard>

        <AppCard title="多棚状态快照" className="min-h-0 overflow-hidden">
          <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-1">
            {trendData.greenhouses.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/10 bg-white/60 p-4 dark:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{item.crop}</p>
                  </div>
                  <Tag color={item.status === "healthy" ? "green" : "orange"}>
                    {item.status === "healthy" ? "稳定" : "预警"}
                  </Tag>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div>
                    <p>温度</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.temperature}°C</p>
                  </div>
                  <div>
                    <p>湿度</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.humidity}%</p>
                  </div>
                  <div>
                    <p>光照</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.light} Lux</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      <AppCard title="今日态势摘要" className="shrink-0">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-500 to-brand-700 p-5 text-white">
            <DashboardOutlined className="text-xl" />
            <h4 className="mt-3 text-xl font-semibold">环境感知稳定</h4>
            <p className="mt-2 text-sm text-emerald-50">核心传感器已回传，环境指标整体平稳。</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-sky-500 to-accent-600 p-5 text-white">
            <CloudServerOutlined className="text-xl" />
            <h4 className="mt-3 text-xl font-semibold">设备在线率较高</h4>
            <p className="mt-2 text-sm text-sky-50">设备运行状态稳定，可继续进行远程调度。</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-amber-500 to-harvest-600 p-5 text-white">
            <AlertOutlined className="text-xl" />
            <h4 className="mt-3 text-xl font-semibold">视觉异常待复核</h4>
            <p className="mt-2 text-sm text-amber-50">存在 1 条高优先级病害类告警，建议进入视觉中心处理。</p>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
