import { request } from "@/api/request";

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

export const listPosts = (skip = 0, limit = 20) =>
  request.get<never, PostOut[]>(`/api/community/posts?skip=${skip}&limit=${limit}`);

export const getPost = (postId: number) =>
  request.get<never, PostOut>(`/api/community/posts/${postId}`);

export const createPost = (payload: PostPayload) =>
  request.post<PostPayload, PostOut>("/api/community/posts", payload);

export const updatePost = (postId: number, payload: PostPatchPayload) =>
  request.patch<PostPatchPayload, PostOut>(
    `/api/community/posts/${postId}`,
    payload
  );

export const triggerSuggestions = (postId: number) =>
  request.post<undefined, SuggestionOut[]>(
    `/api/community/suggestions/trigger/${postId}`
  );

export const getSuggestionsByPost = (postId: number) =>
  request.get<never, SuggestionOut[]>(`/api/community/suggestions/post/${postId}`);

export const createVote = (payload: VotePayload) =>
  request.post<VotePayload, VoteOut>("/api/community/votes", payload);

export const getSuggestionVotes = (suggestionId: number) =>
  request.get<never, VoteOut[]>(
    `/api/community/votes/suggestion/${suggestionId}`
  );

export const createComment = (payload: CommentPayload) =>
  request.post<CommentPayload, CommentOut>("/api/community/comments", payload);

export const getCommentsByPost = (postId: number) =>
  request.get<never, CommentOut[]>(`/api/community/comments/post/${postId}`);

export const createFeedback = (payload: FeedbackPayload) =>
  request.post<FeedbackPayload, FeedbackOut>("/api/community/feedback", payload);

export const getFeedbackByPost = (postId: number) =>
  request.get<never, FeedbackOut>(`/api/community/feedback/post/${postId}`);

export const archiveFeedback = (feedbackId: number) =>
  request.post<undefined, ArchiveFeedbackResponse>(
    `/api/community/feedback/${feedbackId}/archive`
  );
