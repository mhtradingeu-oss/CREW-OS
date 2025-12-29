import { apiFetch } from "./client.js";

export type DepartmentScope =
  | "marketing"
  | "sales"
  | "crm"
  | "loyalty"
  | "finance"
  | "inventory"
  | "brand";

export interface DepartmentAgentProfile {
  key: DepartmentScope;
  name: string;
  charter: string;
  defaultFocus: string;
}

export interface MeetingActionItem {
  department: DepartmentScope;
  task: string;
  owner?: string;
  dueDate?: string;
  impact?: string;
}

export interface DepartmentRecommendation {
  department: DepartmentScope;
  headline: string;
  summary: string;
  actionItems: MeetingActionItem[];
}

export interface StandContextPayload {
  standId?: string;
  products?: Array<{
    productId: string;
    sku?: string;
    name?: string;
    currentQty?: number;
    location?: string;
  }>;
  inventorySnapshot?: Array<{
    locationId?: string;
    locationName?: string;
    productId: string;
    sku?: string;
    name?: string;
    quantity: number;
    status?: string;
    lastRefillAt?: string;
  }>;
  notes?: string;
}

export interface SalesRepContextPayload {
  repId?: string;
  leads?: Array<{
    leadId?: string;
    name?: string;
    stage?: string;
    status?: string;
    score?: number;
  }>;
  visits?: Array<{
    visitId?: string;
    partnerId?: string;
    purpose?: string;
    result?: string;
    date?: string;
  }>;
  notes?: string;
}

export interface VirtualOfficeMeetingSummary {
  summary: string;
  brand?: { id: string; name: string; slug?: string };
  scope?: string;
  topic: string;
  departments: DepartmentScope[];
  recommendations: DepartmentRecommendation[];
  agenda: { title: string; desiredOutcome: string; owner?: string; dueDate?: string }[];
  actionItems: MeetingActionItem[];
  risks?: string[];
}

export async function listAgents(params?: { brandId?: string; scope?: string }) {
  // TODO: Replace with actual API call or stub
  return [];
}

export async function createAgent(payload: any) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function updateAgent(id: string, payload: any) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function deleteAgent(id: string) {
  // TODO: Replace with actual API call or stub
  return true;
}

export async function testAgent(id: string, payload: any) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function refreshInsights(payload: { brandId?: string; scope?: string }) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function listInsights(params?: {
  brandId?: string;
  domain?: string;
  scope?: string;
  agentId?: string;
  severity?: "low" | "medium" | "high";
  limit?: number;
  offset?: number;
  periodStart?: string;
  periodEnd?: string;
  sortOrder?: "asc" | "desc";
}) {
  // TODO: Replace with actual API call or stub
  return [];
}

export async function getInsight(id: string) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function createReport(payload: {
  title: string;
  brandId?: string;
  scope?: string;
  periodStart?: Date;
  periodEnd?: Date;
}) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function listReports(params?: {
  brandId?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  // TODO: Replace with actual API call or stub
  return [];
}

export async function getReport(id: string) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function getReportRendered(id: string) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function assistantChat(payload: any) {
  // TODO: Replace with actual API call or stub
  return null;
}

export async function listVirtualOfficeDepartments() {
  // TODO: Replace with actual API call or stub
  return [];
}

export async function runVirtualOfficeMeeting(payload: {
  topic: string;
  departments: DepartmentScope[];
  brandId?: string;
  scope?: string;
  agenda?: string[];
  notes?: string;
  standContext?: StandContextPayload;
  salesRepContext?: SalesRepContextPayload;
}) {
  // TODO: Replace with actual API call or stub
  return null;
}
