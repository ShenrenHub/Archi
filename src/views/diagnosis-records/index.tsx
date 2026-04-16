import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  message,
  type TableColumnsType,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AppCard } from "@/components/common/AppCard";
import {
  fetchDiagnosisRecords,
  submitExpertReviewForRecord,
  type DiagnosisRecord,
} from "@/api/diagnosis";
import { useUserStore } from "@/store/user";

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

export default function DiagnosisRecordsPage() {
  const farmId = useUserStore((state) => state.farmId);
  const displayName = useUserStore((state) => state.displayName);
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm] = Form.useForm();
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    const data = await fetchDiagnosisRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadRecords();
  }, []);

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

  const handleReviewSubmit = async (values: { decision: "CONFIRMED" | "REJECTED"; advice: string }) => {
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
      render: (text: string, record) =>
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
    return <Empty description="请选择农场后再查看智能诊断记录。" />;
  }

  return (
    <div className="space-y-5">
      <AppCard title="智能诊断记录列表" extra={<Button onClick={loadRecords}>刷新</Button>}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </AppCard>

      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        title="诊断详情"
        width={720}
      >
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
                    <Button type="primary" icon={<UserOutlined />} onClick={() => { setDetailOpen(false); openReview(selectedRecord); }}>
                      立即复核
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        title="专家复核"
        width={560}
        footer={null}
      >
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
              <Form.Item
                label="复核结论"
                name="decision"
                rules={[{ required: true, message: "请选择复核结论" }]}
              >
                <Radio.Group>
                  <Radio value="CONFIRMED">确认 AI 诊断</Radio>
                  <Radio value="REJECTED">驳回 / 需复查</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="复核意见"
                name="advice"
                rules={[{ required: true, message: "请填写复核意见" }]}
              >
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
