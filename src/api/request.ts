import axios, { type AxiosResponse } from "axios";
import { message } from "antd";
import { useUserStore } from "@/store/user";
import type { ApiResponse } from "@/types/common";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000
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

    if (payload.code !== 0) {
      message.error(payload.message || "请求失败，请稍后重试");
      return Promise.reject(payload);
    }

    return payload.data;
  }) as never,
  (error) => {
    const serverMessage =
      error?.response?.data?.message || error?.message || "网络异常，请检查连接";
    message.error(serverMessage);
    return Promise.reject(error);
  }
);
