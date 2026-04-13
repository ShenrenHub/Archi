import { create } from "zustand";
import { storage } from "@/utils/storage";
import type { ThemeMode } from "@/types/common";

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "agri-theme-mode";

export const useThemeStore = create<ThemeState>((set) => ({
  mode: storage.get<ThemeMode>(STORAGE_KEY, "light"),
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "light" ? "dark" : "light";
      storage.set(STORAGE_KEY, nextMode);
      return { mode: nextMode };
    }),
  setMode: (mode) => {
    storage.set(STORAGE_KEY, mode);
    set({ mode });
  }
}));
