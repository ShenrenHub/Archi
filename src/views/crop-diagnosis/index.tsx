import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Space,
  Steps,
  Table,
  Tag,
  Upload,
  message,
  type TableColumnsType,
  type UploadFile,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  FileImageOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  RobotOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AppCard } from "@/components/common/AppCard";
import {
  addDiagnosisRecord,
  fetchDiagnosisRecords,
  submitExpertReviewForRecord,
  type DiagnosisRecord,
} from "@/api/diagnosis";
import { useUserStore } from "@/store/user";

const Step = Steps.Step;

interface AiResult {
  disease: string;
  confidence: number;
  severity: string;
  suggestions: string[];
  imageUrl: string;
}

const statusMap: Record<
  DiagnosisRecord["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  uploaded: { label: "已上传", color: "default", icon: <ClockCircleOutlined /> },
  ai_analyzed: { label: "AI 已分析", color: "processing", icon: <ClockCircleOutlined /> },
  pending_review: { label: "待专家复核", color: "warning", icon: <ClockCircleOutlined /> },
  reviewed: { label: "已复核", color: "success", icon: <CheckCircleOutlined /> },
  rejected: { label: "已驳回", color: "error", icon: <CloseCircleOutlined /> },
};

const mockAiAnalyze = (imageName: string): Promise<AiResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        disease: "疑似早期白粉病",
        confidence: 0.89,
        severity: "中度",
        suggestions: [
          "建议复查叶片背面菌丝分布情况，确认病害范围。",
          "优先对高湿区域执行短时通风，降低棚内相对湿度。",
          "如病斑扩展明显，可使用三唑酮类药剂进行局部喷施。",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1592841200221-5d4f4b8d01df?auto=format&fit=crop&w=1200&q=80",
      });
    }, 2000);
  });
};

