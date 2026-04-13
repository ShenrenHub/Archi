import { Badge } from "antd";

interface MqttStatusLightProps {
  state: "connecting" | "online" | "offline";
  latency?: number;
}

const statusMap = {
  connecting: { color: "processing", text: "MQTT 连接中" },
  online: { color: "success", text: "MQTT 在线" },
  offline: { color: "error", text: "MQTT 离线" }
} as const;

export const MqttStatusLight = ({ state, latency }: MqttStatusLightProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
    <Badge status={statusMap[state].color} text={statusMap[state].text} />
    {typeof latency === "number" ? (
      <span className="text-xs text-slate-500 dark:text-slate-300">平均延迟 {latency} ms</span>
    ) : null}
  </div>
);
