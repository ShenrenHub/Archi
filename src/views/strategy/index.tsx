import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Table,
  Tag,
  TimePicker
} from "antd";
import type { Dayjs } from "dayjs";
import { createStrategyRule, fetchStrategyOverview } from "@/api/strategy";
import type { StrategyLogItem, StrategyRule } from "@/api/strategy";
import { AppCard } from "@/components/common/AppCard";
import { formatDateTime } from "@/utils/time";

interface StrategyFormValues {
  name: string;
  timeRange: [Dayjs, Dayjs];
  lowLight: number;
  highHumidity: number;
  action: string;
}

export default function StrategyPage() {
  const [form] = Form.useForm<StrategyFormValues>();
  const [rules, setRules] = useState<StrategyRule[]>([]);
  const [logs, setLogs] = useState<StrategyLogItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadOverview = async () => {
    const response = await fetchStrategyOverview();
    setRules(response.rules);
    setLogs(response.logs);
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleSubmit = async (values: StrategyFormValues) => {
    setSubmitting(true);
    try {
      const nextRule = await createStrategyRule({
        name: values.name,
        timeRange: [values.timeRange[0].format("HH:mm"), values.timeRange[1].format("HH:mm")],
        lowLight: values.lowLight,
        highHumidity: values.highHumidity,
        action: values.action
      });
      setRules((current) => [nextRule, ...current]);
      message.success("联动策略已创建");
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
      <AppCard title="新建联动策略">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleSubmit(values)}
          initialValues={{
            lowLight: 1600,
            highHumidity: 78,
            action: "开启通风电机"
          }}
        >
          <Form.Item label="策略名称" name="name" rules={[{ required: true, message: "请输入策略名称" }]}>
            <Input placeholder="例如：夜间高湿排风" />
          </Form.Item>

          <Form.Item label="时间区间" name="timeRange" rules={[{ required: true, message: "请选择时间区间" }]}>
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="低光照阈值" name="lowLight" rules={[{ required: true }]}>
              <InputNumber className="!w-full" addonAfter="Lux" min={500} max={5000} />
            </Form.Item>
            <Form.Item label="高湿度阈值" name="highHumidity" rules={[{ required: true }]}>
              <InputNumber className="!w-full" addonAfter="%" min={40} max={95} />
            </Form.Item>
          </div>

          <Form.Item label="触发动作" name="action" rules={[{ required: true, message: "请选择动作" }]}>
            <Select
              options={[
                { label: "开启通风电机", value: "开启通风电机" },
                { label: "开启补光灯", value: "开启补光灯" },
                { label: "发送专家预警", value: "发送专家预警" }
              ]}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={submitting}>
            保存并启用策略
          </Button>
        </Form>
      </AppCard>

      <div className="space-y-4">
        <AppCard title="策略任务列表">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={rules}
            columns={[
              {
                title: "规则名",
                dataIndex: "name"
              },
              {
                title: "时间段",
                render: (_, record) => `${record.timeRange[0]} - ${record.timeRange[1]}`
              },
              {
                title: "触发动作",
                dataIndex: "action"
              },
              {
                title: "状态",
                render: (_, record) => (
                  <Tag color={record.enabled ? "green" : "default"}>
                    {record.enabled ? "启用中" : "已停用"}
                  </Tag>
                )
              }
            ]}
          />
        </AppCard>

        <AppCard title="执行日志">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={logs}
            columns={[
              {
                title: "策略",
                dataIndex: "strategyName"
              },
              {
                title: "结果",
                render: (_, record) => (
                  <Tag color={record.result === "success" ? "green" : "orange"}>
                    {record.result === "success" ? "成功" : "告警"}
                  </Tag>
                )
              },
              {
                title: "详情",
                dataIndex: "detail"
              },
              {
                title: "执行时间",
                render: (_, record) => formatDateTime(record.executedAt)
              }
            ]}
          />
        </AppCard>
      </div>
    </div>
  );
}
