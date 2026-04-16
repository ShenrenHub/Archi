import { create } from "zustand";
import { storage } from "@/utils/storage";
import type { FarmSummary } from "@/types/common";

interface PersistedUserState {
  userId: number;
  farmId: number | null;
  username: string;
  displayName: string;
}

interface UserState extends PersistedUserState {
  farms: FarmSummary[];
  setFarms: (farms: FarmSummary[]) => void;
  setFarmId: (farmId: number | null) => void;
}

const STORAGE_KEY = "agri-user-session";
const DEMO_USER_STATE: PersistedUserState = {
  userId: 4001,
  farmId: 1001,
  username: "demo-admin",
  displayName: "演示管理员"
};

const persistedState = {
  ...DEMO_USER_STATE,
  ...storage.get<Partial<PersistedUserState>>(STORAGE_KEY, DEMO_USER_STATE)
};

const persist = (state: PersistedUserState) => {
  storage.set(STORAGE_KEY, state);
};

export const useUserStore = create<UserState>((set) => ({
  ...persistedState,
  farms: [],
  setFarms: (farms) =>
    set((state) => {
      const activeFarmId =
        state.farmId && farms.some((farm) => farm.id === state.farmId)
          ? state.farmId
          : farms[0]?.id ?? state.farmId;

      const nextState: PersistedUserState = {
        userId: state.userId,
        farmId: activeFarmId,
        username: state.username,
        displayName: state.displayName
      };

      persist(nextState);

      return {
        farms,
        farmId: activeFarmId
      };
    }),
  setFarmId: (farmId) =>
    set((state) => {
      const nextState: PersistedUserState = {
        userId: state.userId,
        farmId,
        username: state.username,
        displayName: state.displayName
      };

      persist(nextState);

      return {
        farmId
      };
    })
}));
