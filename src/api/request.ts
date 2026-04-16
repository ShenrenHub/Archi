import axios, { AxiosError, type AxiosResponse } from "axios";
import { message } from "antd";
import { useUserStore } from "@/store/user";
import type { ApiResponse } from "@/types/common";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://dev.winstonchen.cn:8080";

export const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

request.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
      if (payload.code === "A0401" || payload.code === 401) {
        useUserStore.getState().logout();
      }

      const error = new Error(payload.message || "请求失败");
      message.error(payload.message || "请求失败，请稍后重试");
      return Promise.reject(Object.assign(error, { payload }));
    }

    return payload.data;
  }) as never,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.data?.code === "A0401") {
      useUserStore.getState().logout();
    }

    const serverMessage =
      error.response?.data?.message || error.message || "网络异常，请检查连接";
    message.error(serverMessage);
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
