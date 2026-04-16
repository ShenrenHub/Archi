import axios, { AxiosError } from "axios";
import { message } from "antd";

const communityBaseUrl =
  import.meta.env.VITE_COMMUNITY_API_BASE_URL || "http://localhost:8000/api/v1";

export type PostStatus = "open" | "analyzing" | "resolved" | "closed";
export type AgentType = "community" | "current_data" | "rag" | "historical_data" | "voting_feedback";
export type VoterRole = "user" | "expert" | "agent";
export type AuthorRole = "user" | "expert" | "agent";

export interface VoteSummary {
  total_votes: number;
  user_votes: number;
  expert_votes: number;
  agent_votes: number;
}

export interface SuggestionReference {
  case_id: number;
  title: string;
  crop_type: string;
  region: string;
  solution_summary: string;
  is_effective: boolean;
}

export interface PostPayload {
  title: string;
  description: string;
  images: string[];
  structured_data: Record<string, unknown>;
  region: string;
  crop_type: string;
  author_id: number;
}

export interface PostOut extends PostPayload {
  id: number;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface PostPatchPayload {
  title?: string;
  description?: string;
  images?: string[];
  structured_data?: Record<string, unknown>;
  region?: string;
  crop_type?: string;
  status?: PostStatus;
}

export interface SuggestionOut {
  id: number;
  post_id: number;
  agent_type: AgentType;
  agent_name: string;
  content: string;
  reasoning: string;
  references: SuggestionReference[];
  vote_summary: VoteSummary;
  created_at: string;
}

export interface VotePayload {
  suggestion_id: number;
  voter_id: number;
  voter_role: VoterRole;
}

export interface VoteOut extends VotePayload {
  id: number;
  created_at: string;
}

export interface CommentPayload {
  post_id: number;
  content: string;
  author_id: number;
  author_role: AuthorRole;
  parent_id: number | null;
}

export interface CommentOut extends CommentPayload {
  id: number;
  created_at: string;
}

export interface FeedbackPayload {
  post_id: number;
  adopted_suggestion_id: number;
  is_effective: boolean;
  description: string;
  new_images: string[];
  new_data: Record<string, unknown>;
}

export interface FeedbackOut extends FeedbackPayload {
  id: number;
  created_at: string;
  updated_at?: string;
}

export interface ArchiveFeedbackResponse {
  message: string;
  case_id: number;
}

export const communityRequest = axios.create({
  baseURL: communityBaseUrl,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

communityRequest.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ detail?: string }>) => {
    const serverMessage =
      error.response?.data?.detail || error.message || "社区接口请求失败";
    message.error(serverMessage);
    return Promise.reject(error);
  }
);

export const listPosts = (skip = 0, limit = 20) =>
  communityRequest.get<never, PostOut[]>(`/posts?skip=${skip}&limit=${limit}`);

export const getPost = (postId: number) =>
  communityRequest.get<never, PostOut>(`/posts/${postId}`);

export const createPost = (payload: PostPayload) =>
  communityRequest.post<PostPayload, PostOut>("/posts", payload);

export const updatePost = (postId: number, payload: PostPatchPayload) =>
  communityRequest.patch<PostPatchPayload, PostOut>(`/posts/${postId}`, payload);

export const triggerSuggestions = (postId: number) =>
  communityRequest.post<undefined, SuggestionOut[]>(`/suggestions/trigger/${postId}`);

export const getSuggestionsByPost = (postId: number) =>
  communityRequest.get<never, SuggestionOut[]>(`/suggestions/post/${postId}`);

export const createVote = (payload: VotePayload) =>
  communityRequest.post<VotePayload, VoteOut>("/votes", payload);

export const getSuggestionVotes = (suggestionId: number) =>
  communityRequest.get<never, VoteOut[]>(`/votes/suggestion/${suggestionId}`);

export const createComment = (payload: CommentPayload) =>
  communityRequest.post<CommentPayload, CommentOut>("/comments", payload);

export const getCommentsByPost = (postId: number) =>
  communityRequest.get<never, CommentOut[]>(`/comments/post/${postId}`);

export const createFeedback = (payload: FeedbackPayload) =>
  communityRequest.post<FeedbackPayload, FeedbackOut>("/feedback", payload);

export const getFeedbackByPost = (postId: number) =>
  communityRequest.get<never, FeedbackOut>(`/feedback/post/${postId}`);

export const archiveFeedback = (feedbackId: number) =>
  communityRequest.post<undefined, ArchiveFeedbackResponse>(`/feedback/${feedbackId}/archive`);
