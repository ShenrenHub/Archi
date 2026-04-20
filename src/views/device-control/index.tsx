import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Collapse, Empty, Form, Input, InputNumber, Select, Switch, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { createCommand, fetchCommands, type CommandItem } from "@/api/control";
import { fetchDevices, type DeviceItem } from "@/api/device";
import { fetchGreenhouses, type GreenhouseItem } from "@/api/farm";
import { createRule, fetchRules, type CreateRulePayload, type RuleItem } from "@/api/strategy";
import { fetchDeviceSnapshots, type DeviceSnapshotItem } from "@/api/telemetry";
import { AppCard } from "@/components/common/AppCard";
import { useUserStore } from "@/store/user";
import {
  CONTROL_DEVICE_CATALOG,
  findDeviceAction,
  type ControlDeviceDefinition,
  type DeviceActionState
} from "./device-catalog";

const ruleStatusLabelMap = {
  ENABLED: "启用中",
  DISABLED: "已停用"
} as const;

const readLightState = (snapshot: Record<string, unknown> | undefined): DeviceActionState | undefined => {
  const rawValue = snapshot?.lightStatus ?? snapshot?.LightStatus;
  if (typeof rawValue !== "string") {
    return undefined;
  }

  if (rawValue.toUpperCase() === "ON") {
    return "ON";
  }
  if (rawValue.toUpperCase() === "OFF") {
    return "OFF";
  }
  return undefined;
};

const readErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "操作失败，请稍后重试。";

interface RuntimeCatalogDevice {
  definition: ControlDeviceDefinition;
  device?: DeviceItem;
  snapshot?: DeviceSnapshotItem;
  lastCommand?: CommandItem;
  greenhouseName?: string;
}

