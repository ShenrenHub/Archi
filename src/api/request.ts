import axios, { AxiosError, type AxiosResponse } from "axios";
import { message } from "antd";
import { useUserStore } from "@/store/user";
import type { ApiResponse } from "@/types/common";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://dev.winstonchen.cn");

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
    const payload = response.data as ApiResponse<unknown>;

    if (!payload.success || payload.code !== "OK") {
      if (payload.code === "A0401") {
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
