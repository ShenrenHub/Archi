import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select, Table, Tabs } from "antd";
import { createPlatformConfig, fetchPlatformConfigs, type CreatePlatformConfigPayload, type PlatformConfigItem } from "@/api/admin";
import { bindDevice, fetchDevices, registerDevice, type BindDevicePayload, type DeviceItem, type RegisterDevicePayload } from "@/api/device";
import { createFarm, createGreenhouse, fetchGreenhouses, fetchMyFarms, type CreateFarmPayload, type CreateGreenhousePayload, type GreenhouseItem } from "@/api/farm";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

export default function AdminPage() {
  const farmId = useUserStore((state) => state.farmId);
  const setFarms = useUserStore((state) => state.setFarms);
  const farms = useUserStore((state) => state.farms);
  const [greenhouses, setGreenhouses] = useState<GreenhouseItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [configs, setConfigs] = useState<PlatformConfigItem[]>([]);
  const [farmForm] = Form.useForm<CreateFarmPayload>();
  const [greenhouseForm] = Form.useForm<CreateGreenhousePayload>();
  const [deviceForm] = Form.useForm<RegisterDevicePayload>();
  const [bindForm] = Form.useForm<BindDevicePayload>();
  const [configForm] = Form.useForm<CreatePlatformConfigPayload>();
  const [submitting, setSubmitting] = useState<string>("");

  const loadData = useCallback(async () => {
    const farmsResponse = await fetchMyFarms().catch(() => []);
    setFarms(farmsResponse);

    if (!farmId) {
      return;
    }

    const [greenhousesResponse, devicesResponse, configsResponse] = await Promise.all([
      fetchGreenhouses(farmId),
      fetchDevices(farmId),
      fetchPlatformConfigs().catch(() => [])
    ]);

    setGreenhouses(greenhousesResponse);
    setDevices(devicesResponse);
    setConfigs(configsResponse);
  }, [farmId, setFarms]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runSubmit = async (key: string, fn: () => Promise<void>) => {
    setSubmitting(key);
    try {
      await fn();
      await loadData();
    } finally {
      setSubmitting("");
    }
  };

  if (!farmId && farms.length === 0) {
    return <Empty description="当前账号没有可见农场，请先创建或选择农场。" />;
  }

  return (
    <div className="expressive-page space-y-4">
      <AppCard variant="expressive" title="农场与平台 API 总控台">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
            <p className="text-sm text-slate-300">可见农场</p>
            <p className="mt-3 text-4xl font-semibold">{farms.length}</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-brand-500 to-emerald-700 p-5 text-white">
            <p className="text-sm text-emerald-50">当前大棚</p>
            <p className="mt-3 text-4xl font-semibold">{greenhouses.length}</p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-accent-500 to-sky-700 p-5 text-white">
            <p className="text-sm text-sky-50">设备资产</p>
            <p className="mt-3 text-4xl font-semibold">{devices.length}</p>
          </div>
        </div>
      </AppCard>

      <Tabs
        items={[
          {
            key: "farm",
            label: "农场与大棚",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <AppCard variant="expressive" title="创建农场 / 大棚">
                  <Form form={farmForm} layout="vertical" onFinish={(values) => void runSubmit("farm", async () => {
                    await createFarm(values);
                    farmForm.resetFields();
                  })}>
                    <Form.Item label="农场编码" name="farmCode" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="农场名称" name="farmName" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="负责人" name="ownerName" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="联系电话" name="contactPhone" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="区域编码" name="regionCode" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="地址" name="address" rules={[{ required: true }]}><Input /></Form.Item>
                    <Button htmlType="submit" type="primary" loading={submitting === "farm"}>创建农场</Button>
                  </Form>

                  <div className="my-4 border-t border-slate-200/70 dark:border-white/10" />

                  <Form form={greenhouseForm} layout="vertical" onFinish={(values) => void runSubmit("greenhouse", async () => {
                    await createGreenhouse(values);
                    greenhouseForm.resetFields();
                    greenhouseForm.setFieldsValue({ farmId: farmId ?? undefined, greenhouseType: "SOLAR" });
                  })} initialValues={{ farmId: farmId ?? undefined, greenhouseType: "SOLAR", areaSize: 180.5 }}>
                    <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
                    <Form.Item label="大棚编码" name="greenhouseCode" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="大棚名称" name="greenhouseName" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="类型" name="greenhouseType" rules={[{ required: true }]}><Select options={["SOLAR", "GLASS", "FILM"].map((value) => ({ label: value, value }))} /></Form.Item>
                    <Form.Item label="位置说明" name="locationDesc" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="面积" name="areaSize" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} /></Form.Item>
                    <Button htmlType="submit" loading={submitting === "greenhouse"}>创建大棚</Button>
                  </Form>
                </AppCard>

                <AppCard variant="expressive" title="当前农场与大棚">
                  <Table rowKey="id" dataSource={farms} pagination={false} columns={[{ title: "农场 ID", dataIndex: "id" }, { title: "编码", dataIndex: "farmCode" }, { title: "名称", dataIndex: "farmName" }, { title: "负责人", dataIndex: "ownerName" }]} />
                  <div className="mt-4" />
                  <Table rowKey="id" dataSource={greenhouses} pagination={false} columns={[{ title: "大棚 ID", dataIndex: "id" }, { title: "名称", dataIndex: "greenhouseName" }, { title: "编码", dataIndex: "greenhouseCode" }, { title: "类型", dataIndex: "greenhouseType" }]} />
                </AppCard>
              </div>
            )
          },
          {
            key: "device",
            label: "设备与绑定",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <AppCard variant="expressive" title="注册设备 / 绑定大棚">
                  <Form form={deviceForm} layout="vertical" onFinish={(values) => void runSubmit("device", async () => {
                    await registerDevice(values);
                    deviceForm.resetFields();
                    deviceForm.setFieldsValue({ farmId: farmId ?? undefined, protocolType: "HTTP", integrationMode: "DIRECT" });
                  })} initialValues={{ farmId: farmId ?? undefined, protocolType: "HTTP", integrationMode: "DIRECT" }}>
                    <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
                    <Form.Item label="大棚" name="greenhouseId" rules={[{ required: true }]}><Select options={greenhouses.map((item) => ({ label: `${item.greenhouseName} (${item.id})`, value: item.id }))} /></Form.Item>
                    <Form.Item label="设备类型 ID" name="deviceTypeId" rules={[{ required: true }]}><InputNumber className="!w-full" /></Form.Item>
                    <Form.Item label="设备编码" name="deviceCode" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="设备名称" name="deviceName" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="协议" name="protocolType" rules={[{ required: true }]}><Select options={["HTTP", "MQTT"].map((value) => ({ label: value, value }))} /></Form.Item>
                    <Form.Item label="接入模式" name="integrationMode" rules={[{ required: true }]}><Select options={["DIRECT", "GATEWAY"].map((value) => ({ label: value, value }))} /></Form.Item>
                    <Button htmlType="submit" type="primary" loading={submitting === "device"}>注册设备</Button>
                  </Form>

                  <div className="my-4 border-t border-slate-200/70 dark:border-white/10" />

                  <Form form={bindForm} layout="vertical" onFinish={(values) => void runSubmit("bind", async () => {
                    await bindDevice(values);
                    bindForm.resetFields();
                    bindForm.setFieldsValue({ farmId: farmId ?? undefined });
                  })} initialValues={{ farmId: farmId ?? undefined }}>
                    <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
                    <Form.Item label="设备" name="deviceId" rules={[{ required: true }]}>
                      <Select options={devices.map((item) => ({ label: `${item.deviceName} / ${item.deviceCode}`, value: item.id }))} />
                    </Form.Item>
                    <Form.Item label="目标大棚" name="greenhouseId" rules={[{ required: true }]}><Select options={greenhouses.map((item) => ({ label: `${item.greenhouseName} (${item.id})`, value: item.id }))} /></Form.Item>
                    <Button htmlType="submit" loading={submitting === "bind"}>绑定设备</Button>
                  </Form>
                </AppCard>

                <AppCard variant="expressive" title="设备列表">
                  <Table rowKey="id" dataSource={devices} pagination={false} scroll={{ y: 420 }} columns={[{ title: "名称", dataIndex: "deviceName" }, { title: "编码", dataIndex: "deviceCode" }, { title: "大棚", dataIndex: "greenhouseId" }, { title: "协议", dataIndex: "protocolType" }, { title: "在线状态", dataIndex: "onlineStatus" }]} />
                </AppCard>
              </div>
            )
          },
          {
            key: "config",
            label: "平台配置",
            children: (
              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <AppCard variant="expressive" title="写入平台配置">
                  <Form form={configForm} layout="vertical" onFinish={(values) => void runSubmit("config", async () => {
                    await createPlatformConfig(values);
                    configForm.resetFields();
                    configForm.setFieldsValue({ configScope: "GLOBAL" });
                  })} initialValues={{ configScope: "GLOBAL" }}>
                    <Form.Item label="配置 Key" name="configKey" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="配置 Value" name="configValue" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item label="配置范围" name="configScope" rules={[{ required: true }]}><Select options={["GLOBAL", "FARM"].map((value) => ({ label: value, value }))} /></Form.Item>
                    <Form.Item label="备注" name="configRemark" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
                    <Button htmlType="submit" type="primary" loading={submitting === "config"}>保存配置</Button>
                  </Form>
                </AppCard>

                <AppCard variant="expressive" title="平台配置列表">
                  <Table rowKey="id" dataSource={configs} pagination={false} scroll={{ y: 420 }} columns={[{ title: "ID", dataIndex: "id" }, { title: "Key", dataIndex: "configKey" }, { title: "Value", dataIndex: "configValue" }, { title: "Scope", dataIndex: "configScope" }, { title: "更新时间", render: (_, record) => formatDateTime(record.updatedAt) }]} />
                </AppCard>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
