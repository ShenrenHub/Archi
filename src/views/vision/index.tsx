import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Form, Input, InputNumber, Select, Table } from "antd";
import { fetchAlerts, type AlertItem } from "@/api/alerts";
import { fetchGreenhouses, type GreenhouseItem } from "@/api/farm";
import { createCamera, createVisionTask, fetchCameras, type CameraItem, type CreateCameraPayload, type CreateVisionTaskPayload } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { CameraPlayer } from "@/components/vision/CameraPlayer";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/time";

export default function VisionPage() {
  const farmId = useUserStore((state) => state.farmId);
  const [greenhouses, setGreenhouses] = useState<GreenhouseItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [cameraForm] = Form.useForm<CreateCameraPayload>();
  const [taskForm] = Form.useForm<CreateVisionTaskPayload>();
  const [submittingCamera, setSubmittingCamera] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!farmId) {
      return;
    }

    const [greenhouseResponse, cameraResponse, alertResponse] = await Promise.all([
      fetchGreenhouses(farmId),
      fetchCameras(farmId),
      fetchAlerts(farmId, { limit: 100 })
    ]);

    setGreenhouses(greenhouseResponse);
    setCameras(cameraResponse);
    setAlerts(alertResponse);
  }, [farmId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateCamera = async (values: CreateCameraPayload) => {
    setSubmittingCamera(true);
    try {
      await createCamera(values);
      cameraForm.resetFields();
      cameraForm.setFieldsValue({ farmId: farmId ?? undefined, streamProtocol: "RTSP" });
      await loadData();
    } finally {
      setSubmittingCamera(false);
    }
  };

  const handleCreateTask = async (values: CreateVisionTaskPayload) => {
    setSubmittingTask(true);
    try {
      const taskId = await createVisionTask(values);
      setLastTaskId(taskId);
      await loadData();
    } finally {
      setSubmittingTask(false);
    }
  };

  if (!farmId) {
    return <Empty description="请选择农场后再管理摄像头和视觉任务。" />;
  }

  const firstCamera = cameras[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <CameraPlayer
          title={firstCamera ? firstCamera.cameraName : "摄像头预览占位"}
          streamProtocol={firstCamera?.streamProtocol}
          streamUrl={firstCamera?.streamUrl}
          playbackToken={firstCamera?.playbackToken}
        />

        <AppCard title="摄像头注册">
          <Form form={cameraForm} layout="vertical" onFinish={(values) => void handleCreateCamera(values)} initialValues={{ farmId: farmId ?? undefined, streamProtocol: "RTSP" }}>
            <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
            <Form.Item label="大棚" name="greenhouseId" rules={[{ required: true }]}>
              <Select options={greenhouses.map((item) => ({ label: `${item.greenhouseName} (${item.id})`, value: item.id }))} />
            </Form.Item>
            <Form.Item label="摄像头编码" name="cameraCode" rules={[{ required: true }]}><Input placeholder="CAM-01" /></Form.Item>
            <Form.Item label="摄像头名称" name="cameraName" rules={[{ required: true }]}><Input placeholder="东区摄像头" /></Form.Item>
            <Form.Item label="流协议" name="streamProtocol" rules={[{ required: true }]}><Select options={["RTSP", "HLS", "HTTP-FLV"].map((value) => ({ label: value, value }))} /></Form.Item>
            <Form.Item label="流地址" name="streamUrl" rules={[{ required: true }]}><Input placeholder="rtsp://example/live" /></Form.Item>
            <Button type="primary" htmlType="submit" loading={submittingCamera}>注册摄像头</Button>
          </Form>
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard title="创建视觉 AI 任务">
          <Form form={taskForm} layout="vertical" onFinish={(values) => void handleCreateTask(values)} initialValues={{ farmId: farmId ?? undefined, providerType: "MOCK", objectKey: `vision/${Date.now()}.jpg` }}>
            <Form.Item name="farmId" hidden><InputNumber /></Form.Item>
            <Form.Item label="大棚" name="greenhouseId" rules={[{ required: true }]}>
              <Select options={greenhouses.map((item) => ({ label: `${item.greenhouseName} (${item.id})`, value: item.id }))} />
            </Form.Item>
            <Form.Item label="摄像头" name="cameraId" rules={[{ required: true }]}>
              <Select options={cameras.map((item) => ({ label: `${item.cameraName} (${item.cameraId})`, value: item.cameraId }))} />
            </Form.Item>
            <Form.Item label="文件名" name="fileName" rules={[{ required: true }]}><Input placeholder="leaf-001.jpg" /></Form.Item>
            <Form.Item label="文件 URL" name="fileUrl" rules={[{ required: true }]}><Input placeholder="https://example.com/leaf-001.jpg" /></Form.Item>
            <Form.Item label="对象存储 Key" name="objectKey" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="提供方" name="providerType" rules={[{ required: true }]}><Select options={["MOCK", "SMARTJAVAAI"].map((value) => ({ label: value, value }))} /></Form.Item>
            <Button type="primary" htmlType="submit" loading={submittingTask}>创建任务</Button>
            {lastTaskId ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">最近创建任务 ID：{lastTaskId}</p> : null}
          </Form>
        </AppCard>

        <AppCard title="摄像头与告警列表" className="min-h-0 overflow-hidden">
          <Table
            rowKey="cameraId"
            dataSource={cameras}
            pagination={false}
            scroll={{ y: 180 }}
            columns={[
              { title: "ID", dataIndex: "cameraId" },
              { title: "名称", dataIndex: "cameraName" },
              { title: "协议", dataIndex: "streamProtocol" },
              { title: "播放 Token", dataIndex: "playbackToken" }
            ]}
          />
          <div className="mt-4" />
          <Table
            rowKey="id"
            dataSource={alerts}
            pagination={false}
            scroll={{ y: 180 }}
            columns={[
              { title: "告警 ID", dataIndex: "id" },
              { title: "级别", dataIndex: "alertLevel" },
              { title: "标题", dataIndex: "alertTitle" },
              { title: "时间", render: (_, record) => formatDateTime(record.lastOccurredAt) }
            ]}
          />
        </AppCard>
      </div>
    </div>
  );
}

