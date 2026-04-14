import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Form, Input, List, Tag, message } from "antd";
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import {
  fetchExpertReviewTasks,
  submitExpertReview
} from "@/api/vision";
import type { ExpertReviewTask } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { formatDateTime } from "@/utils/time";

interface ReviewFormValues {
  suggestion: string;
}

export default function ExpertReviewPage() {
  const [form] = Form.useForm<ReviewFormValues>();
  const [tasks, setTasks] = useState<ExpertReviewTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchExpertReviewTasks().then((response) => {
      setTasks(response);
      if (response.length > 0) {
        setSelectedTaskId(response[0].id);
      }
    });
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((item) => item.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  useEffect(() => {
    form.setFieldsValue({
      suggestion: selectedTask?.expertSuggestion ?? ""
    });
  }, [form, selectedTask]);

  const handleSubmit = async (conclusion: "confirmed" | "needs_recheck") => {
    if (!selectedTask) {
      return;
    }

    const values = await form.validateFields();
    setSubmitting(true);

    try {
      const updatedTask = await submitExpertReview({
        taskId: selectedTask.id,
        suggestion: values.suggestion,
        conclusion
      });

      setTasks((current) =>
        current.map((item) => (item.id === updatedTask.id ? updatedTask : item))
      );
      message.success("专家复核意见已提交");
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:h-full lg:min-h-0 xl:grid-cols-[0.86fr_1.14fr]">
      <AppCard title="待复核任务" className="lg:min-h-0 lg:overflow-hidden">
        <div className="lg:h-full lg:overflow-y-auto lg:pr-1">
          <List
            dataSource={tasks}
            renderItem={(item) => (
              <List.Item className="!px-0">
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(item.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    item.id === selectedTaskId
                      ? "border-brand-500/50 bg-brand-500/10"
                      : "border-white/10 bg-white/60 hover:bg-white/80 dark:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {item.greenhouseName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                        {item.cropName}
                      </p>
                    </div>
                    <Tag color={item.priority === "high" ? "red" : item.priority === "medium" ? "orange" : "blue"}>
                      {item.priority === "high" ? "高优先级" : item.priority === "medium" ? "中优先级" : "低优先级"}
                    </Tag>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.issue}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Tag color={item.status === "reviewed" ? "green" : "gold"}>
                      {item.status === "reviewed" ? "已复核" : "待复核"}
                    </Tag>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              </List.Item>
            )}
          />
        </div>
      </AppCard>

      <AppCard title="专家复核工作台" className="lg:min-h-0 lg:overflow-hidden">
        {selectedTask ? (
          <div className="grid gap-4 lg:h-full lg:min-h-0 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
                <p className="text-sm text-slate-300">AI 初判</p>
                <h3 className="mt-3 text-2xl font-semibold">{selectedTask.disease}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{selectedTask.aiSummary}</p>
                <p className="mt-3 text-xs text-slate-400">
                  置信度 {selectedTask.confidence}% / 任务号 {selectedTask.id}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/60 p-4 dark:bg-white/5">
                <img
                  src={selectedTask.imageUrl}
                  alt={selectedTask.issue}
                  className="h-[220px] w-full rounded-[20px] object-cover"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[20px] bg-white/60 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-300">大棚</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{selectedTask.greenhouseName}</p>
              </div>
              <div className="rounded-[20px] bg-white/60 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-300">作物</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{selectedTask.cropName}</p>
              </div>
              <div className="rounded-[20px] bg-white/60 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-300">异常描述</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{selectedTask.issue}</p>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto pr-1">
              <Form form={form} layout="vertical">
                <Form.Item
                  label="专家建议"
                  name="suggestion"
                  rules={[{ required: true, message: "请填写复核意见" }]}
                >
                  <Input.TextArea
                    rows={6}
                    placeholder="例如：病斑范围仍较局部，建议先控湿并补拍叶背近景，24 小时后复查。"
                  />
                </Form.Item>
              </Form>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={submitting}
                  onClick={() => void handleSubmit("confirmed")}
                >
                  确认 AI 结果
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  loading={submitting}
                  onClick={() => void handleSubmit("needs_recheck")}
                >
                  要求补拍复查
                </Button>
              </div>

              {selectedTask.status === "reviewed" ? (
                <div className="mt-4 rounded-[20px] border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  最近一次复核时间：{selectedTask.reviewedAt ? formatDateTime(selectedTask.reviewedAt) : "-"}
                  <br />
                  已提交建议：{selectedTask.expertSuggestion ?? "无"}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Empty description="暂无待复核任务" />
          </div>
        )}
      </AppCard>
    </div>
  );
}

