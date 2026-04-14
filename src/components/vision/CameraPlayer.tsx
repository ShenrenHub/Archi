import { useEffect, useState } from "react";
import { AppCard } from "@/components/common/AppCard";
import { fetchVisionStreamInfo } from "@/api/vision";
import type { VisionStreamInfo } from "@/api/vision";

interface CameraPlayerProps {
  title: string;
  greenhouseId?: string;
}

export const CameraPlayer = ({ title, greenhouseId = "gh-1" }: CameraPlayerProps) => {
  const [streamInfo, setStreamInfo] = useState<VisionStreamInfo | null>(null);

  useEffect(() => {
    void fetchVisionStreamInfo(greenhouseId)
      .then(setStreamInfo)
      .catch(() => setStreamInfo(null));
  }, [greenhouseId]);

  return (
    <AppCard title={title} className="h-full">
      <div className="relative overflow-hidden rounded-[24px] bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.92))]" />
        <div className="absolute inset-0 bg-grid bg-[size:24px_24px] opacity-20" />
        <div className="relative flex h-[300px] flex-col justify-between p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              {streamInfo ? `${streamInfo.streamType.toUpperCase()} Stream` : "等待流信息"}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
              {streamInfo?.resolution ?? "未连接"}
            </span>
          </div>
          <div>
            <h4 className="text-2xl font-semibold">{title}</h4>
            <p className="mt-2 max-w-lg text-sm text-slate-300">
              {streamInfo
                ? `流状态：${streamInfo.status}，播放地址：${streamInfo.playUrl}${typeof streamInfo.latencyMs === "number" ? `，延迟 ${streamInfo.latencyMs}ms` : ""}`
                : "当前等待后端返回视频流信息，可对接 WebRTC、HLS 或厂商 SDK。"}
            </p>
          </div>
        </div>
      </div>
    </AppCard>
  );
};
