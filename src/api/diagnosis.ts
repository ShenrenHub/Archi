export type DiagnosisStatus = "uploaded" | "ai_analyzed" | "pending_review" | "reviewed" | "rejected";

export interface DiagnosisRecord {
  id: string;
  farmId: number;
  imageUrl: string;
  fileName: string;
  createdAt: string;
  status: DiagnosisStatus;
  aiResult?: {
    disease: string;
    confidence: number;
    severity: string;
    suggestions: string[];
  };
  expertResult?: {
    decision: "CONFIRMED" | "REJECTED";
    advice: string;
    expertName: string;
    reviewedAt: string;
  };
}

export let diagnosisRecords: DiagnosisRecord[] = [
  {
    id: "diag-seed-001",
    farmId: 1001,
    imageUrl:
      "https://images.unsplash.com/photo-1592841200221-5d4f4b8d01df?auto=format&fit=crop&w=1200&q=80",
    fileName: "tomato-leaf-001.jpg",
    createdAt: "2026-04-15 09:30:00",
    status: "reviewed",
    aiResult: {
      disease: "疑似早期白粉病",
      confidence: 0.89,
      severity: "中度",
      suggestions: [
        "建议复查叶片背面菌丝分布情况，确认病害范围。",
        "优先对高湿区域执行短时通风，降低棚内相对湿度。",
        "如病斑扩展明显，可使用三唑酮类药剂进行局部喷施。",
      ],
    },
    expertResult: {
      decision: "CONFIRMED",
      advice:
        "同意 AI 判断。已确认白粉病初期，建议立即喷施 15% 三唑酮可湿性粉剂 1000 倍液，连续 2-3 次，间隔 7 天，同时加强通风排湿。",
      expertName: "王建国（高级农艺师）",
      reviewedAt: "2026-04-15 14:20:00",
    },
  },
  {
    id: "diag-seed-002",
    farmId: 1001,
    imageUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    fileName: "cucumber-leaf-002.jpg",
    createdAt: "2026-04-16 10:15:00",
    status: "pending_review",
    aiResult: {
      disease: "疑似霜霉病",
      confidence: 0.82,
      severity: "轻度",
      suggestions: [
        "检查叶片背面是否有灰黑色霉层。",
        "适当降低棚内湿度，增加通风。",
        "必要时喷施烯酰吗啉进行预防。",
      ],
    },
  },
];

export const addDiagnosisRecord = (record: DiagnosisRecord) => {
  diagnosisRecords = [record, ...diagnosisRecords];
};

export const updateDiagnosisRecord = (id: string, patch: Partial<DiagnosisRecord>) => {
  diagnosisRecords = diagnosisRecords.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );
};

export const fetchDiagnosisRecords = (): Promise<DiagnosisRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...diagnosisRecords]), 400);
  });
};

export const submitExpertReviewForRecord = (
  id: string,
  payload: { decision: "CONFIRMED" | "REJECTED"; advice: string; expertName: string }
): Promise<DiagnosisRecord> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const record = diagnosisRecords.find((r) => r.id === id);
      if (!record) {
        throw new Error("记录不存在");
      }
      const updated: DiagnosisRecord = {
        ...record,
        status: payload.decision === "CONFIRMED" ? "reviewed" : "rejected",
        expertResult: {
          ...payload,
          reviewedAt: new Date().toLocaleString("zh-CN"),
        },
      };
      diagnosisRecords = diagnosisRecords.map((item) =>
        item.id === id ? updated : item
      );
      resolve(updated);
    }, 600);
  });
};
