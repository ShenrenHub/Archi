import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Table, Tag } from "antd";
import { AlertOutlined, ApiOutlined, ReloadOutlined } from "@ant-design/icons";
import { fetchAlerts, closeAlert, type AlertItem } from "@/api/alerts";
import { fetchDevices, type DeviceItem } from "@/api/device";
import { fetchLatestTelemetry, fetchTelemetryOverview, type LatestTelemetryItem, type TelemetryOverviewItem } from "@/api/telemetry";
import { AppCard } from "@/components/common/AppCard";
import { StatCard } from "@/components/common/StatCard";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

export default function DashboardPage() {
  const farmId = useUserStore((state) => state.farmId);
  const farms = useUserStore((state) => state.farms);
  const [overview, setOverview] = useState<TelemetryOverviewItem[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<LatestTelemetryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { state, latency, lastMessage } = useMqttBridge(farmId);

  const loadData = useCallback(async () => {
    if (!farmId) {
      return;
    }

    setLoading(true);
    try {
      const [overviewResponse, latestResponse, alertResponse, deviceResponse] = await Promise.all([
        fetchTelemetryOverview(farmId),
        fetchLatestTelemetry(farmId),
        fetchAlerts(farmId),
        fetchDevices(farmId)
      ]);

      setOverview(overviewResponse);
      setLatestTelemetry(latestResponse);
      setAlerts(alertResponse);
      setDevices(deviceResponse);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadData();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [farmId, loadData]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    setLatestTelemetry((current) => {
      const next = [lastMessage, ...current.filter((item) => item.deviceId !== lastMessage.deviceId || item.metricCode !== lastMessage.metricCode)];
      return next.slice(0, 10);
    });
  }, [lastMessage]);

  const stats = useMemo(() => {
    const temperature = overview.find((item) => item.temperature !== null)?.temperature ?? 0;
    const humidity = overview.find((item) => item.humidity !== null)?.humidity ?? 0;
    const lightLux = overview.find((item) => item.lightLux !== null)?.lightLux ?? 0;
    const onlineDevices = devices.filter((item) => item.onlineStatus === "ONLINE").length;

    return {
      temperature,
      humidity,
      lightLux,
      greenhouseCount: overview.length,
      onlineDevices,
      totalDevices: devices.length,
      activeAlerts: alerts.filter((item) => item.alertStatus === "OPEN").length
    };
  }, [alerts, devices, overview]);

  const handleCloseAlert = async (alertId: number) => {
    if (!farmId) {
      return;
    }

    setClosingId(alertId);
    try {
      await closeAlert({
        alertId,
        farmId,
        closeRemark: "前端联调关闭"
      });
      await loadData();
    } finally {
      setClosingId(null);
    }
  };

  if (!farmId) {
    return <Empty description="当前账号没有可用 farmId，请先在右上角选择农场上下文。" />;
  }

  return (
    <div className="grid gap-4 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="平均温度" value={stats.temperature.toFixed(1)} suffix="°C" highlight="来自 overview 接口" icon={<ApiOutlined />} />
        <StatCard title="平均湿度" value={stats.humidity.toFixed(1)} suffix="%" highlight="已绑定当前 farmId" icon={<ApiOutlined />} />
        <StatCard title="光照强度" value={stats.lightLux.toFixed(0)} suffix="Lux" highlight="可用于联动规则" icon={<ApiOutlined />} />
        <StatCard title="活跃告警" value={String(stats.activeAlerts)} highlight={`${stats.onlineDevices}/${stats.totalDevices} 台设备在线`} icon={<AlertOutlined />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AppCard
          title="当前联调上下文"
          extra={<Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData()}>刷新</Button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-white/60 p-4 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">当前农场</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {farms.find((farm) => farm.id === farmId)?.farmName ?? `农场 ${farmId}`}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">farmId = {farmId}</p>
            </div>
            <div className="rounded-[24px] bg-slate-950 p-4 text-white">
              <p className="text-sm text-slate-400">实时订阅状态</p>
              <div className="mt-2 flex items-center gap-3">
                <Tag color={state === "online" ? "green" : state === "connecting" ? "gold" : "red"}>{state}</Tag>
                <span className="text-sm text-slate-300">握手耗时 {latency} ms</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                主题：/topic/farms/{farmId}/telemetry
              </p>
            </div>
          </div>
        </AppCard>

        <AppCard title="最新 WebSocket 遥测">
          {lastMessage ? (
            <div className="rounded-[24px] bg-emerald-500/10 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-300">最近一条推送</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                设备 {lastMessage.deviceId} / {lastMessage.metricCode} = {lastMessage.metricValue}{lastMessage.unit}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{formatDateTime(lastMessage.collectedAt)}</p>
            </div>
          ) : (
            <Empty description="等待遥测推送" />
          )}
        </AppCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AppCard title="大棚概览数据" className="min-h-0 overflow-hidden">
          <Table
            rowKey="greenhouseId"
            loading={loading}
            pagination={false}
            scroll={{ y: 320 }}
            dataSource={overview}
            columns={[
              { title: "大棚", dataIndex: "greenhouseName" },
              { title: "温度", render: (_, record) => (record.temperature ?? "-") },
              { title: "湿度", render: (_, record) => (record.humidity ?? "-") },
              { title: "光照", render: (_, record) => (record.lightLux ?? "-") }
            ]}
          />
        </AppCard>

        <AppCard title="最近遥测与告警" className="min-h-0 overflow-hidden">
          <Table
            rowKey={(record) => `${record.deviceId}-${record.metricCode}-${record.collectedAt}`}
            loading={loading}
            pagination={false}
            scroll={{ y: 320 }}
            dataSource={latestTelemetry}
            columns={[
              { title: "设备", dataIndex: "deviceId" },
              { title: "大棚", dataIndex: "greenhouseId" },
              { title: "指标", dataIndex: "metricCode" },
              { title: "值", render: (_, record) => `${record.metricValue} ${record.unit}` },
              { title: "时间", render: (_, record) => formatDateTime(record.collectedAt) }
            ]}
          />
        </AppCard>

        <AppCard title="告警列表" className="min-h-0 overflow-hidden xl:col-span-2">
          <Table
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ y: 320 }}
            dataSource={alerts}
            columns={[
              { title: "告警 ID", dataIndex: "id" },
              { title: "来源", dataIndex: "sourceType" },
              { title: "标题", dataIndex: "alertTitle" },
              { title: "级别", render: (_, record) => <Tag color={record.alertLevel === "WARN" ? "orange" : "red"}>{record.alertLevel}</Tag> },
              { title: "状态", dataIndex: "alertStatus" },
              { title: "时间", render: (_, record) => formatDateTime(record.lastOccurredAt) },
              {
                title: "操作",
                render: (_, record) => (
                  <Button
                    size="small"
                    disabled={record.alertStatus !== "OPEN"}
                    loading={closingId === record.id}
                    onClick={() => void handleCloseAlert(record.id)}
                  >
                    关闭
                  </Button>
                )
              }
            ]}
          />
        </AppCard>
      </div>
    </div>
  );
}
