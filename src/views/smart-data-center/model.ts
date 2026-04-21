import type { LatestTelemetryItem } from "@/api/telemetry";
import type { Layout, LayoutItem } from "react-grid-layout";
import { aspectRatio, type LayoutConstraint } from "react-grid-layout/core";

export type SmartSocketState = "connecting" | "online" | "offline";
export type SmartDataCardType =
  | "temperature"
  | "humidity"
  | "light"
  | "telemetryChart"
  | "boardLightControl"
  | "startDiagnosis"
  | "openCommunity";
export type SmartBoardLightState = "ON" | "OFF" | null;

export const SMART_DATA_GRID_COLS = 12;
export const SMART_DATA_GRID_ROW_HEIGHT = 72;
export const SMART_DATA_GRID_MARGIN: readonly [number, number] = [16, 16];
export const SMART_DATA_CARD_DEFAULT_WIDTH = 6;
export const SMART_DATA_CARD_DEFAULT_HEIGHT = 5;
export const SMART_DATA_CARD_MIN_WIDTH = 2;
export const SMART_DATA_CARD_MIN_HEIGHT = 2;
export const SMART_DATA_CARD_MIN_PIXEL_WIDTH = 210;
export const SMART_DATA_CARD_MAX_WIDTH = 6;
export const SMART_DATA_CARD_MAX_HEIGHT = 5;

interface SmartDataCardPreset {
  width: number;
  height: number;
}

export interface SmartDataCardItem {
  id: string;
  type: SmartDataCardType;
  createdAt: number;
  layout: LayoutItem;
}

export interface SmartDataRuntime {
  farmId: number | null;
  farmName: string;
  loading: boolean;
  latestTelemetry: LatestTelemetryItem[];
  telemetryHistory: LatestTelemetryItem[];
  metrics: {
    temperature: LatestTelemetryItem | null;
    humidity: LatestTelemetryItem | null;
    light: LatestTelemetryItem | null;
  };
  boardLight: {
    available: boolean;
    pending: boolean;
    online: boolean;
    state: SmartBoardLightState;
    deviceId: string | null;
    deviceName: string;
    greenhouseId: number | null;
    greenhouseName: string | null;
    lastCommandStatus: string | null;
  };
  socketState: SmartSocketState;
  socketLatency: number;
}

export interface SmartDataCardDefinition {
  type: SmartDataCardType;
  label: string;
  description: string;
  defaultUnit?: string;
}

export type SmartDataAssistantResizePreset = "small" | "medium" | "large";
export type SmartDataAssistantMovePosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type SmartDataAssistantAction =
  | {
      type: "clear_all_cards";
    }
  | {
      type: "show_all_cards";
    }
  | {
      type: "show_cards";
      cardType: SmartDataCardType;
      count?: number;
      focus?: boolean;
    }
  | {
      type: "remove_cards";
      cardType: SmartDataCardType;
      scope?: "all" | "latest";
      count?: number;
    }
  | {
      type: "resize_all_cards";
      size: SmartDataAssistantResizePreset;
    }
  | {
      type: "move_cards";
      cardType: SmartDataCardType;
      position: SmartDataAssistantMovePosition;
      scope?: "all" | "latest";
      count?: number;
    }
  | {
      type: "resize_cards";
      cardType: SmartDataCardType;
      size: SmartDataAssistantResizePreset;
      scope?: "all" | "latest";
      count?: number;
      focus?: boolean;
    };

export const SMART_DATA_CARD_LIBRARY: SmartDataCardDefinition[] = [
  {
    type: "temperature",
    label: "实时温度",
    description: "显示当前农场最新上报的温度值与来源设备。",
    defaultUnit: "°C"
  },
  {
    type: "humidity",
    label: "实时湿度",
    description: "显示当前农场最新上报的湿度值与来源设备。",
    defaultUnit: "%"
  },
  {
    type: "light",
    label: "实时光照强度",
    description: "显示最新光照强度和当前采样来源。",
    defaultUnit: "Lux"
  },
  {
    type: "telemetryChart",
    label: "实时遥测曲线",
    description: "查看温度、湿度和光照的实时变化曲线。"
  },
  {
    type: "boardLightControl",
    label: "开发板灯控",
    description: "直接控制 BearPi 开发板的灯光开关。"
  },
  {
    type: "startDiagnosis",
    label: "发起新诊断",
    description: "一键进入作物智能诊断流程。"
  },
  {
    type: "openCommunity",
    label: "打开耕知论坛",
    description: "跳转到耕知论坛，查看社区经验和讨论。"
  }
];

