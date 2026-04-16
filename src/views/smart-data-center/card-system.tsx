import type { ReactNode } from "react";
import { Button } from "antd";
import {
  BulbOutlined,
  CameraOutlined,
  DeleteOutlined,
  ExperimentOutlined
} from "@ant-design/icons";
import clsx from "clsx";
import type { LatestTelemetryItem, TelemetryOverviewItem } from "@/api/telemetry";
import type {
  SmartDataBlockType,
  SmartDataCardItem,
  SmartDataRuntime,
  SmartDataBrickDefinition
} from "./model";
import { normalizeMetricCode } from "./model";

interface SmartDataCardBoardProps {
  cards: SmartDataCardItem[];
  runtime: SmartDataRuntime;
  onRemoveCard: (cardId: string) => void;
}

const LIGHT_METRIC_CODES = ["light", "light_lux", "brightness"];

const DataLoadingState = () => (
  <div className="space-y-3">
    <div className="h-16 animate-pulse rounded-[18px] bg-white/75 dark:bg-white/10" />
    <div className="h-20 animate-pulse rounded-[18px] bg-white/75 dark:bg-white/10" />
  </div>
);

const DataEmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[188px] items-center rounded-[18px] border border-dashed border-slate-300/80 bg-white/68 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-white/12 dark:bg-slate-950/35 dark:text-slate-300">
    {message}
  </div>
);

const MetricPlate = ({
  eyebrow,
  value,
  caption,
  className,
  reverse = false
}: {
  eyebrow: string;
  value: string;
  caption?: string;
  className?: string;
  reverse?: boolean;
}) => (
  <div
    className={clsx(
      "flex h-full min-h-[156px] flex-col justify-between rounded-[20px] border px-4 py-4",
      reverse
        ? "border-white/10 bg-slate-950 text-white"
        : "border-white/60 bg-white/82 text-slate-950 dark:border-white/8 dark:bg-slate-950/45 dark:text-white",
      className
    )}
  >
    <div>
      <p
        className={clsx(
          "text-[11px] uppercase tracking-[0.24em]",
          reverse ? "text-slate-400" : "text-slate-500 dark:text-slate-300"
        )}
      >
        {eyebrow}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
    {caption ? (
      <p
        className={clsx(
          "text-xs leading-5",
          reverse ? "text-slate-300" : "text-slate-500 dark:text-slate-300"
        )}
      >
        {caption}
      </p>
    ) : null}
  </div>
);

const MetaRow = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-[16px] bg-white/78 px-4 py-3 text-sm dark:bg-slate-950/42">
    <span className="text-slate-500 dark:text-slate-300">{label}</span>
    <span className="truncate text-right font-medium text-slate-900 dark:text-white">
      {value}
    </span>
  </div>
);

const SmartDataBlockShell = ({
  definition,
  children
}: {
  definition: SmartDataBrickDefinition;
  children: ReactNode;
}) => (
  <section
    className={clsx(
      "flex h-full min-h-[180px] flex-col overflow-hidden rounded-[24px] border p-4 shadow-sm transition dark:shadow-none",
      definition.shellClassName
    )}
  >
    <div className="mb-4 flex items-center gap-3">
      <div
        className={clsx(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-lg",
          definition.iconClassName
        )}
      >
        {definition.icon}
      </div>
      <p className="text-sm font-semibold tracking-[0.01em] text-slate-900 dark:text-white">
        {definition.label}
      </p>
    </div>
    <div className="flex-1">{children}</div>
  </section>
);

const averageNumbers = (values: Array<number | null | undefined>) => {
  const validValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );

  if (!validValues.length) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
};

const formatMetric = (value: number | null | undefined, digits = 0, suffix = "") => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return `${value.toFixed(digits)}${suffix}`;
};

const pickLatestMetric = (latestTelemetry: LatestTelemetryItem[], metricCodes: string[]) => {
  const aliases = metricCodes.map(normalizeMetricCode);
  return latestTelemetry.find((item) => aliases.includes(normalizeMetricCode(item.metricCode)));
};

const renderLightBrick = (runtime: SmartDataRuntime) => {
  if (!runtime.farmId) {
    return <DataEmptyState message="当前未绑定农场，无法装载光照数据。" />;
  }

  const lightRows = runtime.telemetryOverview.filter(
    (item): item is TelemetryOverviewItem & { lightLux: number } => item.lightLux !== null
  );
  const latestLight = pickLatestMetric(runtime.latestTelemetry, LIGHT_METRIC_CODES);

  if (runtime.loading && lightRows.length === 0) {
    return <DataLoadingState />;
  }

  if (!lightRows.length) {
    return <DataEmptyState message="当前农场暂无光照数据。" />;
  }

  const averageLight = averageNumbers(lightRows.map((item) => item.lightLux));
  const brightestGreenhouse = [...lightRows].sort((left, right) => right.lightLux - left.lightLux)[0];

  return (
    <div className="flex h-full flex-col gap-3">
      <MetricPlate
        eyebrow="平均光照"
        value={formatMetric(averageLight, 0, " Lux")}
        caption={`${lightRows.length} 个实体参与聚合`}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <MetaRow
          label="峰值"
          value={
            brightestGreenhouse
              ? `${brightestGreenhouse.greenhouseName} · ${formatMetric(brightestGreenhouse.lightLux, 0, " Lux")}`
              : "--"
          }
        />
        <MetaRow
          label="最新"
          value={
            latestLight
              ? formatMetric(latestLight.metricValue, 0, ` ${latestLight.unit}`)
              : "等待推送"
          }
        />
      </div>
    </div>
  );
};

