import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import type { AgentChatMessage } from "@/api/agent";

interface AgentConversationProps {
  messages: AgentChatMessage[];
}

export const AgentConversation = ({ messages }: AgentConversationProps) => (
  <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
    {messages.map((item) => (
      <div
        key={item.id}
        className={clsx(
          "max-w-[85%] rounded-[24px] px-5 py-4 shadow-panel",
          item.role === "assistant"
            ? "bg-white/80 text-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
            : "ml-auto bg-gradient-to-br from-brand-500 to-accent-500 text-white"
        )}
      >
        {item.role === "assistant" ? (
          <div className="markdown-body text-sm leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
        )}
      </div>
    ))}
  </div>
);
