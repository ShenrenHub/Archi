import type {
  SmartDataAssistantAction,
  SmartDataCardItem
} from "./model";

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
  await initializeSmartDataMcp();

  const result = await requestSmartDataMcp<SmartDataMcpToolCallResult>({
    id: `smart-data-assistant-${Date.now()}`,
    method: "tools/call",
    params: {
      name: "assist_instruction",
      arguments: payload
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
