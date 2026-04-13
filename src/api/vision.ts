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
}

export interface VisionAnalyzeResponse {
  imageUrl: string;
  confidence: number;
  obstruction: boolean;
  disease: string;
  suggestions: string[];
}

export interface PushReviewRequest {
  alertId: string;
}

/**
 * 业务场景 4-2:
 * 上传叶片图片后，调用视觉分析接口，返回遮挡、病变与处置建议。
 */
export const analyzeCropImage = (payload: VisionAnalyzeRequest) =>
  request.post<VisionAnalyzeRequest, VisionAnalyzeResponse>("/vision/analyze", payload);

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
