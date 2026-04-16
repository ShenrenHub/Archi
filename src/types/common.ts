export type ThemeMode = "light" | "dark";

export interface ApiResponse<T> {
  success?: boolean;
  code?: number | string;
  message?: string;
  data: T;
}

export interface OptionItem<T = string> {
  label: string;
  value: T;
}

export interface FarmSummary {
  id: number;
  farmCode: string;
  farmName: string;
  ownerName: string;
  status: number;
}
