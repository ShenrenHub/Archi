import { useState } from "react";
import { Button, Input, Tag, message } from "antd";
import { DownOutlined, PlusOutlined, SendOutlined, UpOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { sendAgentQuestion } from "@/api/agent";
import type { AgentChatMessage } from "@/api/agent";
import { AgentConversation } from "@/components/chat/AgentConversation";
import { AppCard } from "@/components/common/AppCard";

const initialMessages: AgentChatMessage[] = [
  {
    id: "smart-data-center-assistant-init",
    role: "assistant",
    createdAt: dayjs().toISOString(),
    content: "这里是智慧数据中心 AI 助手。你可以直接询问数据接入、联动策略、异常排查或指标解读。"
  }
];

interface SmartDataCardItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function SmartDataCenterPage() {
  const [cards, setCards] = useState<SmartDataCardItem[]>([]);
  const [messages, setMessages] = useState<AgentChatMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [cardContent, setCardContent] = useState("");

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
    } catch {
      message.error("AI 对话请求失败");
    } finally {
      setSending(false);
    }
  };

  const handleAddCard = () => {
    const title = cardTitle.trim();
    const content = cardContent.trim();

    if (!title) {
      message.warning("请输入 card 标题");
      return;
    }

    const nextCard: SmartDataCardItem = {
      id: `card-${Date.now()}`,
      title,
      content: content || "空白内容",
      createdAt: dayjs().toISOString()
    };

    setCards((current) => [nextCard, ...current]);
    setCardTitle("");
    setCardContent("");
    message.success("已添加 card");
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <AppCard
          title="动态卡片容器"
          extra={<Tag color="green">{`已加载 ${cards.length} 个 card`}</Tag>}
          className="min-h-[420px] xl:min-h-0"
        >
          <div className="grid h-full min-h-[320px] content-start gap-4 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
            {cards.length > 0 ? (
              cards.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-200/70 bg-white/60 p-5 shadow-sm dark:border-white/8 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </p>
                    </div>
                    <Tag color="blue">{`Card ${cards.length - index}`}</Tag>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-300/80 bg-slate-50/70 p-8 text-center dark:border-white/12 dark:bg-white/5">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">左侧容器当前为空</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    展开下方控制台后，可以持续向这里动态添加多个 card。
                  </p>
                </div>
              </div>
            )}
          </div>
        </AppCard>

        <AppCard title="AI 对话框" className="min-h-[560px] xl:h-full">
          <div className="flex h-full flex-col">
            <AgentConversation messages={messages} />
            <div className="mt-4 flex gap-3">
              <Input.TextArea
                value={question}
                rows={3}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="输入你想咨询的问题"
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
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
      </div>

      <AppCard
        title="控制台"
        extra={
          <Button
            type="text"
            icon={consoleOpen ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setConsoleOpen((current) => !current)}
          >
            {consoleOpen ? "收起" : "展开"}
          </Button>
        }
      >
        {consoleOpen ? (
          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_auto] xl:items-end">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Card 标题</p>
              <Input
                value={cardTitle}
                onChange={(event) => setCardTitle(event.target.value)}
                placeholder="例如：环境监测概览"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Card 内容</p>
              <Input.TextArea
                value={cardContent}
                rows={3}
                onChange={(event) => setCardContent(event.target.value)}
                placeholder="输入要载入到左侧 card 的内容"
              />
            </div>

            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
              增加 card
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            控制台默认折叠。展开后可向左侧容器动态增加新的 card。
          </p>
        )}
      </AppCard>
    </div>
  );
}
