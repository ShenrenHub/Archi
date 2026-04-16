import axios, { AxiosError, type AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/common";

const resolveDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:8080";
  }

  const url = new URL(window.location.origin);
  url.port = "8080";
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
};

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || resolveDefaultApiBaseUrl();

export const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

request.interceptors.request.use((config) => {
  config.headers["Content-Type"] = "application/json";
  return config;
});

request.interceptors.response.use(
  ((response: AxiosResponse) => {
    const payload = response.data as ApiResponse<unknown> | unknown;

    if (!isWrappedResponse(payload)) {
      return payload;
    }

    const success =
      payload.success === true || payload.code === 0 || payload.code === "OK";

    if (!success) {
      const error = new Error(payload.message || "请求失败");
      return Promise.reject(Object.assign(error, { payload }));
    }

    return payload.data;
  }) as never,
  (error: AxiosError<ApiResponse<unknown>>) => {
    return Promise.reject(error);
  }
);

function isWrappedResponse(payload: unknown): payload is ApiResponse<unknown> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    ("success" in payload || "code" in payload)
  );
}
