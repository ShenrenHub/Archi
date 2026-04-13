export type Role = "farmer" | "expert" | "admin";

export type ThemeMode = "light" | "dark";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface OptionItem {
  label: string;
  value: string;
}
