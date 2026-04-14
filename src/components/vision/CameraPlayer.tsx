import { AppCard } from "@/components/common/AppCard";

interface CameraPlayerProps {
  title: string;
}

export const CameraPlayer = ({ title }: CameraPlayerProps) => (
  <AppCard title={title} className="h-full">
    <div className="relative overflow-hidden rounded-[24px] bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.92))]" />
      <div className="absolute inset-0 bg-grid bg-[size:24px_24px] opacity-20" />
      <div className="relative flex h-[300px] flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">实时画面</span>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">画面正常</span>
        </div>
        <div>
          <h4 className="text-2xl font-semibold">{title}</h4>
          {/* <p className="mt-2 max-w-lg text-sm text-slate-300">预留实时视频流接入位，可替换为 WebRTC、HLS 或厂商 SDK 画面组件。</p> */}
        </div>
      </div>
    </div>
  </AppCard>
);
