import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Switch, Tag } from "antd";
import {
  BulbOutlined,
  CloudOutlined,
  DeleteOutlined,
  ExportOutlined,
  FireOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "@/store/theme";
import { formatDateTime } from "@/utils/time";
import {
  formatMetricCodeLabel,
  getCardDefinition,
  normalizeMetricCode,
  resolveBoardLightStateLabel,
  SMART_DATA_CARD_MIN_HEIGHT,
  SMART_DATA_CARD_MIN_WIDTH,
  type SmartDataCardItem,
  type SmartDataCardType,
  type SmartDataRuntime
} from "./model";

const GENGZHI_FORUM_URL =
  import.meta.env.VITE_GENGZHI_URL || "http://175.178.11.192:6001/community";
const TELEMETRY_CHART_COLORS = ["#15803D", "#22C55E", "#0284C7", "#CA8A04", "#DC2626", "#0F766E"];
const SMART_DATA_SURFACE_CLASS =
  "community-surface border dark:border-white/10";
const SMART_DATA_INNER_PANEL_CLASS =
  "community-surface rounded-[22px] border border-white/60 px-4 py-4 dark:border-white/10";

interface SmartDataCardProps {
  card: SmartDataCardItem;
  runtime: SmartDataRuntime;
  onRemove: () => void;
  onToggleBoardLight: (targetState: "ON" | "OFF") => Promise<void>;
}

type SmartDataCardOfType<T extends SmartDataCardType> = SmartDataCardItem & {
  type: T;
};

interface CardDensity {
  compact: boolean;
  ultraCompact: boolean;
  widthUnits: number;
  heightUnits: number;
  pixelWidth: number | null;
  pixelHeight: number | null;
}

interface CardFrameSize {
  width: number | null;
  height: number | null;
}

interface CardSpaceRequirement {
  minW?: number;
  minH?: number;
  minPixelW?: number;
  minPixelH?: number;
}

interface SmartDataCardFrameProps {
  card: SmartDataCardItem;
  title: string;
  description: string;
  icon: ReactNode;
  shellClassName: string;
  iconClassName: string;
  onRemove: () => void;
  headerExtra?: ReactNode;
  children: (density: CardDensity) => ReactNode;
}

const CARD_THEME: Record<
  SmartDataCardType,
  {
    icon: ReactNode;
    shellClassName: string;
    iconClassName: string;
    valueClassName?: string;
  }
> = {
  temperature: {
    icon: <FireOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--temperature`,
    iconClassName:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-200",
    valueClassName: "text-amber-700 dark:text-amber-200"
  },
  humidity: {
    icon: <CloudOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--humidity`,
    iconClassName:
      "bg-sky-50 text-sky-700 dark:bg-sky-500/12 dark:text-sky-200",
    valueClassName: "text-sky-700 dark:text-sky-200"
  },
  light: {
    icon: <BulbOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--light`,
    iconClassName:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/12 dark:text-yellow-200",
    valueClassName: "text-yellow-700 dark:text-yellow-200"
  },
  telemetryChart: {
    icon: <LineChartOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--telemetry`,
    iconClassName:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"
  },
  boardLightControl: {
    icon: <ThunderboltOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--board`,
    iconClassName:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/12 dark:text-violet-200"
  },
  startDiagnosis: {
    icon: <MedicineBoxOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--diagnosis`,
    iconClassName:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/12 dark:text-rose-200"
  },
  openCommunity: {
    icon: <ExportOutlined />,
    shellClassName: `${SMART_DATA_SURFACE_CLASS} smart-data-card-surface--community`,
    iconClassName:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/12 dark:text-blue-200"
  }
};

const resolveCardDensity = (
  card: SmartDataCardItem,
  frameSize: CardFrameSize = { width: null, height: null }
): CardDensity => {
  const widthUnits = card.layout.w;
  const heightUnits = card.layout.h;
  const pixelWidth = frameSize.width;
  const pixelHeight = frameSize.height;
  const ultraCompact =
    heightUnits <= SMART_DATA_CARD_MIN_HEIGHT ||
    widthUnits <= SMART_DATA_CARD_MIN_WIDTH ||
    (pixelWidth !== null && pixelWidth < 210) ||
    (pixelHeight !== null && pixelHeight < 175);
  const compact =
    ultraCompact ||
    heightUnits <= SMART_DATA_CARD_MIN_HEIGHT + 1 ||
    widthUnits <= SMART_DATA_CARD_MIN_WIDTH + 2 ||
    (pixelWidth !== null && pixelWidth < 300) ||
    (pixelHeight !== null && pixelHeight < 240);

  return {
    compact,
    ultraCompact,
    widthUnits,
    heightUnits,
    pixelWidth,
    pixelHeight
  };
};

const hasCardSpace = (
  density: CardDensity,
  { minW, minH, minPixelW, minPixelH }: CardSpaceRequirement
) => {
  if (minW !== undefined && density.widthUnits < minW) {
    return false;
  }

  if (minH !== undefined && density.heightUnits < minH) {
    return false;
  }

  if (minPixelW !== undefined && density.pixelWidth !== null && density.pixelWidth < minPixelW) {
    return false;
  }

  if (minPixelH !== undefined && density.pixelHeight !== null && density.pixelHeight < minPixelH) {
    return false;
  }

  return true;
};

const formatMetricValue = (value: number) => {
  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
};

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
    return formatMetricValue(numeric);
  }

  return String(value ?? "-");
};

