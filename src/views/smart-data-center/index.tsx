import { useCallback, useState } from "react";
import { message } from "antd";
import type { Layout } from "react-grid-layout";
import { SmartDataCenterCanvasPanel } from "./SmartDataCenterCanvasPanel";
import { SmartDataCenterConsole } from "./SmartDataCenterConsole";
import { useSmartDataCenterRuntime } from "./useSmartDataCenterRuntime";
import {
  buildInitialCards,
  createSmartDataCard,
  fitCardsToViewport,
  getNextCardY,
  hasCardLayoutChanged,
  resolveSmartDataMaxRows,
  syncCardsWithLayout,
  type SmartDataCardItem,
  type SmartDataCardType
} from "./model";

export default function SmartDataCenterPage() {
  const [cards, setCards] = useState<SmartDataCardItem[]>(() => buildInitialCards());
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [maxRows, setMaxRows] = useState(() => resolveSmartDataMaxRows(360));
  const handleRuntimeLoadFailed = useCallback(() => {
    message.error("智慧数据中心实时数据装载失败");
  }, []);
  const { runtime, refreshRuntime, toggleBoardLight } = useSmartDataCenterRuntime(
    handleRuntimeLoadFailed
  );

  const handleAddCard = (type: SmartDataCardType) => {
    const { cards: nextCards, removedCards } = fitCardsToViewport(
      [...cards, createSmartDataCard(type, getNextCardY(cards))],
      maxRows
    );

    setCards(nextCards);

    if (removedCards.length > 0) {
      const removedCount = removedCards.length;
      const oldestRemoved = removedCards[0];
      message.warning(
        removedCount === 1
          ? `空间不足，已移除最早的${oldestRemoved.type === "temperature" ? "实时温度" : "实时湿度"}卡片`
          : `空间不足，已移除最早的 ${removedCount} 张卡片`
      );
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setCards((current) =>
      fitCardsToViewport(
        current.filter((item) => item.id !== cardId),
        maxRows,
        { preferPresetLayout: true }
      ).cards
    );
  };

  const handleLayoutChange = (layout: Layout) => {
    setCards((current) => {
      if (!hasCardLayoutChanged(current, layout)) {
        return current;
      }

      return syncCardsWithLayout(current, layout);
    });
  };

  const handleMaxRowsChange = useCallback(
    (nextMaxRows: number) => {
      if (maxRows === nextMaxRows) {
        return;
      }

      setMaxRows(nextMaxRows);
      setCards((current) => {
        const { cards: fittedCards } = fitCardsToViewport(current, nextMaxRows, {
          preferPresetLayout: true
        });
        return fittedCards;
      });
    },
    [maxRows]
  );

  const handleToggleBoardLight = useCallback(
    async (targetState: "ON" | "OFF") => {
      const result = await toggleBoardLight(targetState);

      if (result.ok) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    },
    [toggleBoardLight]
  );

  return (
    <div className="relative h-full min-h-0">
      <div className="h-full min-h-0">
        <SmartDataCenterCanvasPanel
          cards={cards}
          maxRows={maxRows}
          runtime={runtime}
          onRefresh={() => refreshRuntime().then(() => undefined)}
          onRemoveCard={handleRemoveCard}
          onLayoutChange={handleLayoutChange}
          onMaxRowsChange={handleMaxRowsChange}
          onToggleBoardLight={handleToggleBoardLight}
        />
      </div>

      <SmartDataCenterConsole
        open={consoleOpen}
        cards={cards}
        onToggleOpen={() => setConsoleOpen((current) => !current)}
        onAddCard={handleAddCard}
      />
    </div>
  );
}
