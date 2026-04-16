import { Button, Input } from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { AgentChatMessage } from "@/api/agent";
import { AgentConversation } from "@/components/chat/AgentConversation";
import { AppCard } from "@/components/common/AppCard";

interface SmartDataCenterChatPanelProps {
  messages: AgentChatMessage[];
  question: string;
  sending: boolean;
  onQuestionChange: (value: string) => void;
  onSend: () => Promise<void>;
}

export const SmartDataCenterChatPanel = ({
  messages,
  question,
  sending,
  onQuestionChange,
  onSend
}: SmartDataCenterChatPanelProps) => (
  <AppCard title="AI 对话框" className="min-h-[560px] xl:h-full">
    <div className="flex h-full flex-col">
      <AgentConversation messages={messages} />
      <div className="mt-4 flex gap-3">
        <Input.TextArea
          value={question}
          rows={3}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="输入你想咨询的问题"
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault();
              void onSend();
            }
          }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={() => void onSend()}>
          发送
        </Button>
      </div>
    </div>
  </AppCard>
);