export default function DeviceControlPage() {
  const { message } = App.useApp();
  const farmId = useUserStore((state) => state.farmId);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [greenhouses, setGreenhouses] = useState<GreenhouseItem[]>([]);
  const [snapshots, setSnapshots] = useState<DeviceSnapshotItem[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [activeDeviceKey, setActiveDeviceKey] = useState<string>();
  const [pendingLightStates, setPendingLightStates] = useState<Record<string, DeviceActionState>>({});
  const [ruleForm] = Form.useForm<CreateRulePayload>();

  const loadData = useCallback(async (showRefreshing = true) => {
    if (!farmId) {
      return;
    }

    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const [deviceResponse, commandResponse, greenhouseResponse, ruleResponse, snapshotResponse] = await Promise.all([
        fetchDevices(farmId),
        fetchCommands(farmId),
        fetchGreenhouses(farmId),
        fetchRules(farmId),
        fetchDeviceSnapshots(farmId)
      ]);
      setDevices(deviceResponse);
      setCommands(commandResponse);
      setGreenhouses(greenhouseResponse);
      setRules(ruleResponse);
      setSnapshots(snapshotResponse);
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [farmId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!farmId) {
      return;
    }
    ruleForm.setFieldsValue({
      farmId,
      triggerType: "THRESHOLD",
      debounceSeconds: 60
    });
  }, [farmId, ruleForm]);

  useEffect(() => {
    if (!farmId) {
      return;
    }
    const timer = window.setInterval(() => {
      void loadData(false);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [farmId, loadData]);

  const greenhouseNameById = useMemo(
    () => new Map(greenhouses.map((item) => [item.id, item.greenhouseName])),
    [greenhouses]
  );

  const deviceByCode = useMemo(
    () => new Map(devices.map((item) => [item.deviceCode, item])),
    [devices]
  );

  const snapshotByDeviceId = useMemo(
    () => new Map(snapshots.map((item) => [item.deviceId, item])),
    [snapshots]
  );

  const catalogDevices = useMemo<RuntimeCatalogDevice[]>(
    () =>
      CONTROL_DEVICE_CATALOG.map((definition) => {
        const device = deviceByCode.get(definition.deviceCode);
        const snapshot = device ? snapshotByDeviceId.get(device.id) : undefined;
        return {
          definition,
          device,
          snapshot,
          lastCommand: device ? commands.find((command) => command.deviceId === device.id) : undefined,
          greenhouseName: device?.greenhouseId ? greenhouseNameById.get(device.greenhouseId) : undefined
        };
      }),
    [commands, deviceByCode, greenhouseNameById, snapshotByDeviceId]
  );

  useEffect(() => {
    setPendingLightStates((current) => {
      const nextState = { ...current };
      let changed = false;

      catalogDevices.forEach((item) => {
        const pendingState = current[item.definition.deviceCode];
        if (!pendingState) {
          return;
        }

        const actualState = readLightState(item.snapshot?.snapshot);
        if (actualState === pendingState || item.lastCommand?.commandStatus === "FAILED") {
          delete nextState[item.definition.deviceCode];
          changed = true;
        }
      });

      return changed ? nextState : current;
    });
  }, [catalogDevices]);

  const handleToggleLight = async (runtimeDevice: RuntimeCatalogDevice, checked: boolean) => {
    if (!farmId || !runtimeDevice.device?.greenhouseId) {
      message.warning("设备还未完成注册或绑定大棚，暂时不能下发灯控命令。");
      return;
    }

    const targetState: DeviceActionState = checked ? "ON" : "OFF";
    const action = findDeviceAction(runtimeDevice.definition, targetState);
    if (!action) {
      message.error("当前设备未配置该控制动作。");
      return;
    }

    setActiveDeviceKey(runtimeDevice.definition.key);
    setPendingLightStates((current) => ({
      ...current,
      [runtimeDevice.definition.deviceCode]: targetState
    }));

    try {
      await createCommand({
        farmId,
        greenhouseId: runtimeDevice.device.greenhouseId,
        deviceId: runtimeDevice.device.id,
        idempotencyKey: `cmd-${runtimeDevice.device.id}-${Date.now()}`,
        commandCode: action.commandCode,
        commandPayload: action.buildPayload()
      });
      message.success(`${runtimeDevice.definition.name}${action.label}命令已下发。`);
      await loadData(false);
    } catch (error) {
      setPendingLightStates((current) => {
        const nextState = { ...current };
        delete nextState[runtimeDevice.definition.deviceCode];
        return nextState;
      });
      message.error(readErrorMessage(error));
    } finally {
      setActiveDeviceKey(undefined);
    }
  };

  const handleSubmitRule = async (values: CreateRulePayload) => {
    setRuleSubmitting(true);
    try {
      await createRule(values);
      message.success("联动规则已保存。");
      ruleForm.resetFields();
      ruleForm.setFieldsValue({
        farmId: farmId ?? undefined,
        triggerType: "THRESHOLD",
        debounceSeconds: 60
      });
      await loadData(false);
    } catch (error) {
      message.error(readErrorMessage(error));
    } finally {
      setRuleSubmitting(false);
    }
  };

  if (!farmId) {
    return <Empty description="请选择农场后再进入控制命令中心。" />;
  }

  return (
    <div className="expressive-page space-y-4">
      <AppCard
        title="设备控制"
        variant="expressive"
        extra={
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void loadData()}>
            刷新
          </Button>
        }
      >
        <div className="grid gap-3">
          {catalogDevices.map((item) => {
            const snapshot = item.snapshot?.snapshot;
            const snapshotLightState = readLightState(snapshot);
            const lightState = pendingLightStates[item.definition.deviceCode]
              ?? snapshotLightState
              ?? (item.lastCommand?.commandCode === "LIGHT_ON" ? "ON" : "OFF");
            const canControl = Boolean(item.device?.greenhouseId);
            const statusText = item.device
              ? item.device.onlineStatus === "ONLINE"
                ? "在线"
                : "等待心跳"
              : "未接入";

            return (
              <div
                key={item.definition.key}
                className="community-surface flex flex-col gap-4 rounded-[30px] border border-white/60 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                      {item.definition.name}
                    </h3>
                    <Tag color={item.device?.onlineStatus === "ONLINE" ? "green" : "default"}>
                      {statusText}
                    </Tag>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.greenhouseName ?? item.definition.deviceCode}
                  </p>
                  {!canControl ? (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                      设备未绑定到大棚，暂时不可控制。
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-sm text-slate-500 dark:text-slate-300">
                    {lightState === "ON" ? "灯已开" : "灯已关"}
                  </span>
                  <Switch
                    checked={lightState === "ON"}
                    checkedChildren="开"
                    unCheckedChildren="关"
                    loading={activeDeviceKey === item.definition.key}
                    disabled={!canControl}
                    onChange={(checked) => void handleToggleLight(item, checked)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AppCard>

      <Collapse
        items={[
          {
            key: "rules",
            label: `联动规则 (${rules.length})`,
            children: (
              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <Form
                  form={ruleForm}
                  layout="vertical"
                  onFinish={(values) => void handleSubmitRule(values)}
                  initialValues={{ farmId, triggerType: "THRESHOLD", debounceSeconds: 60 }}
                >
                  <Form.Item name="farmId" hidden>
                    <InputNumber />
                  </Form.Item>
                  <Form.Item label="规则编码" name="ruleCode" rules={[{ required: true, message: "请输入规则编码" }]}>
                    <Input placeholder="LOW_LIGHT_AUTO_TURN_ON" />
                  </Form.Item>
                  <Form.Item label="规则名称" name="ruleName" rules={[{ required: true, message: "请输入规则名称" }]}>
                    <Input placeholder="低光照自动开灯" />
                  </Form.Item>
                  <Form.Item label="触发类型" name="triggerType" rules={[{ required: true, message: "请选择触发类型" }]}>
                    <Select options={["THRESHOLD", "CRON"].map((value) => ({ label: value, value }))} />
                  </Form.Item>
                  <Form.Item label="Cron 表达式" name="cronExpr">
                    <Input placeholder="可为空" />
                  </Form.Item>
                  <Form.Item label="防抖秒数" name="debounceSeconds" rules={[{ required: true, message: "请输入防抖秒数" }]}>
                    <InputNumber className="!w-full" min={0} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={ruleSubmitting}>
                    保存规则
                  </Button>
                </Form>

                <div className="space-y-3">
                  {rules.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300/80 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      暂无联动规则。
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="community-surface flex flex-col gap-2 rounded-[24px] border border-white/60 px-4 py-3 dark:border-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {rule.ruleName}
                          </div>
                          <Tag color={rule.ruleStatus === "ENABLED" ? "green" : "default"}>
                            {ruleStatusLabelMap[rule.ruleStatus as keyof typeof ruleStatusLabelMap] ?? rule.ruleStatus}
                          </Tag>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">
                          {rule.ruleCode} · {rule.triggerType} · 防抖 {rule.debounceSeconds}s
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
