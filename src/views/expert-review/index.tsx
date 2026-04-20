import { useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select } from "antd";
import { submitVisionReview, type VisionReviewPayload } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";

export default function ExpertReviewPage() {
  const farmId = useUserStore((state) => state.farmId);
  const userId = useUserStore((state) => state.userId);
  const [form] = Form.useForm<VisionReviewPayload>();
  const [submitting, setSubmitting] = useState(false);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const handleSubmit = async (values: VisionReviewPayload) => {
    setSubmitting(true);
    try {
      const id = await submitVisionReview(values);
      setReviewId(id);
    } finally {
      setSubmitting(false);
    }
  };

  if (!farmId || !userId) {
    return <Empty description="当前账号缺少 farmId 或 userId，无法提交专家复核。" />;
  }

  return (
    <div className="expressive-page grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <AppCard variant="expressive" title="提交专家复核">
        <Form form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)} initialValues={{ farmId, expertUserId: userId, reviewDecision: "CONFIRMED" }}>
          <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
          <Form.Item label="结果记录 ID" name="resultId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
          <Form.Item label="专家用户 ID" name="expertUserId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
          <Form.Item label="复核结论" name="reviewDecision" rules={[{ required: true }]}>
            <Select options={[{ label: "确认", value: "CONFIRMED" }, { label: "驳回/需复查", value: "REJECTED" }]} />
          </Form.Item>
          <Form.Item label="复核意见" name="reviewAdvice" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="建议隔离病株并喷药" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>提交复核</Button>
        </Form>
      </AppCard>

      <AppCard variant="expressive" title="当前页面说明">
        <div className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>后端文档目前只提供“提交复核”接口，没有单独的复核任务查询接口，所以这里直接面向 `resultId` 提交复核。</p>
          <p>通常流程是：视觉任务创建 → AI 回调写回结果 → 专家在本页用结果记录 ID 提交复核意见。</p>
          {reviewId ? <p className="rounded-[20px] bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">最近一次复核记录 ID：{reviewId}</p> : null}
        </div>
      </AppCard>
    </div>
  );
}

