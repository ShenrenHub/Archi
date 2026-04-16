import { request } from "@/api/request";
import { useUserStore } from "@/store/user";

export interface QaMessage {
  id: number;
  farmId: number;
  sessionId: number;
  messageRole: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface CreateSessionPayload {
  farmId: number;
  sessionTitle: string;
  createdUserId: number;
}

export interface AskQuestionPayload {
  farmId: number;
  sessionId: number;
  question: string;
  extraDocument: string;
}

export interface AgentChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface SendAgentQuestionPayload {
  question: string;
  history?: AgentChatMessage[];
  extraDocument?: string;
}

interface SendAgentQuestionResponse {
  sessionId: number;
  answer: AgentChatMessage;
}

const SMART_DATA_CENTER_SESSION_KEY = "smart-data-center-session-id";

export const createQaSession = (payload: CreateSessionPayload) =>
  request.post<CreateSessionPayload, number>("/api/qa/sessions", payload);

export const askQuestion = (payload: AskQuestionPayload) =>
  request.post<AskQuestionPayload, string>("/api/qa/ask", payload);

export const fetchQaHistory = (farmId: number, sessionId: number) =>
  request.get<never, QaMessage[]>(`/api/qa/history?farmId=${farmId}&sessionId=${sessionId}`);

export const sendAgentQuestion = async (
  payload: SendAgentQuestionPayload
): Promise<SendAgentQuestionResponse> => {
  const { farmId, userId } = useUserStore.getState();

  if (!farmId || !userId) {
    throw new Error("当前账号缺少 farmId 或 userId，无法发起问答。");
  }

  const sessionId = await ensureSmartDataCenterSession(farmId, userId);

  await askQuestion({
    farmId,
    sessionId,
    question: payload.question,
    extraDocument: payload.extraDocument ?? ""
  });

  const history = await fetchQaHistory(farmId, sessionId);
  const answer = [...history]
    .reverse()
    .find((item) => item.messageRole === "ASSISTANT");

  if (!answer) {
    throw new Error("问答接口未返回助手消息。");
  }

  return {
    sessionId,
    answer: {
      id: answer.id,
      role: "assistant",
      content: answer.content,
      createdAt: answer.createdAt
    }
  };
};

const ensureSmartDataCenterSession = async (
  farmId: number,
  userId: number
) => {
  const cachedSessionId = getCachedSessionId();

  if (cachedSessionId) {
    return cachedSessionId;
  }

  const sessionId = await createQaSession({
    farmId,
    createdUserId: userId,
    sessionTitle: "智慧数据中心"
  });

  setCachedSessionId(sessionId);
  return sessionId;
};

const getCachedSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SMART_DATA_CENTER_SESSION_KEY);
  if (!rawValue) {
    return null;
  }

  const sessionId = Number(rawValue);
  return Number.isFinite(sessionId) && sessionId > 0 ? sessionId : null;
};

const setCachedSessionId = (sessionId: number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SMART_DATA_CENTER_SESSION_KEY,
    String(sessionId)
  );
};
