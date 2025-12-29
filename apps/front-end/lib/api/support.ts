// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.


export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string;
  priority?: string;
  assignee?: string | null;
  channel?: string | null;
  customer?: string | null;
  slaBreached?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportAiSummaryDto {
  severity: string;
  sentiment: string;
  intent: string;
  nextActions: string[];
}

export async function listSupportTickets(params?: Record<string, unknown>): Promise<SupportTicketDto[]> {
  return [];
}

export async function getSupportTicket(_id: string): Promise<SupportTicketDto | null> {
  return null;
}

export async function getSupportAiSummary(_id: string): Promise<SupportAiSummaryDto | null> {
  return null;
}
