import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select, Table } from "antd";
import { createRule, fetchRules, type CreateRulePayload, type RuleItem } from "@/api/strategy";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

export default function StrategyPage() {
  const farmId = useUserStore((state) => state.farmId);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<CreateRulePayload>();

  const loadRules = useCallback(async () => {
    if (!farmId) {
      return;
    }

    setLoading(true);
    try {
      setRules(await fetchRules(farmId));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSubmit = async (values: CreateRulePayload) => {
    setSubmitting(true);
    try {
      await createRule(values);
      form.resetFields();
      form.setFieldsValue({ farmId: farmId ?? undefined, debounceSeconds: 60, triggerType: "THRESHOLD" });
      await loadRules();
    } finally {
      setSubmitting(false);
    }
  };

  if (!farmId) {
    return <Empty description="请选择农场后再配置联动规则。" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <AppCard title="创建联动规则">
        <Form form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)} initialValues={{ farmId: farmId ?? undefined, triggerType: "THRESHOLD", debounceSeconds: 60 }}>
          <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
          <Form.Item label="规则编码" name="ruleCode" rules={[{ required: true }]}><Input placeholder="TEMP_HIGH_AUTO_VENT" /></Form.Item>
          <Form.Item label="规则名称" name="ruleName" rules={[{ required: true }]}><Input placeholder="高温自动通风" /></Form.Item>
          <Form.Item label="触发类型" name="triggerType" rules={[{ required: true }]}>
            <Select options={["THRESHOLD", "CRON"].map((value) => ({ label: value, value }))} />
          </Form.Item>
          <Form.Item label="Cron 表达式" name="cronExpr"><Input placeholder="可为空" /></Form.Item>
          <Form.Item label="防抖秒数" name="debounceSeconds" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>保存规则</Button>
        </Form>
      </AppCard>

      <AppCard title="规则列表" className="min-h-0 overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rules}
          pagination={false}
          scroll={{ y: 420 }}
          columns={[
            { title: "规则编码", dataIndex: "ruleCode" },
            { title: "规则名称", dataIndex: "ruleName" },
            { title: "触发类型", dataIndex: "triggerType" },
            { title: "状态", dataIndex: "ruleStatus" },
            { title: "防抖", render: (_, record) => `${record.debounceSeconds}s` },
            { title: "更新时间", render: (_, record) => formatDateTime(record.updatedAt) }
          ]}
        />
      </AppCard>
    </div>
  );
}


