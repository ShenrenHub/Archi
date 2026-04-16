import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Form, Input, List, Tag } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { askQuestion, createQaSession, fetchQaHistory, type QaMessage } from "@/api/agent";
import { AgentConversation } from "@/components/chat/AgentConversation";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

interface SessionDraft {
  id: number;
  title: string;
}

export default function AgentPage() {
  const farmId = useUserStore((state) => state.farmId);
  const userId = useUserStore((state) => state.userId);
  const [sessionTitle, setSessionTitle] = useState("番茄病害诊断");
  const [sessions, setSessions] = useState<SessionDraft[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [history, setHistory] = useState<QaMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [extraDocument, setExtraDocument] = useState("");
  const [creating, setCreating] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!farmId || !currentSessionId) {
      return;
    }

    void fetchQaHistory(farmId, currentSessionId).then(setHistory).catch(() => setHistory([]));
  }, [currentSessionId, farmId]);

  const conversation = useMemo(
    () =>
      history.map((item) => ({
        id: item.id,
        role: item.messageRole === "ASSISTANT" ? "assistant" as const : "user" as const,
        content: item.content
      })),
    [history]
  );

  const handleCreateSession = async () => {
    if (!farmId || !userId) {
      return;
    }

    setCreating(true);
    try {
      const sessionId = await createQaSession({
        farmId,
        sessionTitle,
        createdUserId: userId
      });
      const nextSession = { id: sessionId, title: sessionTitle };
      setSessions((current) => [nextSession, ...current]);
      setCurrentSessionId(sessionId);
      setHistory([]);
    } finally {
      setCreating(false);
    }
  };

  const handleAsk = async () => {
    if (!farmId || !currentSessionId || !question.trim()) {
      return;
    }

    setAsking(true);
    try {
      await askQuestion({
        farmId,
        sessionId: currentSessionId,
        question,
        extraDocument
      });
      setQuestion("");
      setHistory(await fetchQaHistory(farmId, currentSessionId));
    } finally {
      setAsking(false);
    }
  };

  if (!farmId || !userId) {
    return <Empty description="当前账号缺少 farmId 或 userId，无法发起问答。" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <AppCard title="问答会话与历史">
        <div className="flex h-[70vh] flex-col gap-4">
          {conversation.length > 0 ? (
            <AgentConversation messages={conversation} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[24px] bg-white/40 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
              创建会话并发送问题后，这里会展示 `/api/qa/history` 返回的历史消息。
            </div>
          )}
          <Form layout="vertical">
            <Form.Item label="问题">
              <Input.TextArea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="番茄叶片卷曲怎么办？" />
            </Form.Item>
            <Form.Item label="补充上下文">
              <Input.TextArea rows={2} value={extraDocument} onChange={(event) => setExtraDocument(event.target.value)} placeholder="棚内最近三天温度偏高" />
            </Form.Item>
            <Button type="primary" icon={<SendOutlined />} loading={asking} disabled={!currentSessionId} onClick={() => void handleAsk()}>
              发送问题
            </Button>
          </Form>
        </div>
      </AppCard>

      <div className="space-y-4">
        <AppCard title="创建问答会话">
          <Input value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="会话标题" />
          <Button className="mt-4" type="primary" loading={creating} onClick={() => void handleCreateSession()}>
            创建会话
          </Button>
        </AppCard>

        <AppCard title="本地会话列表">
          <List
            dataSource={sessions}
            renderItem={(item) => (
              <List.Item className="!px-0">
                <button type="button" className="w-full rounded-[20px] bg-white/60 p-4 text-left dark:bg-white/5" onClick={() => setCurrentSessionId(item.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900 dark:text-white">{item.title}</span>
                    <Tag color={item.id === currentSessionId ? "green" : "default"}>{item.id}</Tag>
                  </div>
                </button>
              </List.Item>
            )}
          />
        </AppCard>

        <AppCard title="最近历史摘要">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {history.slice(-3).map((item) => (
              <div key={item.id} className="rounded-[20px] bg-white/60 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <Tag>{item.messageRole}</Tag>
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-3">{item.content}</p>
              </div>
            ))}
            {history.length === 0 ? <span>暂无历史。</span> : null}
          </div>
        </AppCard>
      </div>
    </div>
  );
}
