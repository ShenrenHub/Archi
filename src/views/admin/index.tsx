import { useEffect, useState } from "react";
import { Button, Table, Tag, message } from "antd";
import { bindDevice, fetchAdminOverview, unbindDevice } from "@/api/admin";
import type { AdminAlertLogItem, AdminDeviceItem } from "@/api/admin";
import { AppCard } from "@/components/common/AppCard";
import { formatDateTime } from "@/utils/time";

export default function AdminPage() {
  const [devices, setDevices] = useState<AdminDeviceItem[]>([]);
  const [alertLogs, setAlertLogs] = useState<AdminAlertLogItem[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetchAdminOverview().then((response) => {
      setDevices(response.devices);
      setAlertLogs(response.alertLogs);
    });
  }, []);

  const handleBindingAction = async (record: AdminDeviceItem) => {
    setLoadingMap((current) => ({ ...current, [record.id]: true }));
    try {
      if (record.status === "bound") {
        await unbindDevice({ deviceId: record.id });
        message.success("设备已解绑");
        setDevices((current) =>
          current.map((item) =>
            item.id === record.id
              ? { ...item, status: "unbound", greenhouseName: "未分配", updatedAt: new Date().toISOString() }
              : item
          )
        );
      } else {
        await bindDevice({ deviceId: record.id });
        message.success("设备已绑定到一号番茄棚");
        setDevices((current) =>
          current.map((item) =>
            item.id === record.id
              ? { ...item, status: "bound", greenhouseName: "一号番茄棚", updatedAt: new Date().toISOString() }
              : item
          )
        );
      }
    } finally {
      setLoadingMap((current) => ({ ...current, [record.id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <AppCard title="设备绑定 / 解绑管理">
        <Table
          rowKey="id"
          dataSource={devices}
          pagination={false}
          columns={[
            { title: "设备编码", dataIndex: "deviceCode" },
            { title: "类型", dataIndex: "type" },
            { title: "所属大棚", dataIndex: "greenhouseName" },
            {
              title: "状态",
              render: (_, record) => (
                <Tag color={record.status === "bound" ? "green" : "default"}>
                  {record.status === "bound" ? "已绑定" : "未绑定"}
                </Tag>
              )
            },
            {
              title: "更新时间",
              render: (_, record) => formatDateTime(record.updatedAt)
            },
            {
              title: "操作",
              render: (_, record) => (
                <Button
                  type={record.status === "bound" ? "default" : "primary"}
                  loading={Boolean(loadingMap[record.id])}
                  onClick={() => void handleBindingAction(record)}
                >
                  {record.status === "bound" ? "解绑" : "绑定"}
                </Button>
              )
            }
          ]}
        />
      </AppCard>

      <AppCard title="系统全量告警日志">
        <Table
          rowKey="id"
          dataSource={alertLogs}
          pagination={false}
          columns={[
            {
              title: "级别",
              render: (_, record) => (
                <Tag color={record.level === "high" ? "red" : record.level === "medium" ? "orange" : "blue"}>
                  {record.level}
                </Tag>
              )
            },
            { title: "来源", dataIndex: "source" },
            { title: "告警内容", dataIndex: "message" },
            {
              title: "时间",
              render: (_, record) => formatDateTime(record.createdAt)
            }
          ]}
        />
      </AppCard>
    </div>
  );
}
