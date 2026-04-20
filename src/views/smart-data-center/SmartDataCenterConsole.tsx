import { Button } from "antd";
import {
  AppstoreAddOutlined,
  CloseOutlined,
  PlusOutlined
} from "@ant-design/icons";
import {
  SMART_DATA_CARD_LIBRARY,
  type SmartDataCardItem,
  type SmartDataCardType
} from "./model";

interface SmartDataCenterConsoleProps {
  open: boolean;
  cards: SmartDataCardItem[];
  onToggleOpen: () => void;
  onAddCard: (type: SmartDataCardType) => void;
}

export const SmartDataCenterConsole = ({
  open,
  cards,
  onToggleOpen,
  onAddCard
}: SmartDataCenterConsoleProps) => {
  const emptyCounts: Record<SmartDataCardType, number> = {
    temperature: 0,
    humidity: 0,
    light: 0,
    telemetryChart: 0,
    boardLightControl: 0,
    startDiagnosis: 0,
    openCommunity: 0
  };
  const cardCounts = cards.reduce<Record<SmartDataCardType, number>>(
    (accumulator, card) => {
      accumulator[card.type] += 1;
      return accumulator;
    },
    emptyCounts
  );
  const triggerLabel = open ? "收起控制台" : "控制台";

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-start gap-3">
      {open ? (
        <section className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/84 dark:shadow-[0_24px_60px_rgba(2,6,23,0.5)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400">
                Quick Control
              </p>
              <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                动态卡片控制台
              </p>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onToggleOpen}
            />
          </div>

          <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-300">当前卡片</span>
              <span className="text-lg font-semibold text-slate-950 dark:text-white">
                {cards.length}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {SMART_DATA_CARD_LIBRARY.map((definition) => (
              <button
                key={definition.type}
                type="button"
                onClick={() => onAddCard(definition.type)}
                className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-slate-50/72 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30 dark:hover:bg-white/8"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {definition.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    已有 {cardCounts[definition.type]} 张
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_10px_18px_rgba(16,185,129,0.28)]">
                  <PlusOutlined />
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-300">
            空间不足时自动缩小卡片，满载后移除最早卡片。
          </p>
        </section>
      ) : null}

      <button
        type="button"
        onClick={onToggleOpen}
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/92 px-4 py-3 text-sm font-medium text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950/88 dark:text-white dark:shadow-[0_18px_40px_rgba(2,6,23,0.5)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1e40af,#3b82f6)] text-white shadow-[0_12px_22px_rgba(59,130,246,0.3)]">
          <AppstoreAddOutlined />
        </span>
        <span>{triggerLabel}</span>
      </button>
    </div>
  );
};
