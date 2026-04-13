import { useEffect, useState } from "react";

type MqttConnectionState = "connecting" | "online" | "offline";

export const useMqttBridge = () => {
  const [state, setState] = useState<MqttConnectionState>("connecting");
  const [latency, setLatency] = useState(120);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setState("online");
    }, 900);

    const pulseTimer = window.setInterval(() => {
      setLatency(80 + Math.round(Math.random() * 90));
    }, 2500);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearInterval(pulseTimer);
    };
  }, []);

  return {
    state,
    latency
  };
};