const DataMessage = ({ message }: { message: string }) => (
  <div className="community-surface flex h-full items-center rounded-[24px] border border-dashed border-white/60 px-4 py-5 text-sm leading-7 text-slate-500 dark:border-white/10 dark:text-slate-300">
    {message}
  </div>
);

const DataLoadingState = ({
  compact = false,
  minimal = false
}: {
  compact?: boolean;
  minimal?: boolean;
}) => (
  <div className={clsx("space-y-4", compact ? "pt-2" : "")}>
    <div className={clsx("animate-pulse rounded-full bg-slate-200/75 dark:bg-white/8", minimal ? "h-5 w-16" : "h-7 w-24")} />
    <div className={clsx("animate-pulse rounded-[20px] bg-slate-200/75 dark:bg-white/8", minimal ? "h-12" : "h-16")} />
    {!minimal ? (
      <div className={clsx("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-3")}>
        <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/75 dark:bg-white/8" />
        <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/75 dark:bg-white/8" />
        {!compact ? <div className="h-20 animate-pulse rounded-[18px] bg-slate-200/75 dark:bg-white/8" /> : null}
      </div>
    ) : null}
  </div>
);

const MetaPlate = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => (
  <div className="community-surface rounded-[18px] border border-white/60 px-4 py-3 dark:border-white/10">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{label}</p>
    <p className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const SmartDataCardFrame = ({
  card,
  title,
  description,
  icon,
  shellClassName,
  iconClassName,
  onRemove,
  headerExtra,
  children
}: SmartDataCardFrameProps) => {
  const articleRef = useRef<HTMLElement | null>(null);
  const [frameSize, setFrameSize] = useState<CardFrameSize>({
    width: null,
    height: null
  });
  const density = resolveCardDensity(card, frameSize);
  const { compact, ultraCompact } = density;
  const showHeaderDescription = hasCardSpace(density, {
    minW: 4,
    minH: 4,
    minPixelW: 280,
    minPixelH: 220
  });

  useEffect(() => {
    const node = articleRef.current;

    if (!node) {
      return;
    }

    const updateSize = (width: number, height: number) => {
      setFrameSize((current) => {
        const nextWidth = Math.round(width);
        const nextHeight = Math.round(height);

        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight
        };
      });
    };

    updateSize(node.clientWidth, node.clientHeight);

    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      rafId = window.requestAnimationFrame(() => {
        updateSize(entry.contentRect.width, entry.contentRect.height);
        rafId = null;
      });
    });

    observer.observe(node);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      observer.disconnect();
    };
  }, []);

  return (
    <article
      ref={articleRef}
      className={clsx(
        "relative flex h-full flex-col overflow-hidden rounded-[28px] shadow-sm transition dark:shadow-none",
        ultraCompact ? "p-3.5" : compact ? "p-4" : "p-5",
        shellClassName
      )}
    >
      <div className="smart-data-card-handle flex cursor-move items-start justify-between gap-4">
        <div className={clsx("flex min-w-0 items-center", ultraCompact ? "gap-2" : "gap-3")}>
          <div
            className={clsx(
              ultraCompact
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-lg"
                : "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-xl",
              iconClassName
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p
              className={clsx(
                "truncate font-semibold text-slate-950 dark:text-white",
                ultraCompact ? "text-sm" : "text-base"
              )}
            >
              {title}
            </p>
            {showHeaderDescription ? (
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={onRemove}
            className="smart-data-card-action"
          />
        </div>
      </div>

      <div
        className={clsx(
          "flex min-h-0 flex-1 flex-col",
          ultraCompact ? "mt-3 gap-2" : compact ? "mt-5 gap-4" : "mt-8 gap-6"
        )}
      >
        {children(density)}
      </div>
    </article>
  );
};

const SmartDataMetricCard = ({
  card,
  runtime,
  onRemove
}: {
  card: SmartDataCardOfType<"temperature" | "humidity" | "light">;
  runtime: SmartDataRuntime;
  onRemove: () => void;
}) => {
  const definition = getCardDefinition(card.type);
  const theme = CARD_THEME[card.type];
  const metricKey = card.type === "light" ? "light" : card.type;
  const metric = runtime.metrics[metricKey];

  return (
    <SmartDataCardFrame
      card={card}
      title={definition.label}
      description={definition.description}
      icon={theme.icon}
      shellClassName={theme.shellClassName}
      iconClassName={theme.iconClassName}
      onRemove={onRemove}
    >
      {(density) => {
        const { compact, ultraCompact } = density;
        const flowLabel =
          runtime.socketState === "online"
            ? "实时流"
            : runtime.loading
              ? "同步中"
              : "轮询";
        const showFlowTag = hasCardSpace(density, {
          minW: 4,
          minH: 3,
          minPixelW: 240,
          minPixelH: 180
        });
        const showMetricLead = hasCardSpace(density, {
          minW: 3,
          minH: 3,
          minPixelW: 180,
          minPixelH: 150
        });
        const showCompactMeta = hasCardSpace(density, {
          minW: 4,
          minH: 3,
          minPixelW: 260,
          minPixelH: 220
        });
        const showDetailedMeta = hasCardSpace(density, {
          minW: 6,
          minH: 4,
          minPixelW: 420,
          minPixelH: 300
        });
        const showValueUnit = hasCardSpace(density, {
          minW: 2,
          minH: 2,
          minPixelW: 120,
          minPixelH: 120
        });

        if (!runtime.farmId) {
          return <DataMessage message={`当前未绑定农场，无法装载${definition.label}。`} />;
        }

        if (runtime.loading && !metric) {
          return <DataLoadingState compact={compact} minimal={!showCompactMeta} />;
        }

        if (!metric) {
          return <DataMessage message={`当前农场暂无${definition.label}数据。`} />;
        }

        return (
          <>
            {showFlowTag ? (
              <div className="flex justify-end">
                <Tag color="processing">{flowLabel}</Tag>
              </div>
            ) : null}

            <div className={showFlowTag ? "" : "pt-1"}>
              {showMetricLead ? (
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                  Real-Time Metric
                </p>
              ) : null}
              <div className={clsx("flex flex-wrap items-end gap-3", showMetricLead ? "mt-4" : "mt-1")}>
                <span
                  className={clsx(
                    ultraCompact
                      ? "text-3xl font-semibold leading-none tracking-[-0.04em]"
                      : compact
                        ? "text-4xl font-semibold leading-none tracking-[-0.04em]"
                        : "text-5xl font-semibold leading-none tracking-[-0.04em]",
                    theme.valueClassName
                  )}
                >
                  {formatMetricValue(metric.metricValue)}
                </span>
                {showValueUnit ? (
                  <span
                    className={clsx(
                      "font-medium text-slate-500 dark:text-slate-300",
                      ultraCompact ? "pb-0 text-sm" : compact ? "pb-0.5 text-base" : "pb-1 text-lg"
                    )}
                  >
                    {metric.unit || definition.defaultUnit}
                  </span>
                ) : null}
              </div>
            </div>

            {showDetailedMeta ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetaPlate label="农场" value={runtime.farmName} />
                  <MetaPlate label="设备" value={String(metric.deviceId)} />
                  <MetaPlate label="温室" value={`#${metric.greenhouseId}`} />
                </div>

                <div className={SMART_DATA_INNER_PANEL_CLASS}>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    更新时间
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {formatDateTime(metric.collectedAt)}
                  </p>
                </div>
              </>
            ) : showCompactMeta ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetaPlate label="设备" value={String(metric.deviceId)} />
                <MetaPlate label="更新" value={formatDateTime(metric.collectedAt)} />
              </div>
            ) : null}
          </>
        );
      }}
    </SmartDataCardFrame>
  );
};

const SmartDataTelemetryChartCard = ({
  card,
  runtime,
  onRemove
}: {
  card: SmartDataCardOfType<"telemetryChart">;
  runtime: SmartDataRuntime;
  onRemove: () => void;
}) => {
  const definition = getCardDefinition(card.type);
  const theme = CARD_THEME[card.type];
  const mode = useThemeStore((state) => state.mode);
  const density = resolveCardDensity(card);

  const telemetryChartOption = useMemo<EChartsOption | null>(() => {
    if (runtime.telemetryHistory.length === 0) {
      return null;
    }

    const isDark = mode === "dark";
    const axisColor = isDark ? "rgba(226, 232, 240, 0.82)" : "rgba(51, 65, 85, 0.72)";
    const splitLineColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.18)";
    const textColor = isDark ? "#f8fafc" : "#1f2937";
    const tooltipBackground = isDark ? "rgba(3, 10, 18, 0.96)" : "rgba(255, 255, 255, 0.94)";
    const sortedPoints = [...runtime.telemetryHistory].sort(
      (left, right) => dayjs(left.collectedAt).valueOf() - dayjs(right.collectedAt).valueOf()
    );

    const metricCounts = new Map<string, number>();
    sortedPoints.forEach((item) => {
      const metricLabel = formatMetricCodeLabel(item.metricCode);
      metricCounts.set(metricLabel, (metricCounts.get(metricLabel) ?? 0) + 1);
    });

    const groupedSeries = new Map<
      string,
      {
        name: string;
        unit: string;
        data: [number, number][];
      }
    >();

    sortedPoints.forEach((item) => {
      const metricLabel = formatMetricCodeLabel(item.metricCode);
      const seriesKey = `${normalizeMetricCode(item.metricCode)}-${item.deviceId}`;
      const deviceSuffix =
        (metricCounts.get(metricLabel) ?? 0) > 1 ? ` · ${item.deviceId}` : "";
      const series = groupedSeries.get(seriesKey) ?? {
        name: `${metricLabel}${deviceSuffix}`,
        unit: item.unit || metricLabel,
        data: []
      };

      series.data.push([dayjs(item.collectedAt).valueOf(), Number(item.metricValue)]);
      groupedSeries.set(seriesKey, series);
    });

    const groupedSeriesList = Array.from(groupedSeries.values());
    const unitList = Array.from(new Set(groupedSeriesList.map((series) => series.unit)));
    const unitIndexMap = new Map(unitList.map((unit, index) => [unit, index]));
    const chartPointLimit = density.ultraCompact ? 12 : density.compact ? 20 : 32;

    return {
      backgroundColor: "transparent",
      animationDuration: 220,
      animationDurationUpdate: 180,
      color: TELEMETRY_CHART_COLORS,
      legend: {
        show: !density.compact,
        top: 0,
        left: 0,
        right: 0,
        type: "scroll",
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
        textStyle: {
          color: textColor,
          fontSize: 11
        }
      },
      tooltip: density.ultraCompact
        ? undefined
        : {
            trigger: "axis",
            backgroundColor: tooltipBackground,
            borderColor: isDark ? "rgba(52, 211, 153, 0.18)" : "rgba(21, 128, 61, 0.14)",
            borderWidth: 1,
            textStyle: {
              color: textColor,
              fontSize: 12
            }
          },
      grid: {
        top: density.compact ? 12 : 48,
        left: density.compact ? 0 : 8,
        right: density.compact ? 0 : 12 + Math.max(0, unitList.length - 1) * 34,
        bottom: density.compact ? 4 : 10,
        containLabel: !density.compact
      },
      xAxis: {
        type: "time",
        boundaryGap: [0, 0],
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: !density.compact,
          color: axisColor,
          formatter: (value: number) => dayjs(value).format("HH:mm:ss")
        },
        splitLine: {
          show: !density.compact,
          lineStyle: {
            color: splitLineColor,
            type: "dashed"
          }
        }
      },
      yAxis: unitList.map((unit, index) => ({
        type: "value",
        scale: true,
        position: index % 2 === 0 ? "left" : "right",
        offset: index < 2 ? 0 : Math.floor(index / 2) * 36,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: !density.compact,
          color: axisColor,
          formatter: (value: number) => formatTelemetryValue(value)
        },
        name: density.compact ? "" : unit,
        nameTextStyle: {
          color: axisColor,
          fontWeight: 500
        },
        splitLine: {
          show: index === 0 && !density.compact,
          lineStyle: {
            color: splitLineColor,
            type: "dashed"
          }
        }
      })),
      series: groupedSeriesList.map((series, index) => {
        const color = TELEMETRY_CHART_COLORS[index % TELEMETRY_CHART_COLORS.length];

        return {
          name: series.name,
          type: "line",
          smooth: 0.35,
          showSymbol: false,
          yAxisIndex: unitIndexMap.get(series.unit) ?? 0,
          lineStyle: {
            width: density.ultraCompact ? 2 : 2.8,
            color
          },
          areaStyle: density.ultraCompact
            ? undefined
            : {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: hexToRgba(color, isDark ? 0.24 : 0.16) },
                    { offset: 1, color: hexToRgba(color, 0.01) }
                  ]
                }
              },
          data: series.data.slice(-chartPointLimit)
        };
      })
    };
  }, [density.compact, density.ultraCompact, mode, runtime.telemetryHistory]);

  return (
    <SmartDataCardFrame
      card={card}
      title={definition.label}
      description={definition.description}
      icon={theme.icon}
      shellClassName={theme.shellClassName}
      iconClassName={theme.iconClassName}
      onRemove={onRemove}
    >
      {(cardDensity) => {
        const { compact, ultraCompact } = cardDensity;
        const showTrendTag = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 230,
          minPixelH: 180
        });
        const showSummary = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 260,
          minPixelH: 220
        });
        const showMetricTag = hasCardSpace(cardDensity, {
          minW: 6,
          minH: 4,
          minPixelW: 360,
          minPixelH: 260
        });
        const chartMinHeight = hasCardSpace(cardDensity, {
          minW: 5,
          minH: 4,
          minPixelW: 360,
          minPixelH: 300
        })
          ? 220
          : hasCardSpace(cardDensity, {
                minW: 3,
                minH: 3,
                minPixelW: 220,
                minPixelH: 180
              })
            ? 140
            : 72;

        if (!runtime.farmId) {
          return <DataMessage message="当前未绑定农场，无法装载遥测曲线。" />;
        }

        if (runtime.loading && runtime.telemetryHistory.length === 0) {
          return <DataLoadingState compact={compact} minimal={!showSummary} />;
        }

        if (!telemetryChartOption) {
          return <DataMessage message="当前农场暂无可用于绘制曲线的实时遥测数据。" />;
        }

        return (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            {showTrendTag ? (
              <div className="mb-1 flex justify-end">
                <Tag color="green">趋势</Tag>
              </div>
            ) : null}

            {showSummary ? (
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    Telemetry Stream
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    最近 {runtime.telemetryHistory.length} 个采样点
                  </p>
                </div>
                {showMetricTag ? <Tag color="processing">温 / 湿 / 光</Tag> : null}
              </div>
            ) : null}

            <div className="community-surface min-h-0 flex-1 overflow-hidden rounded-[22px] border border-white/60 p-2 dark:border-white/10">
              <ReactECharts
                option={telemetryChartOption}
                style={{
                  height: "100%",
                  minHeight: chartMinHeight,
                  width: "100%"
                }}
                opts={{ renderer: "canvas" }}
                notMerge
                lazyUpdate
              />
            </div>
          </div>
        );
      }}
    </SmartDataCardFrame>
  );
};

