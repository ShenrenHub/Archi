import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select, Table } from "antd";
import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { createCommand, fetchCommands, submitReceipt, type CommandItem, type CreateCommandPayload, type ReceiptPayload } from "@/api/control";
import { fetchDevices, type DeviceItem } from "@/api/device";
import { fetchGreenhouses, type GreenhouseItem } from "@/api/farm";
import { AppCard } from "@/components/common/AppCard";
import { MqttStatusLight } from "@/components/device/MqttStatusLight";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

export default function DeviceControlPage() {
  const farmId = useUserStore((state) => state.farmId);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [greenhouses, setGreenhouses] = useState<GreenhouseItem[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [commandLoading, setCommandLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commandForm] = Form.useForm<CreateCommandPayload>();
  const [receiptForm] = Form.useForm<ReceiptPayload>();
  const { state, latency } = useMqttBridge(farmId);

  const loadData = useCallback(async () => {
    if (!farmId) {
      return;
    }

    setRefreshing(true);
    try {
      const [deviceResponse, commandResponse, greenhouseResponse] = await Promise.all([
        fetchDevices(farmId),
        fetchCommands(farmId),
        fetchGreenhouses(farmId)
      ]);
      setDevices(deviceResponse);
      setCommands(commandResponse);
      setGreenhouses(greenhouseResponse);
    } finally {
      setRefreshing(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateCommand = async (values: CreateCommandPayload) => {
    setCommandLoading(true);
    try {
      await createCommand(values);
      commandForm.setFieldsValue({
        ...values,
        idempotencyKey: `cmd-${Date.now()}`
      });
      await loadData();
    } finally {
      setCommandLoading(false);
    }
  };

  const handleQuickCommand = async (device: DeviceItem, commandCode: string) => {
    if (!farmId || !device.greenhouseId) {
      return;
    }

    await handleCreateCommand({
      farmId,
      greenhouseId: device.greenhouseId,
      deviceId: device.id,
      idempotencyKey: `cmd-${device.id}-${Date.now()}`,
      commandCode,
      commandPayload: "{}"
    });
  };

  const handleSubmitReceipt = async (values: ReceiptPayload) => {
    setReceiptLoading(true);
    try {
      await submitReceipt(values);
      receiptForm.resetFields();
      await loadData();
    } finally {
      setReceiptLoading(false);
    }
  };

  if (!farmId) {
    return <Empty description="请选择农场后再下发控制命令。" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <AppCard title="控制链路状态" extra={<Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void loadData()}>刷新</Button>}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">JWT + 控制命令联调</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                当前页面对接 `/api/control/commands`、`/api/control/receipts` 和 `/api/devices`。
              </p>
              <div className="mt-4"><MqttStatusLight state={state} latency={latency} /></div>
            </div>
            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-400">当前 farmId</p>
              <p className="mt-3 text-4xl font-semibold">{farmId}</p>
              <p className="mt-3 text-sm text-slate-300">可用设备 {devices.length} 台，命令记录 {commands.length} 条。</p>
            </div>
          </div>
        </AppCard>

        <AppCard title="设备清单与快捷控制" className="min-h-0 overflow-hidden">
          <Table
            rowKey="id"
            dataSource={devices}
            pagination={false}
            scroll={{ y: 360 }}
            columns={[
              { title: "设备", dataIndex: "deviceName" },
              { title: "编码", dataIndex: "deviceCode" },
              { title: "协议", dataIndex: "protocolType" },
              { title: "状态", dataIndex: "onlineStatus" },
              {
                title: "快捷操作",
                render: (_, record) => (
                  <div className="flex gap-2">
                    <Button size="small" onClick={() => void handleQuickCommand(record, "TURN_ON")} disabled={!record.greenhouseId}>开启</Button>
                    <Button size="small" onClick={() => void handleQuickCommand(record, "TURN_OFF")} disabled={!record.greenhouseId}>关闭</Button>
                  </div>
                )
              }
            ]}
          />
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard title="下发控制命令">
          <Form
            form={commandForm}
            layout="vertical"
            onFinish={(values) => void handleCreateCommand(values)}
            initialValues={{ farmId, commandCode: "TURN_ON", commandPayload: "{}", idempotencyKey: `cmd-${Date.now()}` }}
          >
            <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
            <Form.Item label="目标大棚" name="greenhouseId" rules={[{ required: true, message: "请选择大棚" }]}>
              <Select options={greenhouses.map((item) => ({ label: `${item.greenhouseName} (${item.id})`, value: item.id }))} />
            </Form.Item>
            <Form.Item label="目标设备" name="deviceId" rules={[{ required: true, message: "请选择设备" }]}>
              <Select options={devices.map((item) => ({ label: `${item.deviceName} (${item.id})`, value: item.id }))} />
            </Form.Item>
            <Form.Item label="幂等键" name="idempotencyKey" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="命令码" name="commandCode" rules={[{ required: true }]}>
              <Select options={["TURN_ON", "TURN_OFF", "SET_TARGET", "OPEN_VENT"].map((value) => ({ label: value, value }))} />
            </Form.Item>
            <Form.Item label="命令载荷(JSON 字符串)" name="commandPayload" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={commandLoading}>下发命令</Button>
          </Form>
        </AppCard>

        <AppCard title="写入控制回执">
          <Form form={receiptForm} layout="vertical" onFinish={(values) => void handleSubmitReceipt(values)} initialValues={{ farmId, resultCode: "SUCCESS", rawPayload: '{"code":"SUCCESS"}' }}>
            <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
            <Form.Item label="命令 ID" name="commandId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="设备 ID" name="deviceId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="结果码" name="resultCode" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="结果说明" name="resultMessage" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="原始载荷" name="rawPayload" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
            <Button htmlType="submit" loading={receiptLoading}>提交回执</Button>
          </Form>
        </AppCard>

        <AppCard title="控制命令列表" className="min-h-0 overflow-hidden">
          <Table
            rowKey="id"
            dataSource={commands}
            pagination={false}
            scroll={{ y: 280 }}
            columns={[
              { title: "命令 ID", dataIndex: "id" },
              { title: "设备", dataIndex: "deviceId" },
              { title: "命令", dataIndex: "commandCode" },
              { title: "状态", dataIndex: "commandStatus" },
              { title: "请求时间", render: (_, record) => formatDateTime(record.requestedAt) },
              { title: "完成时间", render: (_, record) => (record.completedAt ? formatDateTime(record.completedAt) : "-") }
            ]}
          />
        </AppCard>
      </div>
    </div>
  );
}


