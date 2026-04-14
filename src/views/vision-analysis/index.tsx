import { useEffect, useState } from "react";
import { Button, Image, Tag, Upload, message } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import { analyzeCropImage } from "@/api/vision";
import type { VisionAnalyzeResponse } from "@/api/vision";
import { AppCard } from "@/components/common/AppCard";
import { fileToBase64 } from "@/utils/file";

export default function VisionAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<VisionAnalyzeResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      const base64 = await fileToBase64(selectedFile);
      const result = await analyzeCropImage({
        imageName: selectedFile.name,
        imageBase64: base64,
        source: "mock"
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

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <AppCard title="图片上传分析" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="rounded-[24px] border border-dashed border-brand-500/30 bg-brand-50/60 p-8 text-center dark:bg-white/5">
          <CloudUploadOutlined className="text-3xl text-brand-600" />
          <p className="mt-4 text-base font-medium text-slate-900 dark:text-white">上传叶片图片进行健康检测</p>
          {/* <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            支持 JPG / PNG，前端会先转为 base64 文本，便于后续直连 SmartJavaAI。
          </p> */}
        </div>

        <Upload
          className="mt-4"
          maxCount={1}
          accept="image/*"
          beforeUpload={(file) => {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysis(null);
            return false;
          }}
          onRemove={() => {
            setSelectedFile(null);
            setPreviewUrl("");
            setAnalysis(null);
          }}
        >
          <Button>选择图片</Button>
        </Upload>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="primary" loading={analyzing} onClick={() => void handleAnalyze()}>
            开始分析
          </Button>
          <Button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl("");
              setAnalysis(null);
            }}
          >
            清空结果
          </Button>
        </div>

        {previewUrl ? (
          <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-[24px] bg-slate-950/5 p-3 dark:bg-white/5">
            <div className="flex h-full max-h-[520px] items-center justify-center overflow-hidden rounded-[20px]">
              <img
                src={previewUrl}
                alt="upload-preview"
                className="max-h-[520px] w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/40 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
            选择一张叶片图片后，左侧会显示上传预览。
          </div>
        )}

        {/* <div className="mt-5 rounded-[24px] border border-dashed border-sky-500/25 bg-sky-500/5 p-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          已预留 SmartJavaAI 接口调用契约：图片通过 base64 文本上传，后端返回结构化病变、遮挡和建议字段。真实服务可直接接入
          `submitSmartJavaAiAnalysis`。
        </div> */}
      </AppCard>

      <AppCard title="健康检测结果" className="min-h-0 overflow-hidden">
        {analysis ? (
          <div className="h-full space-y-4 overflow-y-auto pr-1">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <p className="text-sm text-slate-300">识别结论</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold">{analysis.disease}</h3>
                <Tag color={analysis.reviewRecommended ? "orange" : "green"}>
                  {analysis.reviewRecommended ? "建议复核" : "可直接处置"}
                </Tag>
              </div>
              <p className="mt-3 text-sm text-slate-300">模型置信度 {analysis.confidence}%</p>
              {/* <p className="mt-2 text-xs text-slate-400">
                请求编号 {analysis.requestId ?? "mock-local"} / 来源 {analysis.source ?? "mock"}
              </p> */}
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
          <div className="flex h-full min-h-[340px] items-center justify-center rounded-[24px] bg-white/40 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
            上传叶片图片后，这里会展示病变识别、遮挡判断和处置建议。
          </div>
        )}
      </AppCard>
    </div>
  );
}
