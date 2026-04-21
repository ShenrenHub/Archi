import type {
  SmartDataAssistantAction,
  SmartDataAssistantMovePosition,
  SmartDataAssistantResizePreset,
  SmartDataCardItem,
  SmartDataCardType
} from "./model";
import { getCardDefinition, SMART_DATA_ALL_CARD_TYPES } from "./model";

export interface SmartDataAssistantRequestPayload {
  instruction: string;
  farmId: number | null;
  farmName: string;
  maxRows: number;
  cards: SmartDataCardItem[];
}

export interface SmartDataAssistantResponse {
  reply: string;
  actions: SmartDataAssistantAction[];
  fallback: boolean;
  model: string | null;
  toolTrace: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: Record<string, unknown>;
  }>;
}

interface SmartDataMcpSuccessResponse<T> {
  jsonrpc: "2.0";
  id: string;
  result: T;
}

interface SmartDataMcpErrorResponse {
  jsonrpc: "2.0";
  id: string | null;
  error: {
    code: number;
    message: string;
  };
}

interface SmartDataMcpToolCallResult {
  content?: Array<{
    type: string;
    text?: string;
  }>;
  structuredContent?: SmartDataAssistantResponse;
  isError?: boolean;
}

const SMART_DATA_MCP_ENDPOINT = "/api/smart-data-mcp/mcp";
let smartDataMcpInitializePromise: Promise<void> | null = null;
const SMART_DATA_LOCAL_CLEAR_ALL_PATTERNS = [
  /(关闭|关掉|移除|删除|清空|清除|收起|隐藏)(一下)?(当前|现有|页面上|页面里|画布上|容器内|这里的|这些)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)/,
  /(把)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)(都)?(关闭|关掉|移除|删除|清空|清除|收起|隐藏)/,
  /(清空|清除|重置)(一下)?(卡片画布|画布|卡片容器|容器)/
] as const;
const SMART_DATA_LOCAL_SHOW_ALL_PATTERNS = [
  /(打开|展示|显示|展开)(一下)?(当前|现有|页面上|页面里|画布上|容器内|这里的|这些)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)/,
  /(把)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)(都)?(打开|展示|显示|展开)/
] as const;
const SMART_DATA_LOCAL_RESIZE_ALL_PATTERNS: Array<{
  pattern: RegExp;
  size: SmartDataAssistantResizePreset;
  reply: string;
}> = [
  {
    pattern: /(缩小|缩到最小|最小化|最小|缩一圈|缩一点)(一下)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)|(把)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)(都)?(缩小|缩到最小|最小化|最小|缩一圈|缩一点)/,
    size: "small",
    reply: "已为您将全部卡片缩小为小卡片。"
  },
  {
    pattern: /(恢复中等|中等大小|中号|中尺寸|恢复标准大小|标准大小)(一下)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)|(把)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)(都)?(恢复中等|恢复标准大小|中等大小|中号|中尺寸|标准大小)/,
    size: "medium",
    reply: "已为您将全部卡片调整为中卡片。"
  },
  {
    pattern: /(放大|变大|拉大|最大|大尺寸|大卡片)(一下)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)|(把)?(全部|所有)(的)?(卡片|数据卡片|面板|数据面板)(都)?(放大|变大|拉大|最大|大尺寸|大卡片)/,
    size: "large",
    reply: "已为您将全部卡片调整为大卡片。"
  }
] as const;
const SMART_DATA_COMPOUND_SPLIT_PATTERN = /(?:；|;|。|\n|并且把|并且将|并且|并把|并将|同时|然后|接着|随后|再把|再将|再)/;
const SMART_DATA_ACTION_KEYWORDS = [
  "看",
  "查看",
  "只看",
  "仅看",
  "显示",
  "展示",
  "打开",
  "展开",
  "关闭",
  "关掉",
  "删除",
  "移除",
  "清空",
  "清除",
  "重置",
  "放大",
  "变大",
  "拉大",
  "缩小",
  "最小化",
  "最小",
  "中等",
  "中号",
  "大号",
  "恢复",
  "新增",
  "添加",
  "调整",
  "排列",
  "保留",
  "移动",
  "挪",
  "置顶",
  "置底",
  "前面",
  "后面",
  "顶部",
  "底部",
  "左边",
  "右边"
] as const;
const SMART_DATA_GLOBAL_TARGET_KEYWORDS = [
  "卡片",
  "面板",
  "画布",
  "容器",
  "全部",
  "所有"
] as const;
const SMART_DATA_CARD_TYPE_ALIASES: Record<SmartDataCardType, readonly string[]> = {
  temperature: ["温度", "实时温度", "温湿度", "温湿"],
  humidity: ["湿度", "实时湿度", "温湿度", "温湿"],
  light: ["光照", "光照强度", "亮度", "实时光照强度"],
  telemetryChart: ["遥测曲线", "曲线", "趋势图", "图表", "遥测图", "趋势"],
  boardLightControl: ["灯控", "开发板灯控", "灯光控制", "开发板灯光"],
  startDiagnosis: ["诊断", "新诊断", "发起新诊断"],
  openCommunity: ["论坛", "社区", "耕知论坛"]
};
const SMART_DATA_SHOW_KEYWORDS = ["看", "查看", "显示", "展示", "打开", "展开"] as const;
const SMART_DATA_REMOVE_KEYWORDS = [
  "关闭",
  "关掉",
  "删除",
  "移除",
  "清除",
  "隐藏",
  "收起"
] as const;
const SMART_DATA_ONLY_KEYWORDS = ["只看", "仅看", "只显示", "仅显示", "只保留", "仅保留"] as const;
const SMART_DATA_REFERENCE_KEYWORDS = [
  "它们",
  "这些",
  "这些卡片",
  "这些面板",
  "上述卡片",
  "前面的卡片",
  "刚才的卡片"
] as const;
const SMART_DATA_RESIZE_KEYWORDS: Record<SmartDataAssistantResizePreset, readonly string[]> = {
  small: ["缩小", "缩到最小", "最小化", "最小", "缩一圈", "缩一点", "小卡片", "小尺寸"],
  medium: ["恢复中等", "中等大小", "中号", "中尺寸", "恢复标准大小", "标准大小"],
  large: ["放大", "变大", "拉大", "最大", "大卡片", "大尺寸", "大号"]
};
const SMART_DATA_MOVE_KEYWORDS = ["移动", "挪", "放", "摆", "拖", "置"] as const;
const SMART_DATA_MOVE_POSITION_KEYWORDS: Record<SmartDataAssistantMovePosition, readonly string[]> = {
  top: [
    "置顶",
    "顶部",
    "上面",
    "最前面",
    "前面",
    "前排",
    "左边",
    "左侧",
    "移到顶部",
    "移到前面",
    "放到前面",
    "放左边"
  ],
  left: ["左边", "左侧", "靠左", "移到左边", "放左边"],
  right: ["右边", "右侧", "靠右", "移到右边", "放右边"],
  "top-left": ["左上角", "左上", "左前方"],
  "top-right": ["右上角", "右上", "右前方"],
  bottom: [
    "置底",
    "底部",
    "下面",
    "最后面",
    "后面",
    "后排",
    "右边",
    "右侧",
    "移到底部",
    "移到后面",
    "放到后面",
    "放右边"
  ],
  "bottom-left": ["左下角", "左下", "左后方"],
  "bottom-right": ["右下角", "右下", "右后方"]
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractMcpErrorMessage = (payload: unknown) => {
  if (!isRecord(payload)) {
    return "";
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return "";
};

const isLikelySmartDataClauseStart = (segment: string) => {
  const normalizedSegment = segment.replace(/\s+/g, "").trim();

  if (!normalizedSegment) {
    return false;
  }

  return (
    hasSmartDataKeyword(normalizedSegment, SMART_DATA_ACTION_KEYWORDS) ||
    hasSmartDataKeyword(normalizedSegment, SMART_DATA_REFERENCE_KEYWORDS) ||
    SMART_DATA_LOCAL_CLEAR_ALL_PATTERNS.some((pattern) => pattern.test(normalizedSegment)) ||
    SMART_DATA_LOCAL_SHOW_ALL_PATTERNS.some((pattern) => pattern.test(normalizedSegment)) ||
    SMART_DATA_LOCAL_RESIZE_ALL_PATTERNS.some(({ pattern }) => pattern.test(normalizedSegment))
  );
};

const splitSmartDataInstructionClauses = (instruction: string) =>
  instruction
    .split(SMART_DATA_COMPOUND_SPLIT_PATTERN)
    .flatMap((segment) => {
      const commaSegments = segment
        .split(/[，,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (commaSegments.length <= 1) {
        return commaSegments;
      }

      const clauses: string[] = [];
      let buffer = commaSegments[0];

      for (let index = 1; index < commaSegments.length; index += 1) {
        const nextSegment = commaSegments[index];

        if (isLikelySmartDataClauseStart(nextSegment)) {
          clauses.push(buffer.trim());
          buffer = nextSegment;
        } else {
          buffer = `${buffer}，${nextSegment}`;
        }
      }

      clauses.push(buffer.trim());
      return clauses;
    })
    .map((clause) => clause.trim())
    .filter(Boolean);

const resolveLocalSmartDataActionForClause = (
  clause: string
): SmartDataAssistantAction | null => {
  if (SMART_DATA_LOCAL_CLEAR_ALL_PATTERNS.some((pattern) => pattern.test(clause))) {
    return { type: "clear_all_cards" };
  }

  if (SMART_DATA_LOCAL_SHOW_ALL_PATTERNS.some((pattern) => pattern.test(clause))) {
    return { type: "show_all_cards" };
  }

  const resizeAllMatch = SMART_DATA_LOCAL_RESIZE_ALL_PATTERNS.find(({ pattern }) =>
    pattern.test(clause)
  );

  if (resizeAllMatch) {
    return { type: "resize_all_cards", size: resizeAllMatch.size };
  }

  return null;
};

const describeSmartDataClause = (clause: string) => {
  const normalizedClause = clause.replace(/\s+/g, "");
  const detectedTypes = Object.entries(SMART_DATA_CARD_TYPE_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => normalizedClause.includes(alias)))
    .map(([cardType]) => `${getCardDefinition(cardType as SmartDataCardType).label}(${cardType})`);
  const keywords: string[] = [];

  if (SMART_DATA_LOCAL_SHOW_ALL_PATTERNS.some((pattern) => pattern.test(normalizedClause))) {
    keywords.push("全局显示");
  }

  if (SMART_DATA_LOCAL_CLEAR_ALL_PATTERNS.some((pattern) => pattern.test(normalizedClause))) {
    keywords.push("全局关闭");
  }

  const resizeAllMatch = SMART_DATA_LOCAL_RESIZE_ALL_PATTERNS.find(({ pattern }) =>
    pattern.test(normalizedClause)
  );

  if (resizeAllMatch) {
    keywords.push(`全局尺寸=${resizeAllMatch.size}`);
  }

  const movePosition = resolveSmartDataMovePosition(normalizedClause);

  if (movePosition) {
    keywords.push(`移动=${movePosition}`);
  }

  if (detectedTypes.length === 0 && keywords.length === 0) {
    return `- 子句：${clause}`;
  }

  return `- 子句：${clause}；可能涉及：${[...detectedTypes, ...keywords].join("、")}`;
};

const isMeaningfulSmartDataInstruction = (instruction: string) => {
  const normalizedInstruction = instruction.replace(/\s+/g, "").trim();

  if (!normalizedInstruction || normalizedInstruction.length < 2) {
    return false;
  }

  const hasActionKeyword = SMART_DATA_ACTION_KEYWORDS.some((keyword) =>
    normalizedInstruction.includes(keyword)
  );
  const hasGlobalTargetKeyword = SMART_DATA_GLOBAL_TARGET_KEYWORDS.some((keyword) =>
    normalizedInstruction.includes(keyword)
  );
  const hasCardTypeAlias = Object.values(SMART_DATA_CARD_TYPE_ALIASES).some((aliases) =>
    aliases.some((alias) => normalizedInstruction.includes(alias))
  );

  return hasCardTypeAlias || (hasActionKeyword && hasGlobalTargetKeyword);
};

const hasSmartDataKeyword = (text: string, keywords: readonly string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const extractSmartDataCardTypes = (clause: string): SmartDataCardType[] =>
  SMART_DATA_ALL_CARD_TYPES.filter((cardType) =>
    SMART_DATA_CARD_TYPE_ALIASES[cardType].some((alias) => clause.includes(alias))
  );

const resolveSmartDataResizePreset = (
  clause: string
): SmartDataAssistantResizePreset | null => {
  for (const [size, keywords] of Object.entries(SMART_DATA_RESIZE_KEYWORDS) as Array<
    [SmartDataAssistantResizePreset, readonly string[]]
  >) {
    if (hasSmartDataKeyword(clause, keywords)) {
      return size;
    }
  }

  return null;
};

const resolveSmartDataMovePosition = (
  clause: string
): SmartDataAssistantMovePosition | null => {
  const hasMoveKeyword = hasSmartDataKeyword(clause, SMART_DATA_MOVE_KEYWORDS);

  for (const [position, keywords] of Object.entries(SMART_DATA_MOVE_POSITION_KEYWORDS) as Array<
    [SmartDataAssistantMovePosition, readonly string[]]
  >) {
    if (hasSmartDataKeyword(clause, keywords) && (hasMoveKeyword || keywords.some((keyword) => clause.includes(keyword)))) {
      return position;
    }
  }

  return null;
};

const referencesPreviousSmartDataTargets = (clause: string) =>
  hasSmartDataKeyword(clause, SMART_DATA_REFERENCE_KEYWORDS);

const shouldInheritPreviousSmartDataTargets = (clause: string) =>
  Boolean(resolveSmartDataMovePosition(clause)) || Boolean(resolveSmartDataResizePreset(clause));

const buildLocalSmartDataActions = (
  instruction: string
): SmartDataAssistantAction[] | null => {
  const clauses = splitSmartDataInstructionClauses(instruction);

  if (!clauses.length) {
    return null;
  }

  let lastReferencedTypes: SmartDataCardType[] = [];
  const actions: SmartDataAssistantAction[] = [];

  for (const clause of clauses) {
    const globalAction = resolveLocalSmartDataActionForClause(clause);

    if (globalAction) {
      actions.push(globalAction);
      lastReferencedTypes =
        globalAction.type === "show_all_cards" || globalAction.type === "resize_all_cards"
          ? [...SMART_DATA_ALL_CARD_TYPES]
          : [];
      continue;
    }

    const explicitTypes = extractSmartDataCardTypes(clause);
    const targetTypes = explicitTypes.length
      ? explicitTypes
      : referencesPreviousSmartDataTargets(clause) || shouldInheritPreviousSmartDataTargets(clause)
        ? lastReferencedTypes
        : [];
    const shouldOnlyShow = hasSmartDataKeyword(clause, SMART_DATA_ONLY_KEYWORDS);
    const shouldShow = hasSmartDataKeyword(clause, SMART_DATA_SHOW_KEYWORDS);
    const shouldRemove = hasSmartDataKeyword(clause, SMART_DATA_REMOVE_KEYWORDS);
    const resizePreset = resolveSmartDataResizePreset(clause);
    const movePosition = resolveSmartDataMovePosition(clause);
    const clauseActions: SmartDataAssistantAction[] = [];

    if (!targetTypes.length) {
      return null;
    }

    if (shouldOnlyShow) {
      clauseActions.push({ type: "clear_all_cards" });
    }

    if (shouldShow || shouldOnlyShow) {
      targetTypes.forEach((cardType) => {
        clauseActions.push({
          type: "show_cards",
          cardType,
          count: 1,
          focus: targetTypes.length > 1
        });
      });
    }

    if (shouldRemove) {
      targetTypes.forEach((cardType) => {
        clauseActions.push({
          type: "remove_cards",
          cardType,
          scope: "all"
        });
      });
    }

    if (resizePreset) {
      targetTypes.forEach((cardType) => {
        clauseActions.push({
          type: "resize_cards",
          cardType,
          size: resizePreset,
          scope: "all",
          focus: targetTypes.length > 1
        });
      });
    }

    if (movePosition) {
      targetTypes.forEach((cardType) => {
        clauseActions.push({
          type: "move_cards",
          cardType,
          position: movePosition,
          scope: "all"
        });
      });
    }

    if (!clauseActions.length) {
      return null;
    }

    actions.push(...clauseActions);
    lastReferencedTypes = [...targetTypes];
  }

  return actions;
};

const buildLocalSmartDataReply = (
  actions: SmartDataAssistantAction[],
  payload: SmartDataAssistantRequestPayload
) => {
  const hasClearAll = actions.some((action) => action.type === "clear_all_cards");
  const hasShowAll = actions.some((action) => action.type === "show_all_cards");
  const resizeAllAction = actions.find((action) => action.type === "resize_all_cards");

  if (hasClearAll && actions.length === 1) {
    return payload.cards.length > 0 ? "已为您关闭全部卡片。" : "当前没有可关闭的卡片。";
  }

  if (hasShowAll && actions.length === 1) {
    return "已为您打开全部卡片。";
  }

  if (resizeAllAction && actions.length === 1) {
    return (
      SMART_DATA_LOCAL_RESIZE_ALL_PATTERNS.find(({ size }) =>
        size === (resizeAllAction as Extract<SmartDataAssistantAction, { type: "resize_all_cards" }>).size
      )?.reply || "已为您调整全部卡片大小。"
    );
  }

  const shownTypes = actions
    .filter((action): action is Extract<SmartDataAssistantAction, { type: "show_cards" }> =>
      action.type === "show_cards"
    )
    .map((action) => getCardDefinition(action.cardType).label);
  const resizedTypes = actions
    .filter((action): action is Extract<SmartDataAssistantAction, { type: "resize_cards" }> =>
      action.type === "resize_cards"
    )
    .map((action) => getCardDefinition(action.cardType).label);
  const movedTypes = actions
    .filter((action): action is Extract<SmartDataAssistantAction, { type: "move_cards" }> =>
      action.type === "move_cards"
    )
    .map((action) => getCardDefinition(action.cardType).label);

  if (shownTypes.length > 0 && resizedTypes.length > 0) {
    return "已按您的复合指令显示并调整指定卡片。";
  }

  if (shownTypes.length > 0 && movedTypes.length > 0) {
    return "已为您显示并移动指定卡片。";
  }

  if (movedTypes.length > 0 && resizedTypes.length > 0) {
    return "已为您移动并调整指定卡片。";
  }

  if (shownTypes.length > 0) {
    return "已为您显示指定卡片。";
  }

  if (resizedTypes.length > 0) {
    return "已为您调整指定卡片大小。";
  }

  if (movedTypes.length > 0) {
    return "已为您移动指定卡片位置。";
  }

  return "已按您的复合指令调整卡片。";
};

const buildSmartDataInstructionPrompt = (payload: SmartDataAssistantRequestPayload) => {
  const currentCardsSummary = payload.cards.length
    ? payload.cards
        .map((card) => `${getCardDefinition(card.type).label}(${card.type})`)
        .join("、")
    : "当前没有卡片";
  const availableCardsSummary = SMART_DATA_ALL_CARD_TYPES.map((cardType) => {
    const definition = getCardDefinition(cardType);
    return `${definition.label}(${cardType})`;
  }).join("、");
  const clauseHints = splitSmartDataInstructionClauses(payload.instruction)
    .map((clause) => describeSmartDataClause(clause))
    .join("\n");

  return [
    "你是智慧数据中心的卡片编排助手。请将用户自然语言理解为卡片操作，并输出正确的动作。",
    "全局操作规则：",
    "1. 用户提到“全部卡片”“所有卡片”“整个画布”“整个容器”时，表示当前画布里的全部卡片，而不是某一种卡片。",
    "2. “打开全部卡片/显示全部卡片/展开全部卡片”表示确保每一种可用卡片至少显示 1 张，应返回动作 show_all_cards。",
    "3. “关闭所有卡片/删除所有卡片/清空画布/清空卡片”表示清空当前全部卡片，应返回动作 clear_all_cards。",
    "4. 卡片尺寸只有三档：large=大卡片，medium=中卡片，small=小卡片。‘缩小’和‘最小化’都表示 small；‘中等大小’表示 medium；‘放大’表示 large。针对全部卡片时，应返回动作 resize_all_cards。",
    "5. 卡片移动使用 move_cards。位置语义：top=前面/顶部，bottom=后面/底部，left=左侧，right=右侧，top-left=左上角，top-right=右上角，bottom-left=左下角，bottom-right=右下角。",
    "6. 只有用户明确指定某一类卡片时，才使用 show_cards、remove_cards、resize_cards、move_cards。",
    "7. 如果用户使用“并且/然后/同时/接着/再”或用逗号、顿号连接多个要求，必须拆成多个动作，按用户叙述顺序返回 actions。",
    "8. 如果一个子句里同时提到多种卡片，如“温度、湿度和光照”，应针对每种卡片分别生成动作，不要只保留第一种。",
    "9. 复合指令示例：",
    "- “打开全部卡片，并把它们缩小” => [show_all_cards, resize_all_cards(size=small)]",
    "- “关闭所有卡片，然后打开温度和湿度卡片” => [clear_all_cards, show_cards(temperature), show_cards(humidity)]",
    "- “打开温度、湿度和遥测曲线，并把它们都放大” => [show_cards(temperature), show_cards(humidity), show_cards(telemetryChart), resize_cards(... scope=all 或 focus=true)]",
    "- “把遥测曲线移到最前面，再把灯控放到底部” => [move_cards(telemetryChart, top), move_cards(boardLightControl, bottom)]",
    "- “将遥测曲线放到左下角” => [move_cards(telemetryChart, bottom-left)]",
    "10. 如果后续子句出现“它们”“这些卡片”“前面的卡片”，默认指代上一子句中提到的卡片类型集合。",
    "11. 如果后续子句没有再次说出卡片名，但只是继续说‘放大’‘缩小’‘移动到左上角’这类动作，也默认沿用上一子句的卡片类型集合。",
    "12. “温湿度”默认表示温度卡片和湿度卡片两种卡片。",
    "13. 如果用户输入是乱码、无意义字符、闲聊、与卡片无关的话，或无法判断明确卡片意图，必须返回空 actions，并在 reply 中请用户重新描述，不允许猜测成 show_all_cards 或其他全局操作。",
    "14. reply 要简洁总结整体结果，不要只描述其中一步。",
    `可用卡片类型：${availableCardsSummary}。`,
    `当前画布卡片：${currentCardsSummary}。`,
    "用户指令拆解参考：",
    clauseHints,
    `用户原始指令：${payload.instruction}`
  ].join("\n");
};

const resolveLocalSmartDataAssistantResponse = (
  payload: SmartDataAssistantRequestPayload
): SmartDataAssistantResponse | null => {
  const normalizedInstruction = payload.instruction.replace(/\s+/g, "").trim();

  if (!normalizedInstruction) {
    return null;
  }

  const actions = buildLocalSmartDataActions(normalizedInstruction);

  if (actions && actions.length > 0) {
    return {
      reply: buildLocalSmartDataReply(actions, payload),
      actions:
        actions.some((action) => action.type === "clear_all_cards") &&
        actions.length === 1 &&
        payload.cards.length === 0
          ? []
          : actions,
      fallback: true,
      model: null,
      toolTrace: []
    };
  }

  return null;
};

const requestSmartDataMcp = async <TResult>(body: Record<string, unknown>) => {
  const response = await fetch(SMART_DATA_MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...body
    })
  });

  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(responseText || "智慧数据中心 MCP 返回了无法解析的响应。");
  }

  const errorMessage = extractMcpErrorMessage(payload);

  if (!response.ok) {
    throw new Error(errorMessage || "智慧数据中心 MCP 请求失败。");
  }

  if (
    isRecord(payload) &&
    "error" in payload &&
    payload.error !== undefined
  ) {
    throw new Error(errorMessage || "智慧数据中心 MCP 请求失败。");
  }

  if (!isRecord(payload) || !("result" in payload)) {
    throw new Error(
      errorMessage || "智慧数据中心 MCP 返回格式不正确，请确认前端代理与 MCP 服务已连接。"
    );
  }

  return payload.result as TResult;
};

