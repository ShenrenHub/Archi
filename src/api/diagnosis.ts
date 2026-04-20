import { request } from "@/api/request";

export type DiagnosisStatus = "uploaded" | "ai_analyzed" | "pending_review" | "reviewed" | "rejected";
export type ReviewDecision = "CONFIRMED" | "REJECTED";

export interface AiResult {
  disease: string;
  confidence: number;
  severity: string;
  suggestions: string[];
  imageUrl: string;
  summary: string;
}

export interface ExpertResult {
  decision: ReviewDecision;
  advice: string;
  expertName: string;
  reviewedAt: string;
}

export interface DiagnosisRecord {
  id: string;
  farmId: number;
  imageUrl: string;
  fileName: string;
  createdAt: string;
  status: DiagnosisStatus;
  originalImageUrl?: string;
  annotatedImageUrl?: string;
  aiResult?: AiResult;
  expertResult?: ExpertResult;
  reviewSubmittedAt?: string;
  reviewSubmittedBy?: string;
}

export const createDiagnosisRecord = (payload: {
  farmId: number;
  file: File;
  uploadedBy?: string;
}): Promise<DiagnosisRecord> => {
  const formData = new FormData();
  formData.append("farmId", String(payload.farmId));
  formData.append("file", payload.file);
  if (payload.uploadedBy) {
    formData.append("uploadedBy", payload.uploadedBy);
  }
  return request.post("/api/crop-diagnosis/records", formData, { baseURL: "" });
};

export const fetchDiagnosisRecords = (params?: {
  farmId?: number;
  status?: DiagnosisStatus;
}): Promise<DiagnosisRecord[]> => {
  return request.get("/api/crop-diagnosis/records", { params, baseURL: "" });
};

export const fetchDiagnosisRecordDetail = (recordId: string): Promise<DiagnosisRecord> => {
  return request.get(`/api/crop-diagnosis/records/${recordId}`, { baseURL: "" });
};

export const submitReviewRequest = (
  recordId: string,
  payload: { submittedBy?: string }
): Promise<DiagnosisRecord> => {
  return request.post(`/api/crop-diagnosis/records/${recordId}/submit-review`, payload, { baseURL: "" });
};

export const submitExpertReview = (
  recordId: string,
  payload: { decision: ReviewDecision; advice: string; expertName: string }
): Promise<DiagnosisRecord> => {
  return request.post(`/api/crop-diagnosis/records/${recordId}/expert-review`, payload, { baseURL: "" });
};
