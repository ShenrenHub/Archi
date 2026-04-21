export type MascotTrigger = "click" | "route-change" | "ambient";
export type MascotMood = "calm" | "curious" | "alert";
export type MascotAction = "idle" | "hop";
export type MascotTargetZone =
  | "none"
  | "left"
  | "right"
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface MascotInteractRequest {
  clientId: string;
  trigger: MascotTrigger;
  route: string;
  routeLabel?: string;
  farmId?: number | null;
  pageTitle?: string;
  pageSummary?: string;
  visibleText?: string;
}

export interface MascotInteractResponse {
  speech: string;
  mood: MascotMood;
  action: MascotAction;
  targetZone: MascotTargetZone;
  durationMs: number;
  source: "openclaw" | "fallback";
  sessionKey: string;
}

export async function requestMascotInteract(
  payload: MascotInteractRequest,
  signal?: AbortSignal
): Promise<MascotInteractResponse> {
  const response = await fetch("/api/crop-diagnosis/mascot/interact", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const raw = (await response.json().catch(() => null)) as
    | { data?: MascotInteractResponse; message?: string }
    | null;

  if (!response.ok || !raw?.data) {
    throw new Error(raw?.message || "筑泥魔网关请求失败");
  }

  return raw.data;
}
