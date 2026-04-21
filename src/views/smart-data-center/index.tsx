import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import type { Layout } from "react-grid-layout";
import { storage } from "@/utils/storage";
import { requestSmartDataAssistant } from "./assistant-api";
import { SmartDataCenterAssistantDock } from "./SmartDataCenterAssistantDock";
import { SmartDataCenterCanvasPanel } from "./SmartDataCenterCanvasPanel";
import { SmartDataCenterConsole } from "./SmartDataCenterConsole";
import { useSmartDataCenterRuntime } from "./useSmartDataCenterRuntime";
import {
  applySmartDataAssistantActions,
  createSmartDataCard,
  fitCardsToViewport,
  getCardDefinition,
  getNextCardY,
  hasCardLayoutChanged,
  resolveSmartDataMaxRows,
  syncCardsWithLayout,
  type SmartDataCardItem,
  type SmartDataCardType
} from "./model";

const SMART_DATA_CENTER_LAYOUT_STORAGE_KEY = "smart-data-center-layout-v1";

const isPersistedSmartDataCard = (value: unknown): value is SmartDataCardItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SmartDataCardItem> & {
    layout?: Partial<SmartDataCardItem["layout"]>;
  };

  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.layout?.i === "string" &&
    typeof candidate.layout?.x === "number" &&
    typeof candidate.layout?.y === "number" &&
    typeof candidate.layout?.w === "number" &&
    typeof candidate.layout?.h === "number"
  );
};

const loadPersistedSmartDataCards = () => {
  const persistedCards = storage.get<unknown[]>(SMART_DATA_CENTER_LAYOUT_STORAGE_KEY, []);

  if (!Array.isArray(persistedCards)) {
    storage.remove(SMART_DATA_CENTER_LAYOUT_STORAGE_KEY);
    return [];
  }

  const validCards = persistedCards.filter(isPersistedSmartDataCard);

  if (validCards.length !== persistedCards.length) {
    storage.remove(SMART_DATA_CENTER_LAYOUT_STORAGE_KEY);
    return [];
  }

  return validCards;
};

export default function SmartDataCenterPage() {
  const [cards, setCards] = useState<SmartDataCardItem[]>(() => loadPersistedSmartDataCards());
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [assistantPending, setAssistantPending] = useState(false);
  const [assistantReply, setAssistantReply] = useState("");
  const [maxRows, setMaxRows] = useState(() => resolveSmartDataMaxRows(360));
  const assistantActionTimerRef = useRef<number | null>(null);
  const handleRuntimeLoadFailed = useCallback(() => {
    message.error("智慧数据中心实时数据装载失败");
  }, []);
  const { runtime, refreshRuntime, toggleBoardLight } = useSmartDataCenterRuntime(
    handleRuntimeLoadFailed
  );

  useEffect(() => {
    return () => {
      if (assistantActionTimerRef.current !== null) {
        window.clearTimeout(assistantActionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    storage.set(SMART_DATA_CENTER_LAYOUT_STORAGE_KEY, cards);
  }, [cards]);

  const handleAddCard = (type: SmartDataCardType) => {
    const { cards: nextCards, removedCards } = fitCardsToViewport(
      [...cards, createSmartDataCard(type, getNextCardY(cards))],
      maxRows
    );

    setCards(nextCards);

    if (removedCards.length > 0) {
      const removedCount = removedCards.length;
      const oldestRemoved = removedCards[0];
      const removedLabel = getCardDefinition(oldestRemoved.type).label;
      message.warning(
        removedCount === 1
          ? `空间不足，已移除最早的${removedLabel}卡片`
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

      return syncCardsWithLayout(current, layout, maxRows);
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

  const handleAssistantSubmit = useCallback(
    async (instruction: string) => {
      setAssistantPending(true);

      try {
        const response = await requestSmartDataAssistant({
          instruction,
          farmId: runtime.farmId,
          farmName: runtime.farmName,
          maxRows,
          cards
        });

        setAssistantReply(response.reply);
        message.success(response.reply);

        if (assistantActionTimerRef.current !== null) {
          window.clearTimeout(assistantActionTimerRef.current);
        }

        if (response.actions.length > 0) {
          assistantActionTimerRef.current = window.setTimeout(() => {
            setCards((current) =>
              applySmartDataAssistantActions(current, response.actions, maxRows)
            );
            assistantActionTimerRef.current = null;
          }, 1000);
        }

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "卡片指令执行失败";
        message.error(errorMessage);
        setAssistantReply(errorMessage);
        return false;
      } finally {
        setAssistantPending(false);
      }
    },
    [cards, maxRows, runtime.farmId, runtime.farmName]
  );

  return (
    <div className="smart-data-center-page expressive-page relative flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
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

      <SmartDataCenterAssistantDock
        pending={assistantPending}
        lastReply={assistantReply}
        onSubmit={handleAssistantSubmit}
      />
    </div>
  );
}
