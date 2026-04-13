import { request } from "@/api/request";

export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AgentChatRequest {
  question: string;
  history: AgentChatMessage[];
}

export interface AgentChatResponse {
  answer: AgentChatMessage;
  references: string[];
}

/**
 * 业务场景 5:
 * 提交农事问题与上下文消息，获取基于 RAG 的智能问答回复。
 */
export const sendAgentQuestion = (payload: AgentChatRequest) =>
  request.post<AgentChatRequest, AgentChatResponse>("/agent/chat", payload);
