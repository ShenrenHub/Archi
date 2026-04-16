import { AppCard } from "@/components/common/AppCard";

interface CameraPlayerProps {
  title: string;
  streamUrl?: string;
  streamProtocol?: string;
  playbackToken?: string;
}

export const CameraPlayer = ({ title, streamUrl, streamProtocol, playbackToken }: CameraPlayerProps) => {
  return (
    <AppCard title={title} className="h-full">
      <div className="relative overflow-hidden rounded-[24px] bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.92))]" />
        <div className="relative flex h-[240px] flex-col justify-between p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              {streamProtocol ?? "未配置协议"}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
              {playbackToken ? "可播放" : "等待播放 Token"}
            </span>
          </div>
          <div>
            <h4 className="text-2xl font-semibold">{title}</h4>
            <p className="mt-2 text-sm text-slate-300 break-all">
              {streamUrl ?? "当前后端只返回流地址与 playbackToken，前端可在这里接入 HLS/WebRTC/播放器 SDK。"}
            </p>
          </div>
        </div>
      </div>
    </AppCard>
  );
};
