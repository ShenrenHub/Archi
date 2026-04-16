import { create } from "zustand";
import { storage } from "@/utils/storage";
import type { FarmSummary, LoginResponse, Role, UserProfile } from "@/types/common";
import { mapRoleCodesToAppRole } from "@/types/common";

interface PersistedUserState {
  token: string;
  userId: number | null;
  farmId: number | null;
  username: string;
  displayName: string;
  roleCodes: UserProfile["roleCodes"];
  role: Role;
}

interface UserState extends PersistedUserState {
  farms: FarmSummary[];
  isAuthenticated: boolean;
  setSession: (payload: LoginResponse) => void;
  setProfile: (profile: UserProfile) => void;
  setFarms: (farms: FarmSummary[]) => void;
  setFarmId: (farmId: number | null) => void;
  setRole: (role: Role) => void;
  logout: () => void;
}

const STORAGE_KEY = "agri-user-session";

const persistedState = storage.get<PersistedUserState>(STORAGE_KEY, {
  token: "",
  userId: null,
  farmId: null,
  username: "",
  displayName: "",
  roleCodes: ["FARM_ADMIN"],
  role: "farmer"
});

const persist = (state: PersistedUserState) => {
  storage.set(STORAGE_KEY, state);
};

const clearPersisted = () => {
  storage.remove(STORAGE_KEY);
};

export const useUserStore = create<UserState>((set) => ({
  ...persistedState,
  farms: [],
  isAuthenticated: Boolean(persistedState.token),
  setSession: (payload) => {
    const nextState: PersistedUserState = {
      token: payload.accessToken,
      userId: payload.userId,
      farmId: payload.farmId,
      username: payload.username,
      displayName: payload.username,
      roleCodes: payload.roleCodes,
      role: mapRoleCodesToAppRole(payload.roleCodes)
    };

    persist(nextState);
    set({
      ...nextState,
      isAuthenticated: true
    });
  },
  setProfile: (profile) => {
    set((state) => {
      const nextState: PersistedUserState = {
        token: state.token,
        userId: profile.userId,
        farmId: profile.farmId,
        username: profile.username,
        displayName: profile.displayName,
        roleCodes: profile.roleCodes,
        role: mapRoleCodesToAppRole(profile.roleCodes)
      };

      persist(nextState);

      return {
        ...nextState,
        farms: state.farms,
        isAuthenticated: true
      };
    });
  },
  setFarms: (farms) =>
    set((state) => {
      const activeFarmId =
        state.farmId && farms.some((farm) => farm.id === state.farmId)
          ? state.farmId
          : farms[0]?.id ?? state.farmId;

      const nextState: PersistedUserState = {
        token: state.token,
        userId: state.userId,
        farmId: activeFarmId,
        username: state.username,
        displayName: state.displayName,
        roleCodes: state.roleCodes,
        role: state.role
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
        token: state.token,
        userId: state.userId,
        farmId,
        username: state.username,
        displayName: state.displayName,
        roleCodes: state.roleCodes,
        role: state.role
      };

      persist(nextState);

      return {
        farmId
      };
    }),
  setRole: (role) =>
    set((state) => {
      const nextState: PersistedUserState = {
        token: state.token,
        userId: state.userId,
        farmId: state.farmId,
        username: state.username,
        displayName: state.displayName,
        roleCodes: state.roleCodes,
        role
      };

      persist(nextState);

      return {
        role
      };
    }),
  logout: () => {
    clearPersisted();
    set({
      token: "",
      userId: null,
      farmId: null,
      username: "",
      displayName: "",
      roleCodes: ["FARM_ADMIN"],
      role: "farmer",
      farms: [],
      isAuthenticated: false
    });
  }
}));