const renderClimateBrick = (runtime: SmartDataRuntime) => {
  if (!runtime.farmId) {
    return <DataEmptyState message="当前未绑定农场，无法装载温湿度数据。" />;
  }

  const climateRows = runtime.telemetryOverview.filter(
    (item) => item.temperature !== null || item.humidity !== null
  );

  if (runtime.loading && climateRows.length === 0) {
    return <DataLoadingState />;
  }

  if (!climateRows.length) {
    return <DataEmptyState message="当前农场暂无温湿度数据。" />;
  }

  const averageTemperature = averageNumbers(climateRows.map((item) => item.temperature));
  const averageHumidity = averageNumbers(climateRows.map((item) => item.humidity));

  return (
    <div className="grid h-full gap-3 sm:grid-cols-2">
      <MetricPlate
        eyebrow="温度"
        value={formatMetric(averageTemperature, 1, "°C")}
        caption={runtime.farmName}
      />
      <MetricPlate
        eyebrow="湿度"
        value={formatMetric(averageHumidity, 1, "%")}
        caption={`${climateRows.length} 个实体`}
      />
    </div>
  );
};

const renderCameraBrick = (runtime: SmartDataRuntime) => {
  if (!runtime.farmId) {
    return <DataEmptyState message="当前未绑定农场，无法装载摄像头数据。" />;
  }

  if (runtime.loading && runtime.cameras.length === 0) {
    return <DataLoadingState />;
  }

  if (!runtime.cameras.length) {
    return <DataEmptyState message="当前农场暂无摄像头实体。" />;
  }

  const primaryCamera = runtime.cameras[0];
  const playableCount = runtime.cameras.filter((item) => item.playbackToken).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <MetricPlate
        eyebrow="摄像头"
        value={`${runtime.cameras.length} 路`}
        caption={primaryCamera.cameraName}
        reverse
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <MetaRow label="可播放" value={`${playableCount} 路`} />
        <MetaRow label="协议" value={primaryCamera.streamProtocol || "未配置"} />
      </div>
    </div>
  );
};

export const SMART_DATA_BRICK_REGISTRY: Record<
  SmartDataBlockType,
  SmartDataBrickDefinition
> = {
  light: {
    type: "light",
    label: "光照强度",
    icon: <BulbOutlined />,
    shellClassName:
      "border-amber-200/80 bg-[linear-gradient(180deg,rgba(254,243,199,0.82),rgba(255,251,235,0.72))] dark:border-amber-500/20 dark:bg-amber-500/10",
    iconClassName:
      "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
    render: renderLightBrick
  },
  climate: {
    type: "climate",
    label: "温湿度",
    icon: <ExperimentOutlined />,
    shellClassName:
      "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(220,252,231,0.84),rgba(240,253,244,0.72))] dark:border-emerald-500/20 dark:bg-emerald-500/10",
    iconClassName:
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
    render: renderClimateBrick
  },
  camera: {
    type: "camera",
    label: "摄像头",
    icon: <CameraOutlined />,
    shellClassName:
      "border-sky-200/80 bg-[linear-gradient(180deg,rgba(224,242,254,0.84),rgba(240,249,255,0.72))] dark:border-sky-500/20 dark:bg-sky-500/10",
    iconClassName:
      "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100",
    render: renderCameraBrick
  }
};

const resolveCardSpanClassName = (count: number) => {
  if (count <= 1) {
    return "md:col-span-1 xl:col-span-4";
  }

  if (count === 2) {
    return "md:col-span-2 xl:col-span-6";
  }

  return "md:col-span-2 xl:col-span-8";
};

const resolveCardMinHeightClassName = (count: number) => {
  if (count <= 1) {
    return "min-h-[320px]";
  }

  if (count === 2) {
    return "min-h-[360px]";
  }

  return "min-h-[440px]";
};

const resolveBlockGridClassName = (count: number) => {
  if (count <= 1) {
    return "grid-cols-1";
  }

  return "grid-cols-1 lg:grid-cols-2";
};

const resolveBlockSlotClassName = (count: number, index: number) => {
  if (count === 3 && index === 0) {
    return "lg:col-span-2";
  }

  return "";
};

export const SmartDataCardBoard = ({
  cards,
  runtime,
  onRemoveCard
}: SmartDataCardBoardProps) => {
  if (!cards.length) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-slate-300/80 bg-slate-50/70 p-8 text-center dark:border-white/12 dark:bg-white/5">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">容器为空</p>
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
            展开下方控制台后，添加模板卡片或自由拼装。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
      {cards.map((card) => (
        <article
          key={card.id}
          className={clsx(
            "relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55 sm:p-5",
            resolveCardSpanClassName(card.blockTypes.length),
            resolveCardMinHeightClassName(card.blockTypes.length)
          )}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemoveCard(card.id)}
            className="!absolute right-2 top-2 z-10"
          />

          <div
            className={clsx(
              "grid h-full flex-1 gap-4 pr-8",
              resolveBlockGridClassName(card.blockTypes.length)
            )}
          >
            {card.blockTypes.map((type, index) => (
              <div
                key={`${card.id}-${type}-brick`}
                className={clsx(
                  "h-full",
                  resolveBlockSlotClassName(card.blockTypes.length, index)
                )}
              >
                <SmartDataBlockShell definition={SMART_DATA_BRICK_REGISTRY[type]}>
                  {SMART_DATA_BRICK_REGISTRY[type].render(runtime)}
                </SmartDataBlockShell>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
};