const SmartDataBoardLightCard = ({
  card,
  runtime,
  onRemove,
  onToggleBoardLight
}: {
  card: SmartDataCardOfType<"boardLightControl">;
  runtime: SmartDataRuntime;
  onRemove: () => void;
  onToggleBoardLight: (targetState: "ON" | "OFF") => Promise<void>;
}) => {
  const definition = getCardDefinition(card.type);
  const theme = CARD_THEME[card.type];
  const boardLight = runtime.boardLight;

  return (
    <SmartDataCardFrame
      card={card}
      title={definition.label}
      description={definition.description}
      icon={theme.icon}
      shellClassName={theme.shellClassName}
      iconClassName={theme.iconClassName}
      onRemove={onRemove}
    >
      {(cardDensity) => {
        const { compact, ultraCompact } = cardDensity;
        const showOnlineTag = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 240,
          minPixelH: 180
        });
        const showStatusPanel = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 240,
          minPixelH: 200
        });
        const showLedBadge = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 260,
          minPixelH: 210
        });
        const showMetaGrid = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 4,
          minPixelW: 280,
          minPixelH: 270
        });
        const showGreenhouseMeta = hasCardSpace(cardDensity, {
          minW: 6,
          minH: 4,
          minPixelW: 380,
          minPixelH: 280
        });
        const showSwitchHelper = hasCardSpace(cardDensity, {
          minW: 4,
          minH: 3,
          minPixelW: 260,
          minPixelH: 220
        });

        if (!runtime.farmId) {
          return <DataMessage message="当前未绑定农场，无法下发开发板灯控命令。" />;
        }

        if (!boardLight.available) {
          return <DataMessage message="当前农场尚未接入 BearPi 开发板。" />;
        }

        if (!showStatusPanel && !showMetaGrid) {
          return (
            <div className={clsx(SMART_DATA_INNER_PANEL_CLASS, "flex h-full flex-1 items-center justify-between gap-3")}>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  灯光状态
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-slate-900 dark:text-white">
                  {resolveBoardLightStateLabel(boardLight.state)}
                </p>
              </div>
              <Switch
                checked={boardLight.state === "ON"}
                loading={boardLight.pending}
                disabled={!boardLight.greenhouseId}
                onChange={(checked) => void onToggleBoardLight(checked ? "ON" : "OFF")}
              />
            </div>
          );
        }

        return (
          <div className="flex h-full flex-1 flex-col justify-between gap-4">
            {showOnlineTag ? (
              <div className="flex justify-end">
                <Tag color={boardLight.online ? "green" : "default"}>
                  {boardLight.online ? "在线" : "离线"}
                </Tag>
              </div>
            ) : null}

            {showStatusPanel ? (
              <div className={SMART_DATA_INNER_PANEL_CLASS}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  当前灯光状态
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span
                    className={clsx(
                      "font-semibold tracking-[-0.03em] text-slate-900 dark:text-white",
                      ultraCompact ? "text-2xl" : compact ? "text-3xl" : "text-4xl"
                    )}
                  >
                    {resolveBoardLightStateLabel(boardLight.state)}
                  </span>
                  {showLedBadge ? (
                    <span
                      className={clsx(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        boardLight.state === "ON"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/12 dark:text-emerald-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                      )}
                    >
                      {boardLight.state === "ON" ? "LED ON" : boardLight.state === "OFF" ? "LED OFF" : "未知"}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showMetaGrid ? (
              <div className={clsx("grid gap-3", showGreenhouseMeta ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                <MetaPlate label="设备" value={boardLight.deviceName} />
                <MetaPlate
                  label="控制状态"
                  value={boardLight.pending ? "命令处理中" : boardLight.online ? "可控制" : "等待设备上线"}
                />
                {showGreenhouseMeta ? (
                  <MetaPlate
                    label="绑定大棚"
                    value={boardLight.greenhouseId ? `#${boardLight.greenhouseId}` : "未绑定"}
                  />
                ) : null}
              </div>
            ) : null}

            <div className={clsx(SMART_DATA_INNER_PANEL_CLASS, "flex items-center justify-between")}>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">灯光开关</p>
                {showSwitchHelper ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    通过 MQTT 指令控制 BearPi 开发板上的 LED。
                  </p>
                ) : null}
              </div>
              <Switch
                checked={boardLight.state === "ON"}
                loading={boardLight.pending}
                disabled={!boardLight.greenhouseId}
                onChange={(checked) => void onToggleBoardLight(checked ? "ON" : "OFF")}
              />
            </div>
          </div>
        );
      }}
    </SmartDataCardFrame>
  );
};

