import { useState } from "react";
import { message } from "antd";
import { SmartDataCenterCanvasPanel } from "./SmartDataCenterCanvasPanel";
import { SmartDataCenterChatPanel } from "./SmartDataCenterChatPanel";
import { SmartDataCenterConsole } from "./SmartDataCenterConsole";
import { useSmartDataCenterChat } from "./useSmartDataCenterChat";
import { useSmartDataCenterRuntime } from "./useSmartDataCenterRuntime";
import {
  DEFAULT_CUSTOM_BLOCKS,
  buildCard,
  buildInitialCards,
  sortBlockTypes,
  type SmartDataBlockType,
  type SmartDataCardItem
} from "./model";

export default function SmartDataCenterPage() {
  const [cards, setCards] = useState<SmartDataCardItem[]>(() => buildInitialCards());
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [selectedBlocks, setSelectedBlocks] =
    useState<SmartDataBlockType[]>(DEFAULT_CUSTOM_BLOCKS);

  const { farmId, farmName, runtime, refreshRuntime } = useSmartDataCenterRuntime(() => {
    message.error("智慧数据中心实体装载失败");
  });
  const { messages, question, sending, setQuestion, sendQuestion } = useSmartDataCenterChat();

  const handleAddTemplateCard = (blockTypes: SmartDataBlockType[]) => {
    setCards((current) => [buildCard(blockTypes), ...current]);
  };

  const handleToggleBlock = (type: SmartDataBlockType) => {
    setSelectedBlocks((current) => {
      const next = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return sortBlockTypes(next);
    });
  };

  const handleBuildCustomCard = () => {
    if (!selectedBlocks.length) {
      message.warning("至少选择一个积木");
      return;
    }

    setCards((current) => [buildCard(selectedBlocks), ...current]);
    setSelectedBlocks(DEFAULT_CUSTOM_BLOCKS);
  };

  const handleRemoveCard = (cardId: string) => {
    setCards((current) => current.filter((item) => item.id !== cardId));
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SmartDataCenterCanvasPanel
          cards={cards}
          farmId={farmId}
          farmName={farmName}
          runtime={runtime}
          onRefresh={() => refreshRuntime().then(() => undefined)}
          onRemoveCard={handleRemoveCard}
        />

        <SmartDataCenterChatPanel
          messages={messages}
          question={question}
          sending={sending}
          onQuestionChange={setQuestion}
          onSend={sendQuestion}
        />
      </div>

      <SmartDataCenterConsole
        open={consoleOpen}
        selectedBlocks={selectedBlocks}
        onToggleOpen={() => setConsoleOpen((current) => !current)}
        onAddTemplateCard={handleAddTemplateCard}
        onToggleBlock={handleToggleBlock}
        onBuildCustomCard={handleBuildCustomCard}
      />
    </div>
  );
}
