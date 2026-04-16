import { request } from "@/api/request";

export interface RuleItem {
  id: number;
  farmId: number;
  ruleCode: string;
  ruleName: string;
  triggerType: string;
  ruleStatus: string;
  cronExpr: string | null;
  debounceSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRulePayload {
  farmId: number;
  ruleCode: string;
  ruleName: string;
  triggerType: string;
  cronExpr: string | null;
  debounceSeconds: number;
}

export const fetchRules = (farmId: number) =>
  request.get<never, RuleItem[]>(`/api/rules?farmId=${farmId}`);

export const createRule = (payload: CreateRulePayload) =>
  request.post<CreateRulePayload, number>("/api/rules", payload);
