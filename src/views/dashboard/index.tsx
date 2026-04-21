import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Empty, Pagination, Tag } from "antd";
import { AlertOutlined, ApiOutlined, CameraOutlined, DownOutlined, ReloadOutlined, RobotOutlined, SyncOutlined, UpOutlined } from "@ant-design/icons";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import { fetchAlerts, fetchOpenAlertCount, closeAlert, type AlertItem } from "@/api/alerts";
import { fetchDevices, type DeviceItem } from "@/api/device";
import { fetchLatestTelemetry, fetchTelemetryOverview, type LatestTelemetryItem, type TelemetryOverviewItem } from "@/api/telemetry";
import { AppCard } from "@/components/common/AppCard";
import { StatCard } from "@/components/common/StatCard";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

const DASHBOARD_POLL_INTERVAL_MS = 5000;
const DASHBOARD_ALERT_LIMIT = 200;
const MAX_TELEMETRY_HISTORY_POINTS = 240;
const MAX_TELEMETRY_SERIES_POINTS = 30;
const TELEMETRY_CHART_COLORS = ["#15803D", "#22C55E", "#0F766E", "#0284C7", "#CA8A04", "#DC2626"];

const buildTelemetryPointKey = (item: LatestTelemetryItem) =>
  `${item.deviceId}-${item.metricCode}-${item.collectedAt}`;

const normalizeMetricCode = (metricCode: string) =>
  metricCode.trim().toLowerCase().replace(/-/g, "_");

const formatMetricCodeLabel = (metricCode: string) => {
  const normalized = normalizeMetricCode(metricCode);

  if (normalized === "temperature") {
    return "温度";
  }

  if (normalized === "humidity") {
    return "湿度";
  }

  if (normalized === "light" || normalized === "light_lux" || normalized === "brightness") {
    return "光照强度";
  }

  return metricCode;
};

const buildTelemetrySeriesName = (item: LatestTelemetryItem) =>
  formatMetricCodeLabel(item.metricCode);

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const formatTelemetryValue = (value: unknown) => {
  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    if (Math.abs(numeric) >= 100) {
      return numeric.toFixed(0);
    }

    if (Math.abs(numeric) >= 10) {
      return numeric.toFixed(1);
    }

    return numeric.toFixed(2).replace(/\.?0+$/, "");
  }

  return String(value ?? "-");
};

