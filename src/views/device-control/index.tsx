import { useEffect, useMemo, useState } from "react";
import {
  Button,
  List,
  message,
  Slider,
  Spin,
  Switch,
  Tag
} from "antd";
import dayjs from "dayjs";
import { BulbOutlined, FireOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  fetchDeviceControls,
  setTargetTemperature,
  toggleDevicePower
} from "@/api/device";
import type { DeviceControlItem } from "@/api/device";
import { AppCard } from "@/components/common/AppCard";
import { MqttStatusLight } from "@/components/device/MqttStatusLight";
import { useDebounceFn } from "@/hooks/useDebounceFn";
import { useMqttBridge } from "@/hooks/useMqttBridge";
import { useDeviceStore } from "@/store/device";

export default function DeviceControlPage() {
  const [controls, setControls] = useState<DeviceControlItem[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const { state, latency } = useMqttBridge();
  const actionHistory = useDeviceStore((store) => store.actionHistory);
  const pushHistory = useDeviceStore((store) => store.pushHistory);

  const sliderControl = useMemo(
    () => controls.find((item) => item.type === "slider"),
    [controls]
  );
  const [draftTemp, setDraftTemp] = useState<number>(24);

  const loadControls = async () => {
    setRefreshing(true);
    try {
      const response = await fetchDeviceControls();
      setControls(response.controls);
      const initialTemp = response.controls.find((item) => item.type === "slider")?.value;
      if (typeof initialTemp === "number") {
        setDraftTemp(initialTemp);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadControls();
  }, []);

  const setItemLoading = (id: string, value: boolean) => {
    setLoadingMap((current) => ({ ...current, [id]: value }));
  };

  const handleToggle = async (device: DeviceControlItem, nextValue: boolean) => {
    setItemLoading(device.id, true);
    message.loading({
      key: device.id,
      content: `正在下发 ${device.name} 指令...`
    });

    try {
      const result = await toggleDevicePower({
        deviceId: device.id,
        powerOn: nextValue
      });

      setControls((current) =>
        current.map((item) =>
          item.id === device.id
            ? {
                ...item,
                powerOn: result.powerOn,
                statusText: result.statusText
              }
            : item
        )
      );

      pushHistory({
        id: `${device.id}-${Date.now()}`,
        label: `${device.name}${nextValue ? " 已开启" : " 已关闭"}`,
        status: "success",
        timestamp: dayjs().format("HH:mm:ss")
      });

      message.success({
        key: device.id,
        content: result.statusText
      });
    } finally {
      setItemLoading(device.id, false);
    }
  };

  const saveTemperature = useDebounceFn(async (value: number) => {
    if (!sliderControl) {
      return;
    }

    setItemLoading(sliderControl.id, true);
    message.loading({
      key: sliderControl.id,
      content: "正在同步温控设定..."
    });

    try {
      const result = await setTargetTemperature({
        deviceId: sliderControl.id,
        targetTemperature: value
      });

      setControls((current) =>
        current.map((item) =>
          item.id === sliderControl.id
            ? {
                ...item,
                value: result.targetTemperature,
                statusText: result.statusText
              }
            : item
        )
      );

      pushHistory({
        id: `${sliderControl.id}-${Date.now()}`,
        label: `目标温度设为 ${value}°C`,
        status: "success",
        timestamp: dayjs().format("HH:mm:ss")
      });

      message.success({
        key: sliderControl.id,
        content: result.statusText
      });
    } finally {
      setItemLoading(sliderControl.id, false);
    }
  }, 400);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <AppCard
          title="远程控制总览"
          extra={
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={() => void loadControls()}
            >
              刷新状态
            </Button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">
                MQTT 设备联控面板
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                用于模拟补光灯、通风电机与温控器的远程控制。指令发送后会等待 Mock 后端回执，再更新 UI 状态，并产生清晰的 Toast 反馈。
              </p>
              <div className="mt-5">
                <MqttStatusLight state={state} latency={latency} />
              </div>
            </div>
            <div className="rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <p className="text-sm text-slate-300">控制链路</p>
              <h4 className="mt-3 text-4xl font-semibold">稳定</h4>
              <p className="mt-3 text-sm text-slate-300">设备回执与策略执行结果统一收敛到控制中心。</p>
            </div>
          </div>
        </AppCard>

        <AppCard title="最近控制记录" className="flex lg:h-full lg:min-h-0 flex-col">
          {actionHistory.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500 dark:text-slate-300">
              暂无操作记录，试试切换设备状态。
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto pr-1">
              <List
                dataSource={actionHistory}
                renderItem={(item) => (
                  <List.Item className="!px-0">
                    <div className="w-full rounded-2xl bg-white/60 p-4 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-900 dark:text-white">{item.label}</span>
                        <Tag color={item.status === "success" ? "green" : "gold"}>{item.timestamp}</Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </AppCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <AppCard title="设备远程控制">
          <div className="grid gap-4 md:grid-cols-2">
            {controls
              .filter((item) => item.type === "switch")
              .map((device) => (
                <div
                  key={device.id}
                  className="rounded-[26px] border border-white/10 bg-white/60 p-5 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 p-3 text-white">
                          {device.controlType === "light" ? <BulbOutlined /> : <FireOutlined />}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{device.name}</h4>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{device.description}</p>
                        </div>
                      </div>
                    </div>
                    <Tag color={device.online ? "green" : "red"}>{device.online ? "在线" : "离线"}</Tag>
                  </div>

                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-4 text-white">
                    <div>
                      <p className="text-xs text-slate-400">当前状态</p>
                      <p className="mt-2 text-base font-semibold">{device.statusText}</p>
                    </div>
                    <Switch
                      checked={Boolean(device.powerOn)}
                      loading={Boolean(loadingMap[device.id])}
                      onChange={(value) => void handleToggle(device, value)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </AppCard>

        <AppCard title="目标温度调节">
          {sliderControl ? (
            <div className="space-y-6">
              <div className="rounded-[24px] bg-gradient-to-br from-emerald-500 to-brand-700 p-5 text-white">
                <p className="text-sm text-emerald-50">当前设定</p>
                <h4 className="mt-3 text-5xl font-semibold">{draftTemp}°C</h4>
                <p className="mt-3 text-sm text-emerald-50">{sliderControl.statusText}</p>
              </div>

              <Slider
                min={sliderControl.min}
                max={sliderControl.max}
                value={draftTemp}
                onChange={setDraftTemp}
                tooltip={{ formatter: (value) => `${value}°C` }}
              />

              <div className="flex gap-3">
                <Button
                  type="primary"
                  loading={Boolean(loadingMap[sliderControl.id])}
                  onClick={() => void saveTemperature(draftTemp)}
                >
                  应用设定
                </Button>
                <Button onClick={() => setDraftTemp(sliderControl.value ?? 24)}>恢复当前值</Button>
              </div>

              <div className="rounded-[24px] border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                提交按钮已做防抖，连续点击会合并为一次有效下发，适合对接真实 MQTT 指令链路。
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center">
              <Spin />
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}

