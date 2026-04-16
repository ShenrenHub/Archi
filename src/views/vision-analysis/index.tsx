import { useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select } from "antd";
import { submitVisionTaskCallback, type VisionTaskCallbackPayload } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";

export default function VisionAnalysisPage() {
  const farmId = useUserStore((state) => state.farmId);
  const [form] = Form.useForm<VisionTaskCallbackPayload>();
  const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<number | null>(null);

  const handleSubmit = async (values: VisionTaskCallbackPayload) => {
    setSubmitting(true);
    try {
      const id = await submitVisionTaskCallback(values);
      setResultId(id);
    } finally {
      setSubmitting(false);
    }
  };

  if (!farmId) {
    return <Empty description="请选择农场后再写回视觉结果。" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <AppCard title="AI 结果回调写回">
        <Form form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)} initialValues={{ farmId, abnormalFlag: 1, confidenceScore: 0.92, resultJson: '{"severity":"HIGH"}' }}>
          <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
          <Form.Item label="任务 ID" name="taskId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
          <Form.Item label="识别标签" name="resultLabel" rules={[{ required: true }]}><Input placeholder="powdery_mildew" /></Form.Item>
          <Form.Item label="置信度" name="confidenceScore" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} max={1} step={0.01} /></Form.Item>
          <Form.Item label="是否异常" name="abnormalFlag" rules={[{ required: true }]}><Select options={[{ label: "异常", value: 1 }, { label: "正常", value: 0 }]} /></Form.Item>
          <Form.Item label="结果 JSON" name="resultJson" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>提交回调</Button>
        </Form>
      </AppCard>

      <AppCard title="对接说明">
        <div className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <p>这里对接的是 `PATCH /api/vision/tasks/callback`，更偏向 AI 适配器或平台回调能力。</p>
          <p>提交成功后，后端会返回结果记录 ID，后续专家复核页面需要使用这个 `resultId`。</p>
          {resultId ? <p className="rounded-[20px] bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">最近写回成功的结果记录 ID：{resultId}</p> : null}
        </div>
      </AppCard>
    </div>
  );
}
