import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Form, Input, Select, Table, Tag, message } from "antd";
import { CameraOutlined, DeleteOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import {
  createManagedDevice,
  deleteManagedDevice,
  fetchAdminOverview
} from "@/api/admin";
import type {
  AdminAlertLogItem,
  AdminDeviceItem,
  AdminDeviceType,
  CreateManagedDeviceRequest
} from "@/api/admin";
import { AppCard } from "@/components/common/AppCard";
import { formatDateTime } from "@/utils/time";

export default function AdminPage() {
  const [form] = Form.useForm<CreateManagedDeviceRequest>();
  const [devices, setDevices] = useState<AdminDeviceItem[]>([]);
  const [alertLogs, setAlertLogs] = useState<AdminAlertLogItem[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    void fetchAdminOverview().then((response) => {
      setDevices(response.devices);
      setAlertLogs(response.alertLogs);
    });
  }, []);

  const deviceStats = useMemo(
    () => ({
      total: devices.length,
      online: devices.filter((item) => item.status === "online").length,
      cameras: devices.filter((item) => item.deviceType === "camera").length
    }),
    [devices]
  );

  const deviceTypeLabelMap: Record<AdminDeviceType, string> = {
    sensor: "传感器",
    light: "补光灯",
    fan: "通风电机",
    thermostat: "温控器",
    camera: "摄像头"
  };

  const alertSourceLabelMap: Record<string, string> = {
    "视觉告警": "画面巡检",
    "IoT 设备": "设备状态"
  };

  const handleDeleteDevice = async (record: AdminDeviceItem) => {
    setLoadingMap((current) => ({ ...current, [record.id]: true }));
    try {
      await deleteManagedDevice({ deviceId: record.id });
      setDevices((current) => current.filter((item) => item.id !== record.id));
      message.success("设备已移除，控制中心会同步隐藏对应入口");
    } finally {
      setLoadingMap((current) => ({ ...current, [record.id]: false }));
    }
  };

  const handleCreateDevice = async (values: CreateManagedDeviceRequest) => {
    const nextDevice = await createManagedDevice(values);
    setDevices((current) => [nextDevice, ...current]);
    setDrawerOpen(false);
    form.resetFields();
    message.success("设备已新增，若为控制类设备将自动进入控制中心");
  };

  return (
    <div className="grid gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <AppCard
        title="设备管理控制台"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            新增设备
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
            <p className="text-sm text-slate-300">设备总量</p>
            <p className="mt-3 text-4xl font-semibold">{deviceStats.total}</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-brand-500 to-emerald-700 p-5 text-white">
            <p className="text-sm text-emerald-50">在线设备</p>
            <p className="mt-3 text-4xl font-semibold">{deviceStats.online}</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-accent-500 to-sky-700 p-5 text-white">
            <p className="text-sm text-sky-50">摄像头设备</p>
            <p className="mt-3 text-4xl font-semibold">{deviceStats.cameras}</p>
          </div>
        </div>
      </AppCard>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[1.4fr_0.95fr]">
        <AppCard title="设备资产列表" className="lg:min-h-0 lg:overflow-hidden">
          <div className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {devices.map((record) => (
              <div
                key={record.id}
                className="rounded-[26px] border border-white/10 bg-white/60 p-5 dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 p-3 text-white">
                      {record.deviceType === "camera" ? <CameraOutlined /> : <ThunderboltOutlined />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{record.name}</h3>
                        <Tag
                          color={
                            record.status === "online"
                              ? "green"
                              : record.status === "pending"
                                ? "gold"
                                : "default"
                          }
                        >
                          {record.status === "online"
                            ? "在线"
                            : record.status === "pending"
                              ? "待接入"
                              : "离线"}
                        </Tag>
                        <Tag>{deviceTypeLabelMap[record.deviceType]}</Tag>
                        <Tag color="purple">{record.greenhouseName}</Tag>
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{record.deviceCode}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {record.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.capabilities.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-slate-900/5 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 xl:block">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      更新于 {formatDateTime(record.updatedAt)}
                    </span>
                    <div className="xl:mt-3">
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={Boolean(loadingMap[record.id])}
                        onClick={() => void handleDeleteDevice(record)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>

        <AppCard title="系统全量告警日志" className="lg:min-h-0 lg:overflow-hidden">
          <Table
            rowKey="id"
            dataSource={alertLogs}
            pagination={false}
            scroll={{ y: 420 }}
            columns={[
              {
                title: "级别",
                render: (_, record) => (
                  <Tag color={record.level === "high" ? "red" : record.level === "medium" ? "orange" : "blue"}>
                    {record.level}
                  </Tag>
                )
              },
              {
                title: "来源",
                render: (_, record) => alertSourceLabelMap[record.source] ?? record.source
              },
              { title: "告警内容", dataIndex: "message" },
              {
                title: "时间",
                render: (_, record) => formatDateTime(record.createdAt)
              }
            ]}
          />
        </AppCard>
      </div>

      <Drawer
        title="新增设备"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={460}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleCreateDevice(values)}
          initialValues={{
            protocol: "MQTT",
            deviceType: "sensor"
          }}
        >
          <Form.Item name="protocol" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="设备名称" name="name" rules={[{ required: true, message: "请输入设备名称" }]}>
            <Input placeholder="例如：四号棚补光灯" />
          </Form.Item>
          <Form.Item label="设备编码" name="deviceCode" rules={[{ required: true, message: "请输入设备编码" }]}>
            <Input placeholder="例如：CTRL-LIGHT-021" />
          </Form.Item>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item label="设备类型" name="deviceType" rules={[{ required: true }]}>
              <Select
                options={Object.entries(deviceTypeLabelMap).map(([value, label]) => ({
                  value,
                  label
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="所属大棚"
            name="greenhouseName"
            rules={[{ required: true, message: "请输入所属大棚" }]}
          >
            <Input placeholder="例如：四号育苗棚" />
          </Form.Item>
          <Form.Item
            label="设备描述"
            name="description"
            rules={[{ required: true, message: "请输入设备描述" }]}
          >
            <Input.TextArea rows={4} placeholder="描述该设备的用途、控制方式或采集能力" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存设备
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
