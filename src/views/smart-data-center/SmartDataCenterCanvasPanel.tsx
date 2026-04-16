import { Button, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { AppCard } from "@/components/common/AppCard";
import { SmartDataCardBoard } from "./card-system";
import { resolveSocketTagColor, type SmartDataCardItem, type SmartDataRuntime } from "./model";

interface SmartDataCenterCanvasPanelProps {
  cards: SmartDataCardItem[];
  farmId: number | null;
  farmName: string;
  runtime: SmartDataRuntime;
  onRefresh: () => Promise<void>;
  onRemoveCard: (cardId: string) => void;
}

export const SmartDataCenterCanvasPanel = ({
  cards,
  farmId,
  farmName,
  runtime,
  onRefresh,
  onRemoveCard
}: SmartDataCenterCanvasPanelProps) => (
  <AppCard
    title="动态卡片容器"
    extra={
      <div className="flex flex-wrap items-center gap-2">
        <Tag color={farmId ? "blue" : "red"}>
          {farmId ? `${farmName} · farmId ${farmId}` : "未绑定农场"}
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
    className="min-h-[420px] xl:min-h-0"
  >
    <div className="h-full overflow-y-auto pr-1">
      <SmartDataCardBoard cards={cards} runtime={runtime} onRemoveCard={onRemoveCard} />
    </div>
  </AppCard>
);