export const SMART_DATA_ALL_CARD_TYPES: SmartDataCardType[] = SMART_DATA_CARD_LIBRARY.map(
  (item) => item.type
);

export const LIGHT_METRIC_CODES = ["light", "light_lux", "brightness"];
export const SMART_DATA_CHART_METRIC_CODES = ["temperature", "humidity", ...LIGHT_METRIC_CODES];
const MAX_TELEMETRY_HISTORY_POINTS = 120;
const SMART_DATA_CARD_CONSTRAINTS: LayoutConstraint[] = [aspectRatio(2)];

const SMART_DATA_CARD_PRESETS: SmartDataCardPreset[] = [
  {
    width: SMART_DATA_CARD_MAX_WIDTH,
    height: SMART_DATA_CARD_MAX_HEIGHT
  },
  {
    width: 4,
    height: 2
  },
  {
    width: SMART_DATA_CARD_MIN_WIDTH,
    height: SMART_DATA_CARD_MIN_HEIGHT
  }
] as const;

const createCardId = (type: SmartDataCardType) =>
  `smart-card-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cloneLayoutItem = (layoutItem: LayoutItem): LayoutItem => ({
  ...layoutItem,
  resizeHandles: layoutItem.resizeHandles ? [...layoutItem.resizeHandles] : undefined,
  constraints: layoutItem.constraints ? [...layoutItem.constraints] : undefined
});

const resolveSmartDataCardMaxHeight = (maxRows = SMART_DATA_CARD_MAX_HEIGHT) =>
  Math.min(SMART_DATA_CARD_MAX_HEIGHT, Math.max(maxRows, SMART_DATA_CARD_MIN_HEIGHT));

const withSmartDataCardLayoutDefaults = (
  layoutItem: LayoutItem,
  maxRows = SMART_DATA_CARD_MAX_HEIGHT
): LayoutItem => {
  const maxWidth = Math.min(SMART_DATA_CARD_MAX_WIDTH, SMART_DATA_GRID_COLS);
  const maxHeight = resolveSmartDataCardMaxHeight(maxRows);
  const width = Math.min(
    Math.max(Math.round(layoutItem.w), SMART_DATA_CARD_MIN_WIDTH),
    maxWidth
  );
  const height = Math.min(
    Math.max(Math.round(layoutItem.h), SMART_DATA_CARD_MIN_HEIGHT),
    maxHeight
  );

  return {
    ...layoutItem,
    x: Math.min(
      Math.max(0, Math.round(layoutItem.x)),
      Math.max(0, SMART_DATA_GRID_COLS - width)
    ),
    y: Math.max(0, Math.round(layoutItem.y)),
    w: width,
    h: height,
    minW: SMART_DATA_CARD_MIN_WIDTH,
    minH: SMART_DATA_CARD_MIN_HEIGHT,
    maxW: maxWidth,
    maxH: maxHeight,
    resizeHandles: layoutItem.resizeHandles ? [...layoutItem.resizeHandles] : ["se"],
    constraints: [...SMART_DATA_CARD_CONSTRAINTS]
  };
};

const resolveTelemetryTimestamp = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const buildTelemetryPointKey = (item: LatestTelemetryItem) =>
  `${item.deviceId}-${normalizeMetricCode(item.metricCode)}-${item.collectedAt}`;

export const getCardDefinition = (type: SmartDataCardType) =>
  SMART_DATA_CARD_LIBRARY.find((item) => item.type === type)!;

export const normalizeMetricCode = (metricCode: string) =>
  metricCode.trim().toLowerCase().replace(/-/g, "_");

export const formatMetricCodeLabel = (metricCode: string) => {
  const normalized = normalizeMetricCode(metricCode);

  if (normalized === "temperature") {
    return "温度";
  }

  if (normalized === "humidity") {
    return "湿度";
  }

  if (LIGHT_METRIC_CODES.includes(normalized)) {
    return "光照强度";
  }

  return metricCode;
};

export const isChartMetric = (metricCode: string) =>
  SMART_DATA_CHART_METRIC_CODES.includes(normalizeMetricCode(metricCode));

export const mergeTelemetryHistory = (
  current: LatestTelemetryItem[],
  incoming: LatestTelemetryItem[]
) => {
  const next = [...current];
  const existingKeys = new Set(current.map(buildTelemetryPointKey));

  incoming.forEach((item) => {
    if (!isChartMetric(item.metricCode)) {
      return;
    }

    const pointKey = buildTelemetryPointKey(item);

    if (!existingKeys.has(pointKey)) {
      next.push(item);
      existingKeys.add(pointKey);
    }
  });

  return next
    .sort((left, right) => resolveTelemetryTimestamp(left.collectedAt) - resolveTelemetryTimestamp(right.collectedAt))
    .slice(-MAX_TELEMETRY_HISTORY_POINTS);
};

export const pickLatestMetric = (
  latestTelemetry: LatestTelemetryItem[],
  metricCodes: string[]
) => {
  const aliases = metricCodes.map(normalizeMetricCode);

  return latestTelemetry.reduce<LatestTelemetryItem | null>((latest, item) => {
    if (!aliases.includes(normalizeMetricCode(item.metricCode))) {
      return latest;
    }

    if (!latest) {
      return item;
    }

    return resolveTelemetryTimestamp(item.collectedAt) >
      resolveTelemetryTimestamp(latest.collectedAt)
      ? item
      : latest;
  }, null);
};

export const createSmartDataCard = (
  type: SmartDataCardType,
  y = 0
): SmartDataCardItem => {
  const id = createCardId(type);
  const createdAt = Date.now();

  return {
    id,
    type,
    createdAt,
    layout: withSmartDataCardLayoutDefaults({
      i: id,
      x: 0,
      y,
      w: SMART_DATA_CARD_DEFAULT_WIDTH,
      h: SMART_DATA_CARD_DEFAULT_HEIGHT
    })
  };
};

export const buildInitialCards = (): SmartDataCardItem[] =>
  (["temperature", "humidity"] as const).map((type, index) => {
    const card = createSmartDataCard(type, 0);

    return {
      ...card,
      layout: withSmartDataCardLayoutDefaults({
        ...card.layout,
        i: card.id,
        x: index * SMART_DATA_CARD_DEFAULT_WIDTH,
        y: 0
      })
    };
  });

export const getNextCardY = (cards: SmartDataCardItem[]) =>
  cards.reduce((max, card) => Math.max(max, card.layout.y + card.layout.h), 0);

export const buildLayout = (cards: SmartDataCardItem[]): Layout =>
  cards.map((card) => cloneLayoutItem(card.layout));

const getPresetRowsNeeded = (cardCount: number, preset: SmartDataCardPreset) => {
  const cardsPerRow = Math.max(1, Math.floor(SMART_DATA_GRID_COLS / preset.width));
  return Math.ceil(cardCount / cardsPerRow) * preset.height;
};

const relayoutCards = (
  cards: SmartDataCardItem[],
  preset: SmartDataCardPreset,
  maxRows: number
): SmartDataCardItem[] => {
  const cardsPerRow = Math.max(1, Math.floor(SMART_DATA_GRID_COLS / preset.width));

  return cards.map((card, index) => {
    const column = index % cardsPerRow;
    const row = Math.floor(index / cardsPerRow);

    return {
      ...card,
      layout: withSmartDataCardLayoutDefaults({
        ...card.layout,
        i: card.id,
        x: column * preset.width,
        y: row * preset.height,
        w: preset.width,
        h: preset.height
      }, maxRows)
    };
  });
};

const getLayoutBottom = (cards: SmartDataCardItem[]) =>
  cards.reduce((max, card) => Math.max(max, card.layout.y + card.layout.h), 0);

const clampCardLayout = (card: SmartDataCardItem, maxRows: number): SmartDataCardItem => {
  const width = Math.min(
    Math.max(card.layout.w, SMART_DATA_CARD_MIN_WIDTH),
    Math.min(SMART_DATA_CARD_MAX_WIDTH, SMART_DATA_GRID_COLS)
  );
  const height = Math.min(
    Math.max(card.layout.h, SMART_DATA_CARD_MIN_HEIGHT),
    resolveSmartDataCardMaxHeight(maxRows)
  );

  return {
    ...card,
    layout: withSmartDataCardLayoutDefaults({
      ...card.layout,
      i: card.id,
      x: Math.min(Math.max(0, card.layout.x), SMART_DATA_GRID_COLS - width),
      y: Math.max(0, card.layout.y),
      w: width,
      h: height
    }, maxRows)
  };
};

const sortCardsForAssistant = (cards: SmartDataCardItem[]) =>
  [...cards].sort((left, right) => {
    if (left.layout.y !== right.layout.y) {
      return left.layout.y - right.layout.y;
    }

    if (left.layout.x !== right.layout.x) {
      return left.layout.x - right.layout.x;
    }

    return left.createdAt - right.createdAt;
  });

const moveMatchingCardsToFront = (
  cards: SmartDataCardItem[],
  cardType: SmartDataCardType
) => {
  const matching = cards.filter((card) => card.type === cardType);
  const others = cards.filter((card) => card.type !== cardType);
  return [...matching, ...others];
};

const reorderCardsByTargetIds = (
  cards: SmartDataCardItem[],
  targetIds: Set<string>,
  position: SmartDataAssistantMovePosition
) => {
  const orderedCards = sortCardsForAssistant(cards);
  const matching = orderedCards.filter((card) => targetIds.has(card.id));
  const others = orderedCards.filter((card) => !targetIds.has(card.id));

  if (position === "top" || position === "top-left" || position === "top-right" || position === "left") {
    return [...matching, ...others];
  }

  return [...others, ...matching];
};

const resolveResizePresetLayout = (
  size: SmartDataAssistantResizePreset | "minimum"
): SmartDataCardPreset => {
  if (size === "small" || size === "minimum") {
    return {
      width: SMART_DATA_CARD_MIN_WIDTH,
      height: SMART_DATA_CARD_MIN_HEIGHT
    };
  }

  if (size === "medium") {
    return {
      width: 4,
      height: 2
    };
  }

  return {
    width: SMART_DATA_CARD_MAX_WIDTH,
    height: SMART_DATA_CARD_MAX_HEIGHT
  };
};

const canOccupyGridArea = (
  occupied: boolean[][],
  x: number,
  y: number,
  width: number,
  height: number,
  maxRows: number
) => {
  if (x + width > SMART_DATA_GRID_COLS || y + height > maxRows) {
    return false;
  }

  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      if (occupied[row]?.[column]) {
        return false;
      }
    }
  }

  return true;
};

const markGridAreaOccupied = (
  occupied: boolean[][],
  x: number,
  y: number,
  width: number,
  height: number
) => {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      occupied[row][column] = true;
    }
  }
};

const getMovePositionCandidates = (
  position: SmartDataAssistantMovePosition,
  width: number,
  height: number,
  maxRows: number
) => {
  const maxX = Math.max(0, SMART_DATA_GRID_COLS - width);
  const maxY = Math.max(0, maxRows - height);
  const xsAsc = Array.from({ length: maxX + 1 }, (_, index) => index);
  const ysAsc = Array.from({ length: maxY + 1 }, (_, index) => index);
  const xsDesc = [...xsAsc].reverse();
  const ysDesc = [...ysAsc].reverse();
  const candidates: Array<{ x: number; y: number }> = [];
  const pushByRows = (rows: number[], columns: number[]) => {
    rows.forEach((row) => {
      columns.forEach((column) => {
        candidates.push({ x: column, y: row });
      });
    });
  };
  const pushByColumns = (columns: number[], rows: number[]) => {
    columns.forEach((column) => {
      rows.forEach((row) => {
        candidates.push({ x: column, y: row });
      });
    });
  };

  if (position === "top" || position === "top-left") {
    pushByRows(ysAsc, xsAsc);
    return candidates;
  }

  if (position === "top-right") {
    pushByRows(ysAsc, xsDesc);
    return candidates;
  }

  if (position === "bottom" || position === "bottom-left") {
    pushByRows(ysDesc, xsAsc);
    return candidates;
  }

  if (position === "bottom-right") {
    pushByRows(ysDesc, xsDesc);
    return candidates;
  }

  if (position === "left") {
    pushByColumns(xsAsc, ysAsc);
    return candidates;
  }

  pushByColumns(xsDesc, ysAsc);
  return candidates;
};

const placeCardInGrid = (
  occupied: boolean[][],
  card: SmartDataCardItem,
  maxRows: number,
  position: SmartDataAssistantMovePosition = "top-left"
): SmartDataCardItem | null => {
  const candidates = getMovePositionCandidates(
    position,
    card.layout.w,
    card.layout.h,
    maxRows
  );

  for (const candidate of candidates) {
    if (!canOccupyGridArea(occupied, candidate.x, candidate.y, card.layout.w, card.layout.h, maxRows)) {
      continue;
    }

    markGridAreaOccupied(occupied, candidate.x, candidate.y, card.layout.w, card.layout.h);

    return {
      ...card,
      layout: withSmartDataCardLayoutDefaults({
        ...card.layout,
        i: card.id,
        x: candidate.x,
        y: candidate.y,
        w: card.layout.w,
        h: card.layout.h
      }, maxRows)
    };
  }

  return null;
};

const packCardsWithAnchors = (
  cards: SmartDataCardItem[],
  anchors: Array<{ id: string; position: SmartDataAssistantMovePosition }>,
  maxRows: number
): SmartDataCardItem[] | null => {
  const normalizedCards = sortCardsForAssistant(cards).map((card) => clampCardLayout(card, maxRows));
  const cardsById = new Map(normalizedCards.map((card) => [card.id, card]));
  const occupied = Array.from({ length: maxRows }, () =>
    Array.from({ length: SMART_DATA_GRID_COLS }, () => false)
  );
  const packedCards: SmartDataCardItem[] = [];
  const placedIds = new Set<string>();

  for (const anchor of anchors) {
    const card = cardsById.get(anchor.id);

    if (!card || placedIds.has(anchor.id)) {
      continue;
    }

    const placedCard = placeCardInGrid(occupied, card, maxRows, anchor.position);

    if (!placedCard) {
      return null;
    }

    packedCards.push(placedCard);
    placedIds.add(anchor.id);
  }

  for (const card of normalizedCards) {
    if (placedIds.has(card.id)) {
      continue;
    }

    const placedCard = placeCardInGrid(occupied, card, maxRows);

    if (!placedCard) {
      return null;
    }

    packedCards.push(placedCard);
  }

  return packedCards;
};

const packCardsByCurrentSize = (
  cards: SmartDataCardItem[],
  maxRows: number
): SmartDataCardItem[] | null => {
  const normalizedCards = sortCardsForAssistant(cards).map((card) =>
    clampCardLayout(card, maxRows)
  );
  const occupied = Array.from({ length: maxRows }, () =>
    Array.from({ length: SMART_DATA_GRID_COLS }, () => false)
  );
  const packedCards: SmartDataCardItem[] = [];

  for (const card of normalizedCards) {
    const width = card.layout.w;
    const height = card.layout.h;
    let placed = false;

    for (let row = 0; row <= maxRows - height && !placed; row += 1) {
      for (let column = 0; column <= SMART_DATA_GRID_COLS - width; column += 1) {
        if (!canOccupyGridArea(occupied, column, row, width, height, maxRows)) {
          continue;
        }

        markGridAreaOccupied(occupied, column, row, width, height);
        packedCards.push({
          ...card,
          layout: withSmartDataCardLayoutDefaults({
            ...card.layout,
            i: card.id,
            x: column,
            y: row,
            w: width,
            h: height
          }, maxRows)
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      return null;
    }
  }

  return packedCards;
};

const findOldestCardIndex = (cards: SmartDataCardItem[]) =>
  cards.reduce((oldestIndex, card, index, collection) => {
    if (collection[oldestIndex].createdAt <= card.createdAt) {
      return oldestIndex;
    }

    return index;
  }, 0);

export const resolveSmartDataMaxRows = (viewportHeight: number) => {
  const safeHeight = Math.max(viewportHeight, 0);
  const [, marginY] = SMART_DATA_GRID_MARGIN;
  const rows = Math.floor((safeHeight + marginY) / (SMART_DATA_GRID_ROW_HEIGHT + marginY));

  return Math.max(rows, SMART_DATA_CARD_MIN_HEIGHT);
};

export const resolveSmartDataCanvasMinWidth = (cards: SmartDataCardItem[]) => {
  if (!cards.length) {
    return 0;
  }

  const [marginX] = SMART_DATA_GRID_MARGIN;
  const minCardWidthUnits = cards.reduce(
    (currentMin, card) => Math.min(currentMin, Math.max(card.layout.w, SMART_DATA_CARD_MIN_WIDTH)),
    SMART_DATA_GRID_COLS
  );
  const requiredColWidth = Math.max(
    0,
    (SMART_DATA_CARD_MIN_PIXEL_WIDTH - Math.max(0, minCardWidthUnits - 1) * marginX) /
      minCardWidthUnits
  );

  return Math.ceil(
    requiredColWidth * SMART_DATA_GRID_COLS + marginX * (SMART_DATA_GRID_COLS - 1)
  );
};

export const fitCardsToViewport = (
  cards: SmartDataCardItem[],
  maxRows: number,
  options: {
    preferPresetLayout?: boolean;
  } = {}
): {
  cards: SmartDataCardItem[];
  removedCards: SmartDataCardItem[];
} => {
  const normalizedCards = cards.map((card) => clampCardLayout(card, maxRows));

  if (options.preferPresetLayout) {
    let workingCards = [...normalizedCards];
    const removedCards: SmartDataCardItem[] = [];

    while (workingCards.length > 0) {
      const preset = SMART_DATA_CARD_PRESETS.find(
        (candidate) => getPresetRowsNeeded(workingCards.length, candidate) <= maxRows
      );

      if (preset) {
        return {
          cards: relayoutCards(workingCards, preset, maxRows),
          removedCards
        };
      }

      const oldestCardIndex = findOldestCardIndex(workingCards);
      removedCards.push(workingCards[oldestCardIndex]);
      workingCards = workingCards.filter((_, index) => index !== oldestCardIndex);
    }

    return {
      cards: [],
      removedCards
    };
  }

  if (getLayoutBottom(normalizedCards) <= maxRows) {
    return {
      cards: normalizedCards,
      removedCards: []
    };
  }

  let workingCards = [...normalizedCards];
  const removedCards: SmartDataCardItem[] = [];

  while (workingCards.length > 0) {
    const preset = SMART_DATA_CARD_PRESETS.find(
      (candidate) => getPresetRowsNeeded(workingCards.length, candidate) <= maxRows
    );

    if (preset) {
      return {
        cards: relayoutCards(workingCards, preset, maxRows),
        removedCards
      };
    }

    const oldestCardIndex = findOldestCardIndex(workingCards);
    removedCards.push(workingCards[oldestCardIndex]);
    workingCards = workingCards.filter((_, index) => index !== oldestCardIndex);
  }

  return {
    cards: [],
    removedCards
  };
};

export const hasCardLayoutChanged = (cards: SmartDataCardItem[], layout: Layout) => {
  if (cards.length !== layout.length) {
    return true;
  }

  const nextById = new Map(layout.map((item) => [item.i, item]));

  return cards.some((card) => {
    const next = nextById.get(card.id);

    if (!next) {
      return true;
    }

    return (
      card.layout.x !== next.x ||
      card.layout.y !== next.y ||
      card.layout.w !== next.w ||
      card.layout.h !== next.h
    );
  });
};

export const syncCardsWithLayout = (
  cards: SmartDataCardItem[],
  layout: Layout,
  maxRows: number
) => {
  const nextById = new Map(layout.map((item) => [item.i, item]));

  return cards.map((card) => {
    const next = nextById.get(card.id);

    if (!next) {
      return card;
    }

    return {
      ...card,
      layout: withSmartDataCardLayoutDefaults({
        ...card.layout,
        i: card.id,
        x: next.x,
        y: next.y,
        w: next.w,
        h: next.h
      }, maxRows)
    };
  });
};

export const applySmartDataAssistantActions = (
  cards: SmartDataCardItem[],
  actions: SmartDataAssistantAction[],
  maxRows: number
) => {
  let workingCards = [...cards];

  actions.forEach((action) => {
    if (action.type === "clear_all_cards") {
      workingCards = [];
      return;
    }

    if (action.type === "show_all_cards") {
      const existingTypes = new Set(workingCards.map((card) => card.type));
      const missingTypes = SMART_DATA_ALL_CARD_TYPES.filter((cardType) => !existingTypes.has(cardType));
      const nextY = getNextCardY(workingCards);

      missingTypes.forEach((cardType, index) => {
        workingCards.push(createSmartDataCard(cardType, nextY + index));
      });

      const packedCards = packCardsByCurrentSize(workingCards, maxRows);
      workingCards = packedCards ?? fitCardsToViewport(workingCards, maxRows).cards;
      return;
    }

    if (action.type === "show_cards") {
      const existingCards = workingCards.filter((card) => card.type === action.cardType);
      const targetCount = Math.max(1, action.count ?? 1);
      const missingCount = Math.max(0, targetCount - existingCards.length);
      const nextY = getNextCardY(workingCards);

      for (let index = 0; index < missingCount; index += 1) {
        workingCards.push(createSmartDataCard(action.cardType, nextY + index));
      }

      if (action.focus) {
        workingCards = moveMatchingCardsToFront(workingCards, action.cardType);
      }

      const packedCards = packCardsByCurrentSize(workingCards, maxRows);
      workingCards = packedCards ?? fitCardsToViewport(workingCards, maxRows).cards;
      return;
    }

    if (action.type === "remove_cards") {
      const matchingCards = workingCards
        .filter((card) => card.type === action.cardType)
        .sort((left, right) => left.createdAt - right.createdAt);

      if (!matchingCards.length) {
        return;
      }

      let targetIds = new Set<string>();

      if (action.scope === "latest") {
        const removeCount = Math.max(1, action.count ?? 1);
        targetIds = new Set(
          matchingCards.slice(-removeCount).map((card) => card.id)
        );
      } else {
        targetIds = new Set(matchingCards.map((card) => card.id));
      }

      workingCards = fitCardsToViewport(
        workingCards.filter((card) => !targetIds.has(card.id)),
        maxRows,
        { preferPresetLayout: true }
      ).cards;
      return;
    }

    if (action.type === "resize_all_cards") {
      const nextLayout = resolveResizePresetLayout(action.size);

      workingCards = workingCards.map((card) => ({
        ...card,
        layout: withSmartDataCardLayoutDefaults({
          ...card.layout,
          i: card.id,
          w: nextLayout.width,
          h: nextLayout.height
        }, maxRows)
      }));

      const packedCards = packCardsByCurrentSize(workingCards, maxRows);
      workingCards = packedCards ?? fitCardsToViewport(workingCards, maxRows).cards;
      return;
    }

    if (action.type === "move_cards") {
      const targetCards = workingCards
        .filter((card) => card.type === action.cardType)
        .sort((left, right) => right.createdAt - left.createdAt);

      if (!targetCards.length) {
        return;
      }

      const moveTargetIds = new Set(
        (action.scope === "all"
          ? targetCards
          : targetCards.slice(0, Math.max(1, action.count ?? 1))
        ).map((card) => card.id)
      );
      const anchoredCards = Array.from(moveTargetIds).map((cardId) => ({
        id: cardId,
        position: action.position
      }));
      const packedCards = packCardsWithAnchors(workingCards, anchoredCards, maxRows);

      if (packedCards) {
        workingCards = packedCards;
        return;
      }

      const reorderedCards = reorderCardsByTargetIds(workingCards, moveTargetIds, action.position);
      const fallbackPackedCards = packCardsByCurrentSize(reorderedCards, maxRows);
      workingCards = fallbackPackedCards ?? fitCardsToViewport(reorderedCards, maxRows).cards;
      return;
    }

    const targetCards = workingCards
      .filter((card) => card.type === action.cardType)
      .sort((left, right) => right.createdAt - left.createdAt);

    if (!targetCards.length) {
      return;
    }

    const resizeTargetIds = new Set(
      (action.scope === "all"
        ? targetCards
        : targetCards.slice(0, Math.max(1, action.count ?? 1))
      ).map((card) => card.id)
    );
    const nextLayout = resolveResizePresetLayout(action.size);

    workingCards = workingCards.map((card) => {
      if (!resizeTargetIds.has(card.id)) {
        return card;
      }

      return {
        ...card,
        layout: withSmartDataCardLayoutDefaults({
          ...card.layout,
          i: card.id,
          w: nextLayout.width,
          h: nextLayout.height
        }, maxRows)
      };
    });

    if (action.focus) {
      workingCards = moveMatchingCardsToFront(workingCards, action.cardType);
    }

    const packedCards = packCardsByCurrentSize(workingCards, maxRows);
    workingCards = packedCards ?? fitCardsToViewport(workingCards, maxRows).cards;
  });

  return workingCards;
};

export const resolveBoardLightStateLabel = (state: SmartBoardLightState) => {
  if (state === "ON") {
    return "已开启";
  }

  if (state === "OFF") {
    return "已关闭";
  }

  return "未同步";
};

export const resolveSocketTagColor = (state: SmartSocketState) => {
  if (state === "online") {
    return "green";
  }

  if (state === "connecting") {
    return "gold";
  }

  return "red";
};