const SmartDataActionCard = ({
  card,
  onRemove
}: {
  card: SmartDataCardOfType<"startDiagnosis" | "openCommunity">;
  onRemove: () => void;
}) => {
  const definition = getCardDefinition(card.type);
  const theme = CARD_THEME[card.type];
  const navigate = useNavigate();

  const actionConfig = {
    startDiagnosis: {
      buttonLabel: "发起诊断",
      helperLabel: "Crop Diagnosis",
      action: () => navigate("/crop-diagnosis")
    },
    openCommunity: {
      buttonLabel: "打开论坛",
      helperLabel: "Gengzhi Forum",
      action: () => {
        window.open(GENGZHI_FORUM_URL, "_blank", "noopener,noreferrer");
      }
    }
  } as const;

  const config = actionConfig[card.type];

  return (
    <SmartDataCardFrame
      card={card}
      title={definition.label}
      description={definition.description}
      icon={theme.icon}
      shellClassName={theme.shellClassName}
      iconClassName={theme.iconClassName}
      onRemove={onRemove}
    >
      {(density) => {
        const { compact, ultraCompact } = density;
        const showActionPanel = hasCardSpace(density, {
          minW: 4,
          minH: 4,
          minPixelW: 250,
          minPixelH: 240
        });
        const showHelperLabel = hasCardSpace(density, {
          minW: 4,
          minH: 3,
          minPixelW: 220,
          minPixelH: 180
        });
        const showDescription = hasCardSpace(density, {
          minW: 6,
          minH: 4,
          minPixelW: 360,
          minPixelH: 260
        });

        if (!showActionPanel) {
          return (
            <div className="flex h-full flex-1 items-center justify-center">
              <Button
                type="primary"
                size="middle"
                icon={theme.icon}
                onClick={config.action}
                className="smart-data-card-action community-primary-btn"
              >
                {config.buttonLabel}
              </Button>
            </div>
          );
        }

        return (
          <div className="flex h-full flex-1 flex-col justify-between">
            <div className={SMART_DATA_INNER_PANEL_CLASS}>
              {showHelperLabel ? (
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {config.helperLabel}
                </p>
              ) : null}
              <p
                className={clsx(
                  "font-semibold tracking-[-0.03em] text-slate-900 dark:text-white",
                  showHelperLabel ? "mt-3" : "",
                  ultraCompact ? "text-xl" : compact ? "text-2xl" : "text-3xl"
                )}
              >
                {definition.label}
              </p>
              {showDescription ? (
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                  {definition.description}
                </p>
              ) : null}
            </div>

            <Button
              type="primary"
              size={ultraCompact ? "middle" : "large"}
              icon={theme.icon}
              onClick={config.action}
              className="smart-data-card-action community-primary-btn mt-4"
            >
              {config.buttonLabel}
            </Button>
          </div>
        );
      }}
    </SmartDataCardFrame>
  );
};

export const SmartDataCard = ({
  card,
  runtime,
  onRemove,
  onToggleBoardLight
}: SmartDataCardProps) => {
  switch (card.type) {
    case "temperature":
    case "humidity":
    case "light":
      return (
        <SmartDataMetricCard
          card={card as SmartDataCardOfType<"temperature" | "humidity" | "light">}
          runtime={runtime}
          onRemove={onRemove}
        />
      );
    case "telemetryChart":
      return (
        <SmartDataTelemetryChartCard
          card={card as SmartDataCardOfType<"telemetryChart">}
          runtime={runtime}
          onRemove={onRemove}
        />
      );
    case "boardLightControl":
      return (
        <SmartDataBoardLightCard
          card={card as SmartDataCardOfType<"boardLightControl">}
          runtime={runtime}
          onRemove={onRemove}
          onToggleBoardLight={onToggleBoardLight}
        />
      );
    case "startDiagnosis":
    case "openCommunity":
      return (
        <SmartDataActionCard
          card={card as SmartDataCardOfType<"startDiagnosis" | "openCommunity">}
          onRemove={onRemove}
        />
      );
  }
};