const initializeSmartDataMcp = async () => {
  if (!smartDataMcpInitializePromise) {
    smartDataMcpInitializePromise = requestSmartDataMcp({
      id: "smart-data-mcp-initialize",
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        clientInfo: {
          name: "smart-data-center-web",
          version: "1.0.0"
        },
        capabilities: {}
      }
    })
      .then(() => undefined)
      .catch((error) => {
        smartDataMcpInitializePromise = null;
        throw error;
      });
  }

  return smartDataMcpInitializePromise;
};

export const requestSmartDataAssistant = async (
  payload: SmartDataAssistantRequestPayload
) => {
  if (!isMeaningfulSmartDataInstruction(payload.instruction)) {
    return {
      reply: "没有识别到明确的卡片操作，请换一种说法，例如“打开全部卡片”或“显示湿度和温度卡片”。",
      actions: [],
      fallback: true,
      model: null,
      toolTrace: []
    };
  }

  const localResponse = resolveLocalSmartDataAssistantResponse(payload);

  if (localResponse) {
    return localResponse;
  }

  await initializeSmartDataMcp();

  const result = await requestSmartDataMcp<SmartDataMcpToolCallResult>({
    id: `smart-data-assistant-${Date.now()}`,
    method: "tools/call",
    params: {
      name: "assist_instruction",
      arguments: {
        ...payload,
        rawInstruction: payload.instruction,
        instruction: buildSmartDataInstructionPrompt(payload)
      }
    }
  });

  if (result.isError) {
    const errorMessage =
      result.content?.find((item) => item.type === "text")?.text ||
      "智慧数据中心助手请求失败。";
    throw new Error(errorMessage);
  }

  if (result.structuredContent) {
    return result.structuredContent;
  }

  const textContent = result.content?.find((item) => item.type === "text")?.text;

  if (!textContent) {
    throw new Error("智慧数据中心助手没有返回可解析的数据。");
  }

  return JSON.parse(textContent) as SmartDataAssistantResponse;
};
