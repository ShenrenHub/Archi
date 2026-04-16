import { request } from "@/api/request";
import type { LoginPayload, LoginResponse, UserProfile } from "@/types/common";

export const login = (payload: LoginPayload) =>
  request.post<LoginPayload, LoginResponse>("/api/auth/login", payload);

export const fetchCurrentUser = () => request.get<never, UserProfile>("/api/auth/me");
