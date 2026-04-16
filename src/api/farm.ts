import { request } from "@/api/request";
import type { FarmSummary } from "@/types/common";

export interface CreateFarmPayload {
  farmCode: string;
  farmName: string;
  ownerName: string;
  contactPhone: string;
  regionCode: string;
  address: string;
}

export interface CreateGreenhousePayload {
  farmId: number;
  greenhouseCode: string;
  greenhouseName: string;
  greenhouseType: string;
  locationDesc: string;
  areaSize: number;
}

export interface GreenhouseItem {
  id: number;
  farmId: number;
  greenhouseCode: string;
  greenhouseName: string;
  greenhouseType: string;
  status: number;
}

export const createFarm = (payload: CreateFarmPayload) =>
  request.post<CreateFarmPayload, number>("/api/farms", payload);

export const fetchMyFarms = () => request.get<never, FarmSummary[]>("/api/farms/me");

export const createGreenhouse = (payload: CreateGreenhousePayload) =>
  request.post<CreateGreenhousePayload, number>("/api/farms/greenhouses", payload);

export const fetchGreenhouses = (farmId: number) =>
  request.get<never, GreenhouseItem[]>(`/api/farms/greenhouses?farmId=${farmId}`);
