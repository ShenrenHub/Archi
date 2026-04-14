import { useEffect, useMemo, useState } from "react";
import { Button, List, Tag, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import { fetchVisionAlerts, pushAlertToExpert } from "@/api/vision";
import type { VisionAlertItem } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { CameraPlayer } from "@/components/vision/CameraPlayer";
import { formatDateTime } from "@/utils/time";

export default function VisionPage() {
  const role = useUserStore((state) => state.role);
  const [alerts, setAlerts] = useState<VisionAlertItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetchVisionAlerts().then(setAlerts);
  }, []);

  const levelColorMap = useMemo(
    () => ({
      high: "red",
      medium: "orange",
      low: "blue"
    }),
    []
  );

  const handlePushReview = async (alert: VisionAlertItem) => {
    setReviewLoading((current) => ({ ...current, [alert.id]: true }));
    try {
      await pushAlertToExpert({
        alertId: alert.id
      });
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, pushedToExpert: true } : item
        )
      );
      message.success("已推送专家复核");
    } finally {
      setReviewLoading((current) => ({ ...current, [alert.id]: false }));
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
      <div className="min-h-0">
        <CameraPlayer title="一号番茄棚实时画面" />
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AppCard title="异常告警通知" className="min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1">
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item className="!px-0">
                  <div className="w-full rounded-[24px] border border-white/10 bg-white/60 p-4 dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">{item.greenhouseName}</h4>
                          <Tag color={levelColorMap[item.level]}>
                            {item.level === "high" ? "高危" : item.level === "medium" ? "中危" : "低危"}
                          </Tag>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.issue}</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <Button
                        type={item.pushedToExpert ? "default" : "primary"}
                        icon={<SendOutlined />}
                        disabled={item.pushedToExpert}
                        loading={Boolean(reviewLoading[item.id])}
                        onClick={() => void handlePushReview(item)}
                      >
                        {item.pushedToExpert ? "已推送" : "推送专家复核"}
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </AppCard>

        <AppCard title="复核流转说明">
          <div className="space-y-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>1. 农户或管理员在此处推送异常后，任务会进入“专家复核”页面。</p>
            <p>2. 专家角色可在侧边栏进入“专家复核”，查看待办、确认 AI 结果或要求补拍复查。</p>
            <p>3. 当前角色：{role === "expert" ? "农业专家，可直接进入复核页面处理任务。" : "非专家，可在推送后切换到专家视图体验完整流程。"}</p>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
