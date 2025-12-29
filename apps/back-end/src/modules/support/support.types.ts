export interface TicketMessageDTO {
  id: string;
  ticketId: string;
  senderId?: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketTagDTO {
  id: string;
  name: string;
}

export interface TicketAssignmentDTO {
  id: string;
  userId?: string;
  brandId?: string;
  role?: string;
}

export interface TicketSummaryDTO {
  id: string;
  brandId: string | null;
  contactId: string | null;
  createdByUserId: string | null;
  assignedToUserId: string | null;
  status: string | null;
  channel: string | null;
  locale: string | null;
  source: string | null;
  priority: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  metadataJson: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  latestMessage?: TicketMessageDTO;
  tags: TicketTagDTO[];
  assignments: TicketAssignmentDTO[];
}

export interface TicketDTO extends TicketSummaryDTO {
  messages: TicketMessageDTO[];
}

export interface VoiceTranscriptDTO {
  id: string;
  sessionId: string;
  role: string | null;
  text: string | null;
  audioUrl: string | null;
  locale: string | null;
  action: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSessionDTO {
  id: string;
  brandId: string | null;
  tenantId: string | null;
  ticketId: string | null;
  channel: string | null;
  locale: string | null;
  status: string | null;
  startedAt: Date;
  endedAt: Date | null;
  updatedAt: Date;
  summary: string | null;
  sentiment: string | null;
  tags: string[];
  transcripts: VoiceTranscriptDTO[];
}

export interface TicketListParams {
  brandId: string;
  status?: string;
  assigneeId?: string;
  search?: string;
  channel?: string;
  page?: number;
  pageSize?: number;
}

export interface ConversationListParams {
  brandId: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTickets {
  items: TicketSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTicketInput {
  brandId: string;
  createdByUserId: string;
  contactId?: string;
  channel?: string;
  locale?: string;
  source?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedToUserId?: string;
  content?: string;
  metadata?: Record<string, unknown> | null;
}

export interface AddTicketMessageInput {
  ticketId: string;
  senderId: string;
  content: string;
  locale?: string;
}

export interface UpdateTicketStatusInput {
  ticketId: string;
  brandId: string;
  status: string;
  closedAt?: Date | null;
}

export interface AssignTicketInput {
  ticketId: string;
  assigneeUserId: string;
  brandAssignmentScope?: string;
  role?: string;
}

export interface SupportEventPayload {
  brandId?: string;
  ticketId?: string;
  action?: "created" | "email_sent" | "updated" | "closed" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}

export interface ConversationDTO {
  type: "ticket" | "voice";
  ticket?: TicketDTO;
  voiceSession?: VoiceSessionDTO;
}

export interface ConversationSummaryDTO {
  id: string;
  type: "ticket" | "voice";
  lastActivityAt: Date;
  ticket?: TicketSummaryDTO;
  voiceSession?: VoiceSessionDTO;
}

export interface ConversationsResponse {
  items: ConversationSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoiceTurnDTO {
  replyText: string;
  replyAudioUrl?: string;
  sessionState: "ongoing" | "ended" | "handoff";
  language: string;
  session: VoiceSessionDTO;
}

export interface ChannelConfigDTO {
  channels: { id: string; label: string; enabled: boolean; supportsVoice?: boolean }[];
  locales: string[];
  defaultLocale: string;
}

export interface TicketRoutingResult {
  topic?: string;
  urgency?: string;
  sentiment?: string;
  suggestedOwner?: string;
  escalationNeeded?: boolean;
  language?: string;
}

export interface StartVoiceSessionInput {
  brandId?: string;
  tenantId?: string;
  ticketId?: string;
  channel?: string;
  locale?: string;
}

export interface VoiceTurnInput {
  sessionId: string;
  audioUrl?: string;
  audioBase64?: string;
  locale?: string;
}

export interface EndVoiceSessionInput {
  sessionId: string;
  locale?: string;
}
