export type Role = "farmer" | "expert" | "admin";

export type ThemeMode = "light" | "dark";

export type BackendRoleCode = "SYSTEM_ADMIN" | "FARM_ADMIN" | "EXPERT";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface OptionItem<T = string> {
  label: string;
  value: T;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  userId: number;
  farmId: number | null;
  username: string;
  roleCodes: BackendRoleCode[];
}

export interface UserProfile {
  userId: number;
  farmId: number | null;
  username: string;
  displayName: string;
  roleCodes: BackendRoleCode[];
}

export interface FarmSummary {
  id: number;
  farmCode: string;
  farmName: string;
  ownerName: string;
  status: number;
}

export const roleLabelMap: Record<Role, string> = {
  farmer: "农场管理员",
  expert: "农业专家",
  admin: "系统管理员"
};

export const mapRoleCodesToAppRole = (roleCodes: BackendRoleCode[]): Role => {
  if (roleCodes.includes("SYSTEM_ADMIN")) {
    return "admin";
  }

  if (roleCodes.includes("EXPERT")) {
    return "expert";
  }

  return "farmer";
};
