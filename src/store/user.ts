import { create } from "zustand";
import { storage } from "@/utils/storage";
import type { Role } from "@/types/common";

interface UserState {
  token: string;
  username: string;
  role: Role;
  setRole: (role: Role) => void;
}

const STORAGE_KEY = "agri-user-role";

export const useUserStore = create<UserState>((set) => ({
  token: "mock-token-greenhouse",
  username: "农场总控台",
  role: storage.get<Role>(STORAGE_KEY, "admin"),
  setRole: (role) => {
    storage.set(STORAGE_KEY, role);
    set({ role });
  }
}));
