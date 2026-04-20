import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ReactGridLayout, {
  type Layout,
  useContainerWidth,
  verticalCompactor
} from "react-grid-layout";
import { AppCard } from "@/components/common/AppCard";
import { SmartDataCard } from "./card-system";
import {
  buildLayout,
  resolveSocketTagColor,
  SMART_DATA_GRID_COLS,
  SMART_DATA_GRID_MARGIN,
  SMART_DATA_GRID_ROW_HEIGHT,
  resolveSmartDataMaxRows,
  type SmartDataCardItem,
  type SmartDataRuntime
} from "./model";

interface SmartDataCenterCanvasPanelProps {
  cards: SmartDataCardItem[];
  maxRows: number;
  runtime: SmartDataRuntime;
  onRefresh: () => Promise<void>;
  onRemoveCard: (cardId: string) => void;
  onLayoutChange: (layout: Layout) => void;
  onMaxRowsChange: (maxRows: number) => void;
  onToggleBoardLight: (targetState: "ON" | "OFF") => Promise<void>;
}

export const SmartDataCenterCanvasPanel = ({
  cards,
  maxRows,
  runtime,
  onRefresh,
  onRemoveCard,
  onLayoutChange,
  onMaxRowsChange,
  onToggleBoardLight
}: SmartDataCenterCanvasPanelProps) => {
  const { width, containerRef, mounted } = useContainerWidth();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedMaxRowsRef = useRef<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const layout = useMemo(() => buildLayout(cards), [cards]);
  const effectiveViewportHeight = viewportHeight > 0 ? viewportHeight : 360;

  useEffect(() => {
    const node = viewportRef.current;

    if (!node) {
      return;
    }

    const updateHeight = (nextHeight: number) => {
      setViewportHeight((current) => {
        const roundedCurrent = Math.round(current);
        const roundedNext = Math.round(nextHeight);
        return roundedCurrent === roundedNext ? current : nextHeight;
      });
    };

    updateHeight(node.getBoundingClientRect().height);

    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }

        rafId = window.requestAnimationFrame(() => {
          updateHeight(entry.contentRect.height);
          rafId = null;
        });
      }
    });

    observer.observe(node);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const nextMaxRows = resolveSmartDataMaxRows(effectiveViewportHeight);

    if (lastEmittedMaxRowsRef.current === nextMaxRows) {
      return;
    }

    lastEmittedMaxRowsRef.current = nextMaxRows;
    onMaxRowsChange(nextMaxRows);
  }, [effectiveViewportHeight, onMaxRowsChange]);

  return (
    <AppCard
      title="动态卡片容器"
      extra={
        <div className="flex flex-wrap items-center gap-2">
          <Tag color={runtime.farmId ? "blue" : "red"}>
            {runtime.farmId ? `${runtime.farmName} · farmId ${runtime.farmId}` : "未绑定农场"}
          </Tag>
          <Tag color={resolveSocketTagColor(runtime.socketState)}>
            {runtime.socketState === "online"
              ? `MQTT 在线 ${runtime.socketLatency} ms`
              : runtime.socketState === "connecting"
                ? "MQTT 连接中"
                : "MQTT 离线"}
          </Tag>
          <Tag color="green">{`${cards.length} 张卡片`}</Tag>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={runtime.loading}
            onClick={() => void onRefresh()}
          >
            刷新
          </Button>
        </div>
      }
      className="flex min-h-[420px] flex-col xl:h-full xl:min-h-0"
    >
      <div ref={containerRef} className="flex min-h-[360px] flex-1 flex-col xl:min-h-0">
        <div ref={viewportRef} className="flex-1 overflow-hidden xl:min-h-0">
          {!cards.length ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-slate-300/80 bg-slate-50/70 p-8 text-center dark:border-white/12 dark:bg-white/5">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">容器为空</p>
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                  通过左下角控制台添加需要的动态卡片。
                </p>
              </div>
            </div>
          ) : mounted ? (
            <ReactGridLayout
              className="smart-data-grid"
              width={width}
              layout={layout}
              gridConfig={{
                cols: SMART_DATA_GRID_COLS,
                rowHeight: SMART_DATA_GRID_ROW_HEIGHT,
                margin: SMART_DATA_GRID_MARGIN,
                containerPadding: [0, 0],
                maxRows
              }}
              dragConfig={{
                enabled: true,
                bounded: true,
                handle: ".smart-data-card-handle",
                cancel: ".smart-data-card-action"
              }}
              resizeConfig={{
                enabled: true,
                handles: ["se"]
              }}
              compactor={verticalCompactor}
              autoSize={false}
              style={{ height: effectiveViewportHeight }}
              onLayoutChange={onLayoutChange}
            >
              {cards.map((card) => (
                <div key={card.id} className="smart-data-grid-item">
                  <SmartDataCard
                    card={card}
                    runtime={runtime}
                    onRemove={() => onRemoveCard(card.id)}
                    onToggleBoardLight={onToggleBoardLight}
                  />
                </div>
              ))}
            </ReactGridLayout>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="h-[280px] animate-pulse rounded-[28px] bg-white/70 dark:bg-white/5" />
              <div className="h-[280px] animate-pulse rounded-[28px] bg-white/70 dark:bg-white/5" />
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
};
