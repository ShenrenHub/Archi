import { Button, Tag } from "antd";
import { DownOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import clsx from "clsx";
import { AppCard } from "@/components/common/AppCard";
import {
  SMART_DATA_BRICK_REGISTRY,
} from "./card-system";
import {
  SMART_DATA_BLOCK_ORDER,
  SMART_DATA_CARD_TEMPLATES,
  type SmartDataBlockType
} from "./model";

interface SmartDataCenterConsoleProps {
  open: boolean;
  selectedBlocks: SmartDataBlockType[];
  onToggleOpen: () => void;
  onAddTemplateCard: (blockTypes: SmartDataBlockType[]) => void;
  onToggleBlock: (type: SmartDataBlockType) => void;
  onBuildCustomCard: () => void;
}

export const SmartDataCenterConsole = ({
  open,
  selectedBlocks,
  onToggleOpen,
  onAddTemplateCard,
  onToggleBlock,
  onBuildCustomCard
}: SmartDataCenterConsoleProps) => (
  <AppCard
    title="控制台"
    extra={
      <Button type="text" icon={open ? <UpOutlined /> : <DownOutlined />} onClick={onToggleOpen}>
        {open ? "收起" : "展开"}
      </Button>
    }
  >
    {open ? (
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">快速添加</p>
            <Tag color="green">工厂模板</Tag>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
            单体卡、组合卡分别使用不同尺寸规则，直接投放即可。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {SMART_DATA_CARD_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => onAddTemplateCard(template.blockTypes)}
                className="rounded-[22px] border border-slate-200/80 bg-white/88 p-4 text-left transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/45 dark:hover:border-emerald-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {template.label}
                  </p>
                  <span className="text-xs text-slate-500 dark:text-slate-300">
                    {template.blockTypes.length} 块
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {template.blockTypes.map((type) => (
                    <Tag key={`${template.key}-${type}`}>{SMART_DATA_BRICK_REGISTRY[type].label}</Tag>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">自由拼装</p>
            <Tag>无标题</Tag>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
            只选择积木，卡片尺寸会根据组合自动切换。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SMART_DATA_BLOCK_ORDER.map((type) => {
              const definition = SMART_DATA_BRICK_REGISTRY[type];
              const active = selectedBlocks.includes(type);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleBlock(type)}
                  className={clsx(
                    "rounded-[22px] border p-4 text-left transition",
                    active
                      ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/12"
                      : "border-slate-200/80 bg-white/88 hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/45 dark:hover:border-white/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-[16px] text-lg",
                        definition.iconClassName
                      )}
                    >
                      {definition.icon}
                    </div>
                    {active ? <Tag color="green">已选</Tag> : null}
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                    {definition.label}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {selectedBlocks.length > 0 ? (
                selectedBlocks.map((type) => (
                  <Tag key={`selected-${type}`}>{SMART_DATA_BRICK_REGISTRY[type].label}</Tag>
                ))
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-300">尚未选择积木</span>
              )}
            </div>

            <Button type="primary" icon={<PlusOutlined />} onClick={onBuildCustomCard}>
              生成卡片
            </Button>
          </div>
        </section>
      </div>
    ) : (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        展开后可添加模板卡片，或根据积木组合生成不同尺寸的卡片。
      </p>
    )}
  </AppCard>
);
