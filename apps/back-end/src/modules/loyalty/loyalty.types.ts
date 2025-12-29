export interface CreateLoyaltyInput {
  brandId?: string;
  programId: string;
  userId?: string;
  personId?: string;
  pointsBalance?: number;
  tier?: string;
}

export interface UpdateLoyaltyInput extends Partial<CreateLoyaltyInput> {
  pointsDelta?: number;
  reason?: string;
}

export interface LoyaltyCustomerRecord {
  id: string;
  brandId?: string;
  programId: string;
  userId?: string;
  personId?: string;
  pointsBalance: number;
  tier?: string;
  tierId?: string;
  tierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyProgramDTO {
  id: string;
  brandId?: string;
  name: string;
  description?: string | null;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTierDTO {
  id: string;
  brandId?: string;
  programId: string;
  name: string;
  minPoints: number;
  maxPoints?: number | null;
  benefitsDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyRewardDTO {
  id: string;
  brandId?: string;
  programId?: string;
  name: string;
  description?: string | null;
  pointsCost?: number | null;
  rewardType?: string | null;
  payloadJson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StandardResponse {
  success: boolean;
  message?: string;
}

export interface LoyaltyDashboardSummary {
  totalPrograms: number;
  totalCustomers: number;
  totalPoints: number;
  totalRewards: number;
  totalRedemptions: number;
  pointsSpent: number;
}

export interface LoyaltyTierChangedPayload {
  brandId?: string;
  customerId: string;
  oldTierId?: string;
  newTierId?: string;
  tierName?: string;
}

export interface LoyaltyRewardRedeemedPayload {
  brandId?: string;
  customerId: string;
  rewardId?: string;
  pointsCost?: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateLoyaltyProgramInput {
  brandId?: string;
  name: string;
  description?: string;
  status?: string;
}

export interface CreateLoyaltyTierInput {
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefitsDescription?: string;
}

export interface CreateLoyaltyRewardInput {
  name: string;
  description?: string;
  pointsCost: number;
  rewardType?: string;
  payloadJson?: Record<string, unknown> | string | null;
}

export interface RedeemRewardInput {
  customerId: string;
  metadata?: Record<string, unknown> | null;
}

export interface RedeemRewardResult {
  customerId: string;
  pointsBalance: number;
  tierId?: string;
}

export interface LoyaltyEventPayload {
  id: string;
  brandId?: string;
  programId?: string;
  pointsDelta?: number;
}

export interface LoyaltyActionContext {
  brandId?: string;
  actorUserId?: string;
}
