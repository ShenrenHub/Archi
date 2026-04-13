import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Image,
  List,
  Tag,
  Upload,
  message
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { CloudUploadOutlined, SendOutlined } from "@ant-design/icons";
import {
  analyzeCropImage,
  fetchVisionAlerts,
  pushAlertToExpert
} from "@/api/vision";
import type { VisionAlertItem, VisionAnalyzeResponse } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { CameraPlayer } from "@/components/vision/CameraPlayer";
import { formatDateTime } from "@/utils/time";

export default function VisionPage() {
  const [alerts, setAlerts] = useState<VisionAlertItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<VisionAnalyzeResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetchVisionAlerts().then(setAlerts);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const levelColorMap = useMemo(
    () => ({
      high: "red",
      medium: "orange",
      low: "blue"
    }),
    []
  );

  const handleAnalyze = async () => {
    if (!selectedFile) {
      message.warning("请先选择叶片图片");
      return;
    }

    setAnalyzing(true);
    message.loading({
      key: "vision-analyze",
      content: "AI 视觉分析中..."
    });

    try {
      const result = await analyzeCropImage({
        imageName: selectedFile.name
      });
      setAnalysis(result);
      message.success({
        key: "vision-analyze",
        content: "分析完成，已返回病变与遮挡结果"
      });
    } finally {
      setAnalyzing(false);
    }
  };

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
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CameraPlayer title="一号番茄棚实时画面" />

        <AppCard title="AI 视觉上传分析">
          <Upload
            maxCount={1}
            accept="image/*"
            beforeUpload={(file) => {
              setSelectedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              return false;
            }}
            onRemove={() => {
              setSelectedFile(null);
              setPreviewUrl("");
              setAnalysis(null);
            }}
          >
            <div className="rounded-[24px] border border-dashed border-brand-500/30 bg-brand-50/60 p-8 text-center dark:bg-white/5">
              <CloudUploadOutlined className="text-3xl text-brand-600" />
              <p className="mt-4 text-base font-medium text-slate-900 dark:text-white">上传叶片图片进行健康检测</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">支持 JPG / PNG，返回遮挡、病变与处理建议</p>
            </div>
          </Upload>

          <div className="mt-4 flex gap-3">
            <Button type="primary" loading={analyzing} onClick={() => void handleAnalyze()}>
              开始分析
            </Button>
            <Button onClick={() => setAnalysis(null)}>清空结果</Button>
          </div>

          {previewUrl ? (
            <div className="mt-5">
              <Image
                src={previewUrl}
                alt="upload-preview"
                className="rounded-[24px]"
                style={{ borderRadius: 24 }}
              />
            </div>
          ) : null}
        </AppCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AppCard title="健康检测结果">
          {analysis ? (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
                <p className="text-sm text-slate-300">识别结论</p>
                <h3 className="mt-3 text-2xl font-semibold">{analysis.disease}</h3>
                <p className="mt-3 text-sm text-slate-300">模型置信度 {analysis.confidence}%</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-white/60 p-4 dark:bg-white/5">
                  <p className="text-sm text-slate-500 dark:text-slate-300">遮挡判断</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {analysis.obstruction ? "存在遮挡" : "视野清晰"}
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/60 p-4 dark:bg-white/5">
                  <p className="text-sm text-slate-500 dark:text-slate-300">参考样例</p>
                  <Image
                    src={analysis.imageUrl}
                    alt="sample"
                    width="100%"
                    style={{ borderRadius: 20, marginTop: 12 }}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white">处置建议</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {analysis.suggestions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[340px] items-center justify-center rounded-[24px] bg-white/40 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
              上传叶片图片后，这里会展示分析结果。
            </div>
          )}
        </AppCard>

        <AppCard title="异常告警通知">
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
        </AppCard>
      </div>
    </div>
  );
}
