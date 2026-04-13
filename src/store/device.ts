import { create } from "zustand";

export interface DeviceActionRecord {
  id: string;
  label: string;
  status: "pending" | "success";
  timestamp: string;
}

interface DeviceStore {
  actionHistory: DeviceActionRecord[];
  pushHistory: (record: DeviceActionRecord) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  actionHistory: [],
  pushHistory: (record) =>
    set((state) => ({
      actionHistory: [record, ...state.actionHistory].slice(0, 8)
    }))
}));
