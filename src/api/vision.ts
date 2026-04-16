import { request } from "@/api/request";

export interface CameraItem {
  cameraId: number;
  cameraName: string;
  streamProtocol: string;
  streamUrl: string;
  playbackToken: string;
}

export interface CreateCameraPayload {
  farmId: number;
  greenhouseId: number;
  cameraCode: string;
  cameraName: string;
  streamProtocol: string;
  streamUrl: string;
}

export interface CreateVisionTaskPayload {
  farmId: number;
  greenhouseId: number;
  cameraId: number;
  fileName: string;
  fileUrl: string;
  objectKey: string;
  providerType: string;
}

export interface VisionTaskCallbackPayload {
  farmId: number;
  taskId: number;
  resultLabel: string;
  confidenceScore: number;
  abnormalFlag: number;
  resultJson: string;
}

export interface VisionReviewPayload {
  farmId: number;
  resultId: number;
  expertUserId: number;
  reviewDecision: string;
  reviewAdvice: string;
}

export const createCamera = (payload: CreateCameraPayload) =>
  request.post<CreateCameraPayload, number>("/api/cameras", payload);

export const fetchCameras = (farmId: number) =>
  request.get<never, CameraItem[]>(`/api/cameras?farmId=${farmId}`);

export const createVisionTask = (payload: CreateVisionTaskPayload) =>
  request.post<CreateVisionTaskPayload, number>("/api/vision/tasks", payload);

export const submitVisionTaskCallback = (payload: VisionTaskCallbackPayload) =>
  request.patch<VisionTaskCallbackPayload, number>("/api/vision/tasks/callback", payload);

export const submitVisionReview = (payload: VisionReviewPayload) =>
  request.post<VisionReviewPayload, number>("/api/vision/reviews", payload);