export default function CropDiagnosisPage() {
  const farmId = useUserStore((state) => state.farmId);
  const displayName = useUserStore((state) => state.displayName);

  const [viewMode, setViewMode] = useState<"list" | "flow">("list");
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const progressTimer = useRef<number | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm] = Form.useForm();
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadRecords = async () => {
    setRecordsLoading(true);
    const data = await fetchDiagnosisRecords();
    setRecords(data);
    setRecordsLoading(false);
  };

  useEffect(() => {
    if (viewMode === "list") {
      void loadRecords();
    }
  }, [viewMode]);

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const startNewDiagnosis = () => {
    resetFlow();
    setViewMode("flow");
  };

  const backToList = () => {
    resetFlow();
    setViewMode("list");
  };

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewImage(url);
      }
    } else {
      setPreviewImage(null);
    }
  };

  const startAiDiagnosis = async () => {
    if (!previewImage) {
      message.warning("请先上传作物图片");
      return;
    }
    setCurrentStep(1);
    setAiLoading(true);
    setAiProgress(0);

    progressTimer.current = window.setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 95) {
          clearProgressTimer();
          return 95;
        }
        return prev + Math.floor(Math.random() * 12) + 3;
      });
    }, 200);

    const result = await mockAiAnalyze(fileList[0]?.name || "crop.jpg");
    clearProgressTimer();
    setAiProgress(100);
    setAiResult(result);
    setAiLoading(false);
  };

  const submitForExpertReview = async () => {
    if (!aiResult || !previewImage) return;
    setSubmitLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const recordId = `diag-${Date.now()}`;
    addDiagnosisRecord({
      id: recordId,
      farmId: farmId ?? 1001,
      imageUrl: previewImage,
      fileName: fileList[0]?.name || "crop.jpg",
      createdAt: new Date().toLocaleString("zh-CN"),
      status: "pending_review",
      aiResult: {
        disease: aiResult.disease,
        confidence: aiResult.confidence,
        severity: aiResult.severity,
        suggestions: aiResult.suggestions,
      },
    });

    setSubmitLoading(false);
    setCurrentStep(2);
    message.success("已提交专家复核");
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setFileList([]);
    setPreviewImage(null);
    setAiLoading(false);
    setAiProgress(0);
    setAiResult(null);
    setSubmitLoading(false);
    clearProgressTimer();
  };

  const openDetail = (record: DiagnosisRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const openReview = (record: DiagnosisRecord) => {
    setSelectedRecord(record);
    reviewForm.resetFields();
    reviewForm.setFieldsValue({ decision: "CONFIRMED" });
    setReviewOpen(true);
  };

  const handleReviewSubmit = async (values: {
    decision: "CONFIRMED" | "REJECTED";
    advice: string;
  }) => {
    if (!selectedRecord) return;
    setReviewSubmitting(true);
    try {
      await submitExpertReviewForRecord(selectedRecord.id, {
        ...values,
        expertName: displayName || "专家",
      });
      message.success("复核提交成功");
      setReviewOpen(false);
      await loadRecords();
    } finally {
      setReviewSubmitting(false);
    }
  };

  const columns: TableColumnsType<DiagnosisRecord> = [
    {
      title: "图片",
      dataIndex: "imageUrl",
      width: 120,
      render: (url: string) => (
        <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <img src={url} alt="crop" className="h-full w-full object-cover" />
        </div>
      ),
    },
    {
      title: "文件名",
      dataIndex: "fileName",
      ellipsis: true,
    },
    {
      title: "AI 诊断",
      dataIndex: ["aiResult", "disease"],
      render: (_text: string, record) =>
        record.aiResult ? (
          <div>
            <p className="font-medium">{record.aiResult.disease}</p>
            <p className="text-xs text-slate-500">置信度 {(record.aiResult.confidence * 100).toFixed(1)}%</p>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: DiagnosisRecord["status"]) => {
        const cfg = statusMap[status];
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            详情
          </Button>
          {record.status === "pending_review" && (
            <Button type="primary" size="small" icon={<UserOutlined />} onClick={() => openReview(record)}>
              专家复核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!farmId) {
    return <Empty description="请选择农场后再使用作物智能诊断。" />;
  }

  const listView = (
    <div className="space-y-5">
      <AppCard
        title="智能诊断记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={startNewDiagnosis}>
            发起新诊断
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={recordsLoading}
          pagination={{ pageSize: 10 }}
        />
      </AppCard>
    </div>
  );

  const uploadContent = (
    <div className="mx-auto max-w-3xl">
      <AppCard title="上传作物图片">
        <div className="flex flex-col items-center gap-6 py-6">
          <Upload.Dragger
            name="file"
            multiple={false}
            accept="image/*"
            fileList={fileList}
            beforeUpload={() => false}
            onChange={handleUploadChange}
            maxCount={1}
            className="w-full"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined className="text-4xl text-emerald-500" />
            </p>
            <p className="ant-upload-text text-base font-medium">点击或拖拽图片到此处上传</p>
            <p className="ant-upload-hint text-slate-500">支持 JPG、PNG 格式，单张图片不超过 10MB</p>
          </Upload.Dragger>

          {previewImage && (
            <div className="w-full">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">图片预览</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <img src={previewImage} alt="preview" className="max-h-[320px] w-full object-contain" />
              </div>
            </div>
          )}

          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            onClick={startAiDiagnosis}
            disabled={!previewImage}
            className="min-w-[180px]"
          >
            开始 AI 诊断
          </Button>
        </div>
      </AppCard>
    </div>
  );

  const aiAnalysisContent = (
    <div className="mx-auto max-w-4xl space-y-5">
      {aiLoading && (
        <AppCard title="AI 分析中">
          <div className="py-8 text-center">
            <RobotOutlined className="mb-4 text-5xl text-emerald-500" />
            <p className="mb-4 text-lg font-medium">AI 正在分析作物图片，请稍候...</p>
            <Progress
              percent={aiProgress}
              status="active"
              strokeColor={{ from: "#12b76a", to: "#1fb6ff" }}
              className="max-w-md mx-auto"
            />
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p>正在提取叶片特征...</p>
              <p>正在比对病害模型库...</p>
              <p>正在生成诊断建议...</p>
            </div>
          </div>
        </AppCard>
      )}

      {!aiLoading && aiResult && (
        <>
          <AppCard
            title="AI 初步判断结果"
            extra={
              <Tag color="success" className="text-sm">
                分析完成
              </Tag>
            }
          >
            <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <img
                  src={previewImage || aiResult.imageUrl}
                  alt="crop"
                  className="h-full max-h-[300px] w-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MedicineBoxOutlined className="text-xl text-rose-500" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">病害识别</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{aiResult.disease}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleOutlined className="text-xl text-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">AI 置信度</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {(aiResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileImageOutlined className="text-xl text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">严重程度</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{aiResult.severity}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">AI 建议</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-400">
                    {aiResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AppCard>

          <div className="flex justify-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(0)} size="large">
              返回修改图片
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<UserOutlined />}
              onClick={submitForExpertReview}
              loading={submitLoading}
            >
              提交专家复核
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const submittedContent = (
    <div className="mx-auto max-w-3xl">
      <AppCard title="复核提交成功">
        <div className="py-10 text-center">
          <CheckCircleOutlined className="mb-4 text-5xl text-emerald-500" />
          <p className="text-lg font-medium">已提交专家复核</p>
          <p className="mt-2 text-sm text-slate-500">
            农业专家将在 1-3 个工作日内完成复核，您可以在下方记录列表中查看进度与结果。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button icon={<ReloadOutlined />} onClick={startNewDiagnosis} size="large">
              发起新的诊断
            </Button>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={backToList} size="large">
              返回记录列表
            </Button>
          </div>
        </div>
      </AppCard>
    </div>
  );

  return (
    <div className="space-y-5">
      {viewMode === "list" && listView}

      {viewMode === "flow" && (
        <>
          <AppCard className="!py-4">
            <Steps current={currentStep} size="default" className="max-w-4xl mx-auto">
              <Step
                title="农户上传作物图片"
                icon={<CloudUploadOutlined />}
                description="上传清晰的叶片或植株照片"
              />
              <Step
                title="AI 初步判断"
                icon={<RobotOutlined />}
                description="AI 自动识别病害并给出建议"
              />
              <Step
                title="专家提供复审"
                icon={<UserOutlined />}
                description="农业专家复核并确认处置方案"
              />
            </Steps>
          </AppCard>

          <div className="flex justify-start px-1">
            <Button icon={<ArrowLeftOutlined />} onClick={backToList}>
              返回记录列表
            </Button>
          </div>

          {currentStep === 0 && uploadContent}
          {currentStep === 1 && aiAnalysisContent}
          {currentStep === 2 && submittedContent}
        </>
      )}

      <Modal open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} title="诊断详情" width={720}>
        {selectedRecord && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <img
                src={selectedRecord.imageUrl}
                alt="crop"
                className="max-h-[280px] w-full object-contain"
              />
            </div>

            <Card title="基本信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="记录 ID">{selectedRecord.id}</Descriptions.Item>
                <Descriptions.Item label="文件名">{selectedRecord.fileName}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{selectedRecord.createdAt}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={statusMap[selectedRecord.status].color}>{statusMap[selectedRecord.status].label}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedRecord.aiResult && (
              <Card title="AI 分析结果" size="small">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="病害识别">{selectedRecord.aiResult.disease}</Descriptions.Item>
                  <Descriptions.Item label="置信度">
                    {(selectedRecord.aiResult.confidence * 100).toFixed(1)}%
                  </Descriptions.Item>
                  <Descriptions.Item label="严重程度">{selectedRecord.aiResult.severity}</Descriptions.Item>
                </Descriptions>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                  <p className="mb-1 text-sm font-medium">AI 建议</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-400">
                    {selectedRecord.aiResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {selectedRecord.expertResult ? (
              <Card title="专家复核结果" size="small">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="复核结论">
                    <Tag color={selectedRecord.expertResult.decision === "CONFIRMED" ? "success" : "warning"}>
                      {selectedRecord.expertResult.decision === "CONFIRMED" ? "确认" : "需复查"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="复核专家">{selectedRecord.expertResult.expertName}</Descriptions.Item>
                  <Descriptions.Item label="复核时间">{selectedRecord.expertResult.reviewedAt}</Descriptions.Item>
                </Descriptions>
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <p className="mb-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">专家意见</p>
                  <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-200">
                    {selectedRecord.expertResult.advice}
                  </p>
                </div>
              </Card>
            ) : (
              <Card title="专家复核结果" size="small">
                <Empty description="暂无专家复核结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                {selectedRecord.status === "pending_review" && (
                  <div className="mt-3 text-center">
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      onClick={() => {
                        setDetailOpen(false);
                        openReview(selectedRecord);
                      }}
                    >
                      立即复核
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal open={reviewOpen} onCancel={() => setReviewOpen(false)} title="专家复核" width={560} footer={null}>
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <img src={selectedRecord.imageUrl} alt="crop" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm text-slate-500">AI 诊断</p>
                <p className="font-medium">{selectedRecord.aiResult?.disease || "-"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  置信度 {selectedRecord.aiResult ? (selectedRecord.aiResult.confidence * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
              <Form.Item label="复核结论" name="decision" rules={[{ required: true, message: "请选择复核结论" }]}>
                <Radio.Group>
                  <Radio value="CONFIRMED">确认 AI 诊断</Radio>
                  <Radio value="REJECTED">驳回 / 需复查</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="复核意见" name="advice" rules={[{ required: true, message: "请填写复核意见" }]}>
                <Input.TextArea rows={4} placeholder="请输入专家建议与处置方案" />
              </Form.Item>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setReviewOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={reviewSubmitting}>
                  提交复核
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
