import { request } from "@/api/request";

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

export const createQaSession = (payload: CreateSessionPayload) =>
  request.post<CreateSessionPayload, number>("/api/qa/sessions", payload);

export const askQuestion = (payload: AskQuestionPayload) =>
  request.post<AskQuestionPayload, string>("/api/qa/ask", payload);

export const fetchQaHistory = (farmId: number, sessionId: number) =>
  request.get<never, QaMessage[]>(`/api/qa/history?farmId=${farmId}&sessionId=${sessionId}`);
