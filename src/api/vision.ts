import axios from "axios";
import { request } from "@/api/request";

export interface VisionAlertItem {
  id: string;
  greenhouseName: string;
  level: "high" | "medium" | "low";
  issue: string;
  createdAt: string;
  pushedToExpert: boolean;
}

export interface VisionAnalyzeRequest {
  imageName: string;
  imageBase64: string;
  source?: "mock" | "smartjavaai";
}

export interface VisionAnalyzeResponse {
  imageUrl: string;
  confidence: number;
  obstruction: boolean;
  disease: string;
  suggestions: string[];
  requestId?: string;
  source?: "mock" | "smartjavaai";
  reviewRecommended?: boolean;
}

export interface PushReviewRequest {
  alertId: string;
}

export interface ExpertReviewTask {
  id: string;
  alertId: string;
  greenhouseName: string;
  cropName: string;
  issue: string;
  aiSummary: string;
  disease: string;
  confidence: number;
  createdAt: string;
  status: "pending" | "reviewed";
  priority: "high" | "medium" | "low";
  imageUrl: string;
  expertSuggestion?: string;
  reviewedAt?: string;
}

export interface SubmitExpertReviewRequest {
  taskId: string;
  suggestion: string;
  conclusion: "confirmed" | "needs_recheck";
}

export interface SmartJavaAiAnalyzeRequest {
  imageName: string;
  imageBase64: string;
  greenhouseName?: string;
  traceId?: string;
}

export interface SmartJavaAiRegion {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface SmartJavaAiAnalyzeResponse {
  success: boolean;
  requestId: string;
  model: string;
  disease: string;
  obstruction: boolean;
  confidence: number;
  summary: string;
  suggestions: string[];
  regions: SmartJavaAiRegion[];
  rawPayload?: Record<string, unknown>;
}

const smartJavaAiRequest = axios.create({
  baseURL: import.meta.env.VITE_SMARTJAVAAI_BASE_URL || "/smartjavaai",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * 业务场景 4-2:
 * 上传叶片图片后，调用视觉分析接口，返回遮挡、病变与处置建议。
 * 当前支持通过 base64 文本传图，便于平滑切换到 SmartJavaAI。
 */
export const analyzeCropImage = (payload: VisionAnalyzeRequest) =>
  request.post<VisionAnalyzeRequest, VisionAnalyzeResponse>("/vision/analyze", payload);

/**
 * 业务场景 4-2:
 * 预留 SmartJavaAI 外部服务接口，通过 base64 文本传输图片并接收结构化分析结果。
 * 部署时仅需配置 VITE_SMARTJAVAAI_BASE_URL 即可切换到真实服务。
 */
export const submitSmartJavaAiAnalysis = (payload: SmartJavaAiAnalyzeRequest) =>
  smartJavaAiRequest.post<SmartJavaAiAnalyzeRequest, SmartJavaAiAnalyzeResponse>(
    "/api/vision/analyze/base64",
    payload
  );

/**
 * 业务场景 4-3:
 * 获取异常告警通知列表。
 */
export const fetchVisionAlerts = () =>
  request.get<never, VisionAlertItem[]>("/vision/alerts");

/**
 * 业务场景 4-3:
 * 对指定异常发起“推送专家复核”动作。
 */
export const pushAlertToExpert = (payload: PushReviewRequest) =>
  request.post<PushReviewRequest, { success: boolean; alertId: string }>(
    "/vision/push-review",
    payload
  );

/**
 * 业务场景 4-5:
 * 获取待专家复核的视觉异常任务列表，用于专家工作台和管理员追踪视图。
 */
export const fetchExpertReviewTasks = () =>
  request.get<never, ExpertReviewTask[]>("/vision/expert-review/tasks");

/**
 * 业务场景 4-5:
 * 专家提交复核意见，系统需回写建议、复核结论和时间。
 */
export const submitExpertReview = (payload: SubmitExpertReviewRequest) =>
  request.post<SubmitExpertReviewRequest, ExpertReviewTask>(
    "/vision/expert-review/submit",
    payload
  );
