import { useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { sendAgentQuestion } from "@/api/agent";
import type { AgentChatMessage } from "@/api/agent";

const initialMessages: AgentChatMessage[] = [
  {
    id: "smart-data-center-assistant-init",
    role: "assistant",
    createdAt: dayjs().toISOString(),
    content: "这里是智慧数据中心 AI 助手。你可以直接询问数据接入、联动策略、异常排查或指标解读。"
  }
];

interface SmartDataCenterChatResult {
  messages: AgentChatMessage[];
  question: string;
  sending: boolean;
  setQuestion: (value: string) => void;
  sendQuestion: () => Promise<void>;
}

export const useSmartDataCenterChat = (): SmartDataCenterChatResult => {
  const [messages, setMessages] = useState<AgentChatMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  const sendQuestion = async () => {
    const content = question.trim();

    if (!content) {
      return;
    }

    const userMessage: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      createdAt: dayjs().toISOString()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion("");
    setSending(true);

    try {
      const response = await sendAgentQuestion({
        question: content,
        history: nextMessages
      });
      setMessages((current) => [...current, response.answer]);
    } catch {
      message.error("AI 对话请求失败");
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    question,
    sending,
    setQuestion,
    sendQuestion
  };
};
