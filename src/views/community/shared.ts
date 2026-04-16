import { message } from "antd";
import type { PostStatus, SuggestionOut } from "@/api/community";
import { useThemeStore } from "@/store/theme";
import { useEffect } from "react";

export type CommentRole = "user" | "expert" | "agent";

export interface PostFormValues {
  title: string;
  description: string;
  imagesText: string;
  structuredDataText: string;
  region: string;
  crop_type: string;
  author_id: number;
}

export interface CommentFormValues {
  content: string;
  author_id: number;
  author_role: CommentRole;
  parent_id?: number;
}

export interface FeedbackFormValues {
  adopted_suggestion_id: number;
  is_effective: boolean;
  description: string;
  newImagesText: string;
  newDataText: string;
}

export const statusLabelMap: Record<PostStatus, string> = {
  open: "待分析",
  analyzing: "分析中",
  resolved: "已反馈",
  closed: "已关闭"
};

export const statusColorMap: Record<PostStatus, string> = {
  open: "blue",
  analyzing: "gold",
  resolved: "green",
  closed: "default"
};

export const agentLabelMap: Record<SuggestionOut["agent_type"], string> = {
  community: "社区经验",
  current_data: "当前数据",
  rag: "知识库",
  historical_data: "历史趋势",
  voting_feedback: "投票反馈"
};

export const roleOptions = [
  { label: "用户票", value: "user" },
  { label: "专家票", value: "expert" },
  { label: "Agent票", value: "agent" }
] as const;

export const parseImages = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const parseJson = (value: string, label: string) => {
  try {
    return value.trim() ? (JSON.parse(value) as Record<string, unknown>) : {};
  } catch {
    message.error(`${label} 需要是合法 JSON`);
    throw new Error(`${label} invalid`);
  }
};

export const prettyJson = (value?: Record<string, unknown> | null) =>
  value ? JSON.stringify(value, null, 2) : "{}";

export const excerpt = (value: string, length = 120) =>
  value.length <= length ? value : `${value.slice(0, length)}...`;

export const readingMinutes = (text: string) => Math.max(1, Math.round(text.length / 180));

export const useCommunityLightMode = () => {
  const setMode = useThemeStore((state) => state.setMode);

  useEffect(() => {
    setMode("light");
    document.documentElement.classList.remove("dark");
  }, [setMode]);
};