export default function DashboardPage() {
  const farmId = useUserStore((state) => state.farmId);
  const farms = useUserStore((state) => state.farms);
  const themeMode = useThemeStore((state) => state.mode);
  const [overview, setOverview] = useState<TelemetryOverviewItem[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<LatestTelemetryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [openAlertCount, setOpenAlertCount] = useState(0);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsedDataPanel, setCollapsedDataPanel] = useState(true);
  const [telemetryHistory, setTelemetryHistory] = useState<LatestTelemetryItem[]>([]);
  const { state, latency, lastMessage } = useMqttBridge(farmId);
  const telemetryChartRef = useRef<ReactECharts | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("当前浏览器不支持摄像头调用");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setCameraActive(false);
      setCameraError(err instanceof Error ? err.message : "无法访问摄像头");
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {
        // ignore auto-play policy errors
      });
    }
  }, [cameraActive]);

  const loadData = useCallback(async () => {
    if (!farmId) {
      return;
    }

    setLoading(true);
    try {
      const [overviewResponse, latestResponse, alertResponse, openAlertCountResponse, deviceResponse] = await Promise.all([
        fetchTelemetryOverview(farmId),
        fetchLatestTelemetry(farmId),
        fetchAlerts(farmId, { limit: DASHBOARD_ALERT_LIMIT }),
        fetchOpenAlertCount(farmId),
        fetchDevices(farmId)
      ]);

      setOverview(overviewResponse);
      setLatestTelemetry(latestResponse);
      setAlerts(alertResponse);
      setOpenAlertCount(openAlertCountResponse);
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
    }, DASHBOARD_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [farmId, loadData]);

  useEffect(() => {
    setTelemetryHistory([]);
  }, [farmId]);

  useEffect(() => {
    if (latestTelemetry.length === 0) {
      return;
    }

    setTelemetryHistory((current) => {
      if (current.length > 0) {
        return current;
      }

      const seeded = [...latestTelemetry]
        .sort((left, right) => dayjs(left.collectedAt).valueOf() - dayjs(right.collectedAt).valueOf())
        .filter(
          (item, index, collection) =>
            collection.findIndex((candidate) => buildTelemetryPointKey(candidate) === buildTelemetryPointKey(item)) === index
        );

      return seeded.slice(-MAX_TELEMETRY_HISTORY_POINTS);
    });
  }, [latestTelemetry]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    setLatestTelemetry((current) => {
      const next = [lastMessage, ...current.filter((item) => item.deviceId !== lastMessage.deviceId || item.metricCode !== lastMessage.metricCode)];
      return next.slice(0, 10);
    });

    setTelemetryHistory((current) => {
      if (current.some((item) => buildTelemetryPointKey(item) === buildTelemetryPointKey(lastMessage))) {
        return current;
      }

      return [...current, lastMessage]
        .sort((left, right) => dayjs(left.collectedAt).valueOf() - dayjs(right.collectedAt).valueOf())
        .slice(-MAX_TELEMETRY_HISTORY_POINTS);
    });
  }, [lastMessage]);

  const realtimeMetrics = useMemo(() => {
    const pickLatestMetric = (metricCodes: string[]) => {
      const aliases = metricCodes.map(normalizeMetricCode);

      return latestTelemetry.reduce<LatestTelemetryItem | null>((latest, item) => {
        if (!aliases.includes(normalizeMetricCode(item.metricCode))) {
          return latest;
        }

        if (!latest) {
          return item;
        }

        return dayjs(item.collectedAt).valueOf() > dayjs(latest.collectedAt).valueOf() ? item : latest;
      }, null);
    };

    return {
      temperature: pickLatestMetric(["temperature"]),
      humidity: pickLatestMetric(["humidity"]),
      lightLux: pickLatestMetric(["light", "light_lux", "brightness"])
    };
  }, [latestTelemetry]);

  const stats = useMemo(() => {
    const onlineDevices = devices.filter((item) => item.onlineStatus === "ONLINE").length;

    return {
      temperature: realtimeMetrics.temperature,
      humidity: realtimeMetrics.humidity,
      lightLux: realtimeMetrics.lightLux,
      greenhouseCount: overview.length,
      onlineDevices,
      totalDevices: devices.length,
      activeAlerts: openAlertCount
    };
  }, [devices, openAlertCount, overview.length, realtimeMetrics]);

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

  const telemetryChartOption = useMemo<EChartsOption>(() => {
    const isDark = themeMode === "dark";
    const axisColor = isDark ? "rgba(226, 232, 240, 0.82)" : "rgba(51, 65, 85, 0.7)";
    const splitLineColor = isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(148, 163, 184, 0.18)";
    const textColor = isDark ? "#f8fafc" : "#1f2937";
    const tooltipBackground = isDark ? "rgba(3, 10, 18, 0.96)" : "rgba(255, 255, 255, 0.92)";
    const tooltipBorder = isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(21, 128, 61, 0.14)";
    const axisPointerColor = isDark ? "rgba(110, 231, 183, 0.38)" : "rgba(21, 128, 61, 0.22)";
    const chartPalette = TELEMETRY_CHART_COLORS;

    const sortedPoints = [...telemetryHistory].sort(
      (left, right) => dayjs(left.collectedAt).valueOf() - dayjs(right.collectedAt).valueOf()
    );
    const unitList = Array.from(new Set(sortedPoints.map((item) => item.unit || item.metricCode || "value")));
    const unitIndexMap = new Map(unitList.map((unit, index) => [unit, index]));
    const groupedSeries = new Map<string, { name: string; unit: string; data: [number, number][] }>();

    sortedPoints.forEach((item) => {
      const seriesKey = `${item.deviceId}-${item.metricCode}`;
        const series = groupedSeries.get(seriesKey) ?? {
          name: buildTelemetrySeriesName(item),
          unit: item.unit || item.metricCode || "value",
          data: []
      };

      series.data.push([dayjs(item.collectedAt).valueOf(), Number(item.metricValue)]);
      groupedSeries.set(seriesKey, series);
    });

    const groupedSeriesList = Array.from(groupedSeries.values());
    const seriesUnitMap = new Map(groupedSeriesList.map((series) => [series.name, series.unit]));

    return {
      backgroundColor: "transparent",
      animationDuration: 220,
      animationDurationUpdate: 180,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      color: chartPalette,
      legend: {
        top: 6,
        left: 0,
        right: 0,
        type: "scroll",
        icon: "roundRect",
        itemWidth: 14,
        itemHeight: 8,
        itemGap: 18,
        pageIconColor: chartPalette[0],
        pageIconInactiveColor: isDark ? "rgba(148, 163, 184, 0.38)" : "rgba(148, 163, 184, 0.72)",
        inactiveColor: isDark ? "rgba(148, 163, 184, 0.48)" : "rgba(100, 116, 139, 0.82)",
        pageTextStyle: {
          color: axisColor
        },
        textStyle: {
          color: textColor,
          fontSize: 12,
          fontWeight: 500
        }
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: tooltipBackground,
        borderColor: tooltipBorder,
        borderWidth: 1,
        extraCssText: `border-radius:18px;box-shadow:0 22px 60px ${isDark ? "rgba(2, 6, 23, 0.45)" : "rgba(15, 23, 42, 0.12)"};backdrop-filter:blur(14px);`,
        axisPointer: {
          type: "line",
          lineStyle: {
            color: axisPointerColor,
            width: 1.5
          }
        },
        textStyle: {
          color: textColor,
          fontSize: 12
        },
        formatter: (params) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{
            axisValue?: string | number;
            color?: string;
            seriesName?: string;
            value?: unknown;
          }>;

          if (items.length === 0) {
            return "";
          }

          const title = dayjs(items[0]?.axisValue).format("HH:mm:ss");
          const rows = items
            .map((item) => {
              const value = Array.isArray(item.value) ? item.value[1] : item.value;
              const unit = seriesUnitMap.get(item.seriesName ?? "") ?? "";
              const color = typeof item.color === "string" ? item.color : chartPalette[0];

              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:10px;">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                    <span style="display:inline-flex;height:10px;width:10px;border-radius:999px;background:${color};box-shadow:0 0 0 4px ${hexToRgba(color, isDark ? 0.2 : 0.14)};"></span>
                    <span style="color:${axisColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${item.seriesName ?? "-"}</span>
                  </div>
                  <span style="color:${textColor};font-weight:600;">${formatTelemetryValue(value)} ${unit}</span>
                </div>
              `;
            })
            .join("");

          return `
            <div style="min-width:240px;">
              <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${axisColor};">采样时间</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700;color:${textColor};">${title}</div>
              ${rows}
            </div>
          `;
        }
      },
      grid: {
        top: 74,
        left: 18,
        right: 20 + Math.max(0, unitList.length - 1) * 46,
        bottom: 20,
        containLabel: true
      },
      xAxis: {
        type: "time",
        boundaryGap: [0, 0],
        axisTick: {
          show: false
        },
        axisLabel: {
          color: axisColor,
          margin: 14,
          formatter: (value: number) => dayjs(value).format("HH:mm:ss")
        },
        axisPointer: {
          label: {
            show: true,
            color: isDark ? "#dcfce7" : "#14532d",
            backgroundColor: isDark ? "rgba(20, 83, 45, 0.95)" : "rgba(220, 252, 231, 0.96)",
            borderColor: "transparent",
            padding: [6, 10],
            borderRadius: 999,
            formatter: (params) => dayjs(Number(params.value)).format("HH:mm:ss")
          }
        },
        axisLine: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: splitLineColor,
            type: "dashed"
          }
        }
      },
      yAxis: unitList.map((unit, index) => ({
        type: "value",
        scale: true,
        name: unit,
        position: index % 2 === 0 ? "left" : "right",
        offset: index < 2 ? 0 : Math.floor(index / 2) * 52,
        nameGap: 18,
        axisLabel: {
          color: axisColor,
          margin: 12,
          formatter: (value: number) => formatTelemetryValue(value)
        },
        nameTextStyle: {
          color: axisColor,
          fontWeight: 500
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: index === 0,
          lineStyle: {
            color: splitLineColor,
            type: "dashed"
          }
        }
      })),
      series: groupedSeriesList.map((series, index) => {
        const color = chartPalette[index % chartPalette.length];

        return {
          name: series.name,
          type: "line",
          smooth: 0.35,
          showSymbol: false,
          symbol: "circle",
          symbolSize: 7,
          yAxisIndex: unitIndexMap.get(series.unit) ?? 0,
          lineStyle: {
            width: 3,
            color,
            cap: "round",
            join: "round",
            shadowBlur: isDark ? 12 : 8,
            shadowColor: hexToRgba(color, isDark ? 0.28 : 0.18)
          },
          itemStyle: {
            color,
            borderColor: isDark ? "#020617" : "#ffffff",
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: hexToRgba(color, isDark ? 0.28 : 0.16) },
                { offset: 0.65, color: hexToRgba(color, isDark ? 0.08 : 0.04) },
                { offset: 1, color: hexToRgba(color, 0.01) }
              ]
            }
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: 4
            }
          },
          data: series.data.slice(-MAX_TELEMETRY_SERIES_POINTS)
        };
      })
    };
  }, [telemetryHistory, themeMode]);

  useEffect(() => {
    let timeoutId: number | null = null;
    let frameId: number | null = null;

    const queueResize = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }

        frameId = window.requestAnimationFrame(() => {
          telemetryChartRef.current?.getEchartsInstance().resize();
        });
      }, 120);
    };

    queueResize();
    window.addEventListener("resize", queueResize);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", queueResize);
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      telemetryChartRef.current?.getEchartsInstance().resize();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [telemetryHistory.length, themeMode]);

  if (!farmId) {
    return <Empty description="当前账号没有可用 farmId，请先在右上角选择农场上下文。" />;
  }

  return (
    <div className="expressive-page grid gap-4 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          title="实时温度"
          value={stats.temperature ? stats.temperature.metricValue.toFixed(1) : "--"}
          suffix={stats.temperature?.unit || "°C"}
          highlight={stats.temperature ? `${dayjs(stats.temperature.collectedAt).format("HH:mm:ss")} 更新` : "等待实时温度"}
          icon={<ApiOutlined />}
          variant="expressive"
        />
        <StatCard
          title="实时湿度"
          value={stats.humidity ? stats.humidity.metricValue.toFixed(1) : "--"}
          suffix={stats.humidity?.unit || "%"}
          highlight={stats.humidity ? `${dayjs(stats.humidity.collectedAt).format("HH:mm:ss")} 更新` : "等待实时湿度"}
          icon={<ApiOutlined />}
          variant="expressive"
        />
        <StatCard
          title="实时光照强度"
          value={stats.lightLux ? stats.lightLux.metricValue.toFixed(0) : "--"}
          suffix={stats.lightLux?.unit || "Lux"}
          highlight={stats.lightLux ? `${dayjs(stats.lightLux.collectedAt).format("HH:mm:ss")} 更新` : "等待实时光照"}
          icon={<ApiOutlined />}
          variant="expressive"
        />
        <StatCard title="活跃告警" value={String(stats.activeAlerts)} highlight={`${stats.onlineDevices}/${stats.totalDevices} 台设备在线`} icon={<AlertOutlined />} variant="expressive" />
      </div>

      <AppCard
        title="实时遥测曲线"
        variant="expressive"
        className="dashboard-telemetry-card relative overflow-hidden"
        extra={(
          <Tag className="dashboard-telemetry-tag !rounded-full !px-3 !py-1">
            {telemetryHistory.length} 条样本
          </Tag>
        )}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            按接收到的实时遥测消息持续追加，当前保留最近 {MAX_TELEMETRY_SERIES_POINTS} 个点/序列。
          </p>
          <span className="dashboard-telemetry-live inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
            Live Stream
          </span>
        </div>
        <div className="dashboard-telemetry-shell rounded-[24px] p-3">
          {telemetryHistory.length > 0 ? (
            <ReactECharts
              ref={telemetryChartRef}
              option={telemetryChartOption}
              notMerge
              lazyUpdate
              autoResize={false}
              style={{ height: 320, width: "100%" }}
            />
          ) : (
            <Empty description="等待实时遥测数据后绘制曲线" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </AppCard>

      <AppCard
        title="实时作物检测"
        variant="expressive"
        extra={(
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<CameraOutlined />}
              loading={cameraLoading}
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  void startCamera();
                }
              }}
            >
              {cameraActive ? "关闭摄像头" : "打开摄像头"}
            </Button>
          </div>
        )}
      >
        <div className="community-surface relative flex items-center justify-center overflow-hidden rounded-[24px] border border-white/60 dark:border-white/10" style={{ height: 400 }}>
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : cameraError ? (
            <div className="flex flex-col items-center gap-3 text-red-400 dark:text-red-400">
              <CameraOutlined className="text-4xl" />
              <span className="text-sm">{cameraError}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
              <CameraOutlined className="text-4xl" />
              <span className="text-sm">摄像头未开启</span>
            </div>
          )}
        </div>
      </AppCard>

      <AppCard
        title="联调数据面板"
        variant="expressive"
        extra={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadData()}>
              刷新
            </Button>
            <Button
              size="small"
              type="text"
              icon={collapsedDataPanel ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setCollapsedDataPanel((current) => !current)}
            >
              {collapsedDataPanel ? "展开" : "收起"}
            </Button>
          </div>
        )}
      >
        {collapsedDataPanel ? null : (
          <div className="grid gap-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="community-surface rounded-[30px] border border-white/60 p-4 dark:border-white/10">
                <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">当前联调上下文</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="community-surface rounded-[24px] border border-white/60 p-4 dark:border-white/10">
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
              </div>

              <div className="community-surface rounded-[30px] border border-white/60 p-4 dark:border-white/10">
                <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">最新 WebSocket 遥测</h3>
                {lastMessage ? (
                  <div className="rounded-[24px] bg-emerald-500/10 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-300">最近一条推送</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {formatMetricCodeLabel(lastMessage.metricCode)} = {lastMessage.metricValue}{lastMessage.unit}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{formatDateTime(lastMessage.collectedAt)}</p>
                  </div>
                ) : (
                  <Empty description="等待遥测推送" />
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="min-h-0 overflow-hidden community-surface rounded-[30px] border border-white/60 p-4 dark:border-white/10">
                <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">大棚概览数据</h3>
                <DashboardDataTable
                  data={overview}
                  loading={loading}
                  emptyDescription="暂无大棚概览数据"
                  rowKey={(record) => record.greenhouseId}
                  minWidthClassName="min-w-[460px]"
                  columns={[
                    { key: "greenhouseName", title: "大棚", render: (record) => record.greenhouseName },
                    { key: "temperature", title: "温度", render: (record) => record.temperature ?? "-" },
                    { key: "humidity", title: "湿度", render: (record) => record.humidity ?? "-" },
                    { key: "lightLux", title: "光照", render: (record) => record.lightLux ?? "-" }
                  ]}
                />
              </div>

              <div className="min-h-0 overflow-hidden community-surface rounded-[30px] border border-white/60 p-4 dark:border-white/10">
                <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">最近遥测与告警</h3>
                <DashboardDataTable
                  data={latestTelemetry}
                  loading={loading}
                  emptyDescription="暂无遥测数据"
                  rowKey={(record) => `${record.deviceId}-${record.metricCode}-${record.collectedAt}`}
                  minWidthClassName="min-w-[560px]"
                  columns={[
                    { key: "greenhouseId", title: "大棚", render: (record) => record.greenhouseId },
                    { key: "metricCode", title: "指标", render: (record) => formatMetricCodeLabel(record.metricCode) },
                    { key: "metricValue", title: "值", render: (record) => `${record.metricValue} ${record.unit}` },
                    { key: "collectedAt", title: "时间", render: (record) => formatDateTime(record.collectedAt) }
                  ]}
                />
              </div>

              <div className="min-h-0 overflow-hidden community-surface rounded-[30px] border border-white/60 p-4 dark:border-white/10 xl:col-span-2">
                <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">告警列表（最近 {DASHBOARD_ALERT_LIMIT} 条）</h3>
                <DashboardDataTable
                  data={alerts}
                  loading={loading}
                  emptyDescription="暂无告警"
                  rowKey={(record) => record.id}
                  minWidthClassName="min-w-[920px]"
                  pageSize={20}
                  columns={[
                    { key: "id", title: "告警 ID", render: (record) => record.id },
                    { key: "sourceType", title: "来源", render: (record) => record.sourceType },
                    { key: "alertTitle", title: "标题", render: (record) => record.alertTitle },
                    {
                      key: "alertLevel",
                      title: "级别",
                      render: (record) => <Tag color={record.alertLevel === "WARN" ? "orange" : "red"}>{record.alertLevel}</Tag>
                    },
                    { key: "alertStatus", title: "状态", render: (record) => record.alertStatus },
                    { key: "lastOccurredAt", title: "时间", render: (record) => formatDateTime(record.lastOccurredAt) },
                    {
                      key: "action",
                      title: "操作",
                      cellClassName: "whitespace-nowrap",
                      render: (record) => (
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
              </div>
            </div>
          </div>
        )}
      </AppCard>
    </div>
  );
}

interface DashboardDataTableColumn<T> {
  key: string;
  title: string;
  render: (record: T) => ReactNode;
  cellClassName?: string;
}

interface DashboardDataTableProps<T> {
  columns: DashboardDataTableColumn<T>[];
  data: T[];
  emptyDescription: string;
  loading: boolean;
  minWidthClassName?: string;
  pageSize?: number;
  rowKey: (record: T) => number | string;
}

function DashboardDataTable<T>({
  columns,
  data,
  emptyDescription,
  loading,
  minWidthClassName = "min-w-full",
  pageSize = 12,
  rowKey
}: DashboardDataTableProps<T>) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/70 text-sm text-slate-500 dark:border-white/8 dark:bg-slate-950/55 dark:text-slate-300">
        正在加载...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-slate-950/55">
        <Empty description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-slate-950/55">
      <div className="max-h-[320px] overflow-auto">
        <table className={`${minWidthClassName} w-full border-collapse text-left text-sm`}>
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-950/95">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold tracking-[0.08em] text-slate-500 dark:border-white/8 dark:text-slate-300"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((record) => (
              <tr key={rowKey(record)} className="transition hover:bg-emerald-500/5 dark:hover:bg-white/5">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`border-b border-slate-200/70 px-4 py-3 align-top text-slate-700 dark:border-white/8 dark:text-slate-100 ${
                      column.cellClassName ?? ""
                    }`}
                  >
                    {column.render(record)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-white/8 dark:text-slate-300">
          <span>
            共 {data.length} 条，当前第 {page}/{pageCount} 页
          </span>
          <Pagination
            current={page}
            pageSize={pageSize}
            size="small"
            showSizeChanger={false}
            total={data.length}
            onChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}
