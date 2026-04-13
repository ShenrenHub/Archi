import { useState } from "react";
import { Button, Input, Tag, message } from "antd";
import dayjs from "dayjs";
import { SendOutlined } from "@ant-design/icons";
import { sendAgentQuestion } from "@/api/agent";
import type { AgentChatMessage } from "@/api/agent";
import { AgentConversation } from "@/components/chat/AgentConversation";
import { AppCard } from "@/components/common/AppCard";

const initialMessages: AgentChatMessage[] = [
  {
    id: "assistant-init",
    role: "assistant",
    createdAt: dayjs().toISOString(),
    content:
      "欢迎使用农事问答智能体。你可以询问病虫害、环境策略、设备联动或作物管理建议。"
  }
];

export default function AgentPage() {
  const [messages, setMessages] = useState<AgentChatMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
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
      setReferences(response.references);
    } catch {
      message.error("问答请求失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <AppCard title="智能体农事问答">
        <div className="flex h-[70vh] flex-col">
          <AgentConversation messages={messages} />
          <div className="mt-4 flex gap-3">
            <Input.TextArea
              value={question}
              rows={3}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="例如：番茄棚湿度持续偏高且叶片出现黄色斑点，该如何处理？"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              onClick={() => void handleSend()}
            >
              发送
            </Button>
          </div>
        </div>
      </AppCard>

      <div className="space-y-4">
        <AppCard title="检索参考">
          <div className="flex flex-wrap gap-2">
            {references.length > 0 ? (
              references.map((item) => (
                <Tag key={item} color="green">
                  {item}
                </Tag>
              ))
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-300">发送问题后展示 RAG 检索片段。</span>
            )}
          </div>
        </AppCard>

        <AppCard title="推荐提问">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>1. 最近湿度高，黄瓜叶片边缘卷曲，应该优先调什么设备？</p>
            <p>2. 如何设置番茄棚的清晨补光与午后排湿联动策略？</p>
            <p>3. 视觉告警提示疑似病斑时，农户应该先做哪些现场排查？</p>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
